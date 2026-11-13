from datetime import datetime, date, time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Booking, User, Profile, UserRole, BookingStatus, Review
from ..schemas import BookingCreate, BookingResponse, BookingStatusUpdate
from ..auth import get_current_user

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

def calculate_duration_hours(start_time: time, end_time: time) -> float:
    dummy_date = date.today()
    dt_start = datetime.combine(dummy_date, start_time)
    dt_end = datetime.combine(dummy_date, end_time)
    if dt_end <= dt_start:
        # Cas où la garde passe minuit
        dt_end = datetime.combine(date.fromordinal(dummy_date.toordinal() + 1), end_time)
    diff = dt_end - dt_start
    return diff.total_seconds() / 3600.0

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_in: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les parents peuvent effectuer une réservation."
        )

    # Récupérer le babysitter et son profil
    stmt = select(User).where(User.id == booking_in.babysitter_id).options(selectinload(User.profile))
    babysitter = (await db.execute(stmt)).scalar_one_or_none()

    if not babysitter or babysitter.role != UserRole.BABYSITTER:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Babysitter introuvable.")

    rate = babysitter.profile.hourly_rate if babysitter.profile and babysitter.profile.hourly_rate else 12.0
    hours = calculate_duration_hours(booking_in.start_time, booking_in.end_time)
    total_price = round(hours * rate, 2)

    booking = Booking(
        parent_id=current_user.id,
        babysitter_id=booking_in.babysitter_id,
        date=booking_in.date,
        start_time=booking_in.start_time,
        end_time=booking_in.end_time,
        children_count=booking_in.children_count,
        notes=booking_in.notes,
        total_price=total_price,
        status=BookingStatus.PENDING
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    # Recharger avec les relations
    res = await db.execute(
        select(Booking)
        .options(
            selectinload(Booking.parent).selectinload(User.profile),
            selectinload(Booking.babysitter).selectinload(User.profile)
        )
        .where(Booking.id == booking.id)
    )
    return res.scalar_one()

@router.get("", response_model=List[BookingResponse])
async def list_my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Booking).options(
        selectinload(Booking.parent).selectinload(User.profile),
        selectinload(Booking.babysitter).selectinload(User.profile),
        selectinload(Booking.review).selectinload(Review.parent).selectinload(User.profile)
    )

    if current_user.role == UserRole.PARENT:
        query = query.where(Booking.parent_id == current_user.id)
    elif current_user.role == UserRole.BABYSITTER:
        query = query.where(Booking.babysitter_id == current_user.id)
    elif current_user.role == UserRole.ADMIN:
        pass
    else:
        return []

    query = query.order_by(Booking.date.desc(), Booking.start_time.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    booking_id: int,
    status_update: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Booking).options(
        selectinload(Booking.parent).selectinload(User.profile),
        selectinload(Booking.babysitter).selectinload(User.profile),
        selectinload(Booking.review)
    ).where(Booking.id == booking_id)
    booking = (await db.execute(stmt)).scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réservation introuvable.")

    new_status = status_update.status

    if current_user.role == UserRole.BABYSITTER:
        if booking.babysitter_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Action non autorisée.")
        if new_status not in [BookingStatus.ACCEPTED, BookingStatus.REJECTED, BookingStatus.COMPLETED]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statut non valide.")
        booking.status = new_status

    elif current_user.role == UserRole.PARENT:
        if booking.parent_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Action non autorisée.")
        if new_status != BookingStatus.COMPLETED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le parent peut uniquement marquer comme terminée.")
        booking.status = new_status

    elif current_user.role == UserRole.ADMIN:
        booking.status = new_status

    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé.")

    await db.commit()
    await db.refresh(booking)
    return booking

