from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import User, Profile, Review, UserRole, VerificationStatus
from ..schemas import UserResponse, ReviewResponse, VerifyUserRequest
from ..auth import require_roles

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/verifications", response_model=List[UserResponse])
async def list_pending_verifications(
    admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).join(Profile, Profile.user_id == User.id).options(
        selectinload(User.profile)
    ).where(
        Profile.verification_status == VerificationStatus.PENDING
    ).order_by(User.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()

@router.post("/verify-user")
async def verify_user(
    req: VerifyUserRequest,
    admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Profile).where(Profile.user_id == req.user_id)
    profile = (await db.execute(stmt)).scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil introuvable.")

    if req.action == "APPROVE":
        profile.verification_status = VerificationStatus.APPROVED
        profile.is_verified = True
    elif req.action == "REJECT":
        profile.verification_status = VerificationStatus.REJECTED
        profile.is_verified = False

    await db.commit()
    return {"message": f"Statut de vérification mis à jour : {profile.verification_status.value}"}

@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).options(selectinload(User.profile)).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")

    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible de désactiver son propre compte administrateur.")

    user.is_active = not user.is_active
    await db.commit()
    return {"message": "Statut utilisateur mis à jour.", "is_active": user.is_active}

@router.get("/reviews", response_model=List[ReviewResponse])
async def list_all_reviews(
    admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Review).options(
        selectinload(Review.parent).selectinload(User.profile)
    ).order_by(Review.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: int,
    admin: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Review).where(Review.id == review_id)
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avis introuvable.")

    await db.delete(review)
    await db.commit()
    return {"message": "Avis supprimé avec succès."}

