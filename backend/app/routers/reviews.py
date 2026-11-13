from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Review, Booking, User, UserRole, BookingStatus
from ..schemas import ReviewCreate, ReviewResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

@router.get("/babysitter/{babysitter_id}", response_model=List[ReviewResponse])
async def get_babysitter_reviews(babysitter_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Review).options(
        selectinload(Review.parent).selectinload(User.profile)
    ).where(Review.babysitter_id == babysitter_id).order_by(Review.created_at.desc())

    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seuls les parents peuvent laisser un avis.")

    stmt = select(Booking).where(Booking.id == review_in.booking_id)
    booking = (await db.execute(stmt)).scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réservation introuvable.")
    if booking.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous ne pouvez noter que vos propres réservations.")
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La réservation doit être terminée pour laisser un avis.")

    # Vérifier si un avis existe déjà
    existing_stmt = select(Review).where(Review.booking_id == booking.id)
    existing_review = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing_review:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Un avis a déjà été soumis pour cette réservation.")

    review = Review(
        booking_id=booking.id,
        parent_id=current_user.id,
        babysitter_id=booking.babysitter_id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    res = await db.execute(
        select(Review)
        .options(selectinload(Review.parent).selectinload(User.profile))
        .where(Review.id == review.id)
    )
    return res.scalar_one()

