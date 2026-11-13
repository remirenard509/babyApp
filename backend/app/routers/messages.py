from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Conversation, Message, User, UserRole
from ..schemas import ConversationResponse, MessageResponse, MessageCreate, ConversationStart
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["messages"])

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Conversation).options(
        selectinload(Conversation.parent).selectinload(User.profile),
        selectinload(Conversation.babysitter).selectinload(User.profile),
        selectinload(Conversation.messages)
    ).where(
        (Conversation.parent_id == current_user.id) | (Conversation.babysitter_id == current_user.id)
    ).order_by(Conversation.updated_at.desc())

    result = await db.execute(query)
    conversations = result.scalars().all()

    conv_list = []
    for conv in conversations:
        last_msg = conv.messages[-1] if conv.messages else None
        last_msg_resp = MessageResponse.model_validate(last_msg) if last_msg else None
        conv_list.append(
            ConversationResponse(
                id=conv.id,
                parent_id=conv.parent_id,
                babysitter_id=conv.babysitter_id,
                updated_at=conv.updated_at,
                parent=conv.parent,
                babysitter=conv.babysitter,
                last_message=last_msg_resp
            )
        )
    return conv_list

@router.post("/conversations", response_model=ConversationResponse)
async def start_conversation(
    conv_in: ConversationStart,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    recipient_stmt = select(User).where(User.id == conv_in.recipient_id)
    recipient = (await db.execute(recipient_stmt)).scalar_one_or_none()

    if not recipient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destinataire introuvable.")

    if current_user.id == recipient.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible de démarrer une conversation avec soi-même.")

    if current_user.role == UserRole.PARENT and recipient.role == UserRole.BABYSITTER:
        parent_id, babysitter_id = current_user.id, recipient.id
    elif current_user.role == UserRole.BABYSITTER and recipient.role == UserRole.PARENT:
        parent_id, babysitter_id = recipient.id, current_user.id
    else:
        # Permettre tout de même si nécessaire
        parent_id = current_user.id if current_user.role == UserRole.PARENT else recipient.id
        babysitter_id = recipient.id if current_user.role == UserRole.PARENT else current_user.id

    # Chercher conversation existante
    stmt = select(Conversation).options(
        selectinload(Conversation.parent).selectinload(User.profile),
        selectinload(Conversation.babysitter).selectinload(User.profile),
        selectinload(Conversation.messages)
    ).where(
        Conversation.parent_id == parent_id,
        Conversation.babysitter_id == babysitter_id
    )
    existing_conv = (await db.execute(stmt)).scalar_one_or_none()

    if existing_conv:
        last_msg = existing_conv.messages[-1] if existing_conv.messages else None
        return ConversationResponse(
            id=existing_conv.id,
            parent_id=existing_conv.parent_id,
            babysitter_id=existing_conv.babysitter_id,
            updated_at=existing_conv.updated_at,
            parent=existing_conv.parent,
            babysitter=existing_conv.babysitter,
            last_message=MessageResponse.model_validate(last_msg) if last_msg else None
        )

    # Créer nouvelle conversation
    new_conv = Conversation(parent_id=parent_id, babysitter_id=babysitter_id, updated_at=datetime.utcnow())
    db.add(new_conv)
    await db.commit()
    await db.refresh(new_conv)

    res = await db.execute(
        select(Conversation)
        .options(
            selectinload(Conversation.parent).selectinload(User.profile),
            selectinload(Conversation.babysitter).selectinload(User.profile)
        )
        .where(Conversation.id == new_conv.id)
    )
    created = res.scalar_one()
    return ConversationResponse(
        id=created.id,
        parent_id=created.parent_id,
        babysitter_id=created.babysitter_id,
        updated_at=created.updated_at,
        parent=created.parent,
        babysitter=created.babysitter,
        last_message=None
    )

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    conv = (await db.execute(stmt)).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation introuvable.")

    if current_user.id not in [conv.parent_id, conv.babysitter_id] and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit à cette conversation.")

    msg_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    messages = (await db.execute(msg_stmt)).scalars().all()
    return messages

@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Conversation).where(Conversation.id == msg_in.conversation_id)
    conv = (await db.execute(stmt)).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation introuvable.")

    if current_user.id not in [conv.parent_id, conv.babysitter_id]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé.")

    msg = Message(
        conversation_id=msg_in.conversation_id,
        sender_id=current_user.id,
        content=msg_in.content,
        created_at=datetime.utcnow()
    )
    conv.updated_at = datetime.utcnow()
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg

