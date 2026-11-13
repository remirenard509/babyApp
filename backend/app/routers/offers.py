from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Offer, User, UserRole, OfferStatus
from ..schemas import OfferCreate, OfferResponse
from ..auth import get_current_user, require_roles

router = APIRouter(prefix="/api/offers", tags=["offers"])

@router.get("", response_model=List[OfferResponse])
async def list_offers(
    city: Optional[str] = Query(None, description="Filtrer par ville"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Offer).options(
        selectinload(Offer.parent).selectinload(User.profile)
    ).where(Offer.status == OfferStatus.OPEN).order_by(Offer.date.desc())

    if city and city.strip():
        query = query.where(Offer.city.ilike(f"%{city.strip()}%"))

    result = await db.execute(query)
    offers = result.scalars().all()
    return offers

@router.get("/my", response_model=List[OfferResponse])
async def list_my_offers(
    current_user: User = Depends(require_roles([UserRole.PARENT])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Offer).options(
        selectinload(Offer.parent).selectinload(User.profile)
    ).where(Offer.parent_id == current_user.id).order_by(Offer.date.desc())

    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_in: OfferCreate,
    current_user: User = Depends(require_roles([UserRole.PARENT])),
    db: AsyncSession = Depends(get_db)
):
    offer = Offer(
        parent_id=current_user.id,
        title=offer_in.title,
        description=offer_in.description,
        date=offer_in.date,
        start_time=offer_in.start_time,
        end_time=offer_in.end_time,
        hourly_rate=offer_in.hourly_rate,
        city=offer_in.city,
        status=OfferStatus.OPEN
    )
    db.add(offer)
    await db.commit()
    await db.refresh(offer)

    # Récupérer avec le parent attaché
    stmt = select(Offer).options(
        selectinload(Offer.parent).selectinload(User.profile)
    ).where(Offer.id == offer.id)
    return (await db.execute(stmt)).scalar_one()

@router.patch("/{offer_id}/close", response_model=OfferResponse)
async def close_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Offer).where(Offer.id == offer_id)
    offer = (await db.execute(stmt)).scalar_one_or_none()

    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre introuvable.")
    if offer.parent_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à modifier cette offre."
        )

    offer.status = OfferStatus.CLOSED
    await db.commit()
    await db.refresh(offer)
    return offer

@router.delete("/{offer_id}", status_code=status.HTTP_200_OK)
async def delete_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Offer).where(Offer.id == offer_id)
    offer = (await db.execute(stmt)).scalar_one_or_none()

    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre introuvable.")
    if offer.parent_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à supprimer cette offre."
        )

    await db.delete(offer)
    await db.commit()
    return {"message": "Offre supprimée avec succès."}

