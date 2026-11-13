import os
import shutil
import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import User, Profile, UserRole, VerificationStatus, Review
from ..schemas import ProfileResponse, ProfileUpdate
from ..auth import get_current_user
from ..storage import upload_file_to_storage

router = APIRouter(prefix="/api/profiles", tags=["profiles"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
except OSError:
    pass

def calculate_age(birth_date: Optional[date]) -> Optional[int]:
    if not birth_date:
        return None
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

async def enrich_profile(profile: Profile, db: AsyncSession) -> ProfileResponse:
    # Calculer avis et note moyenne
    stmt = select(
        func.count(Review.id).label("count"),
        func.avg(Review.rating).label("avg_rating")
    ).where(Review.babysitter_id == profile.user_id)
    result = (await db.execute(stmt)).first()

    reviews_count = result.count if result and result.count else 0
    avg_rating = round(float(result.avg_rating), 1) if result and result.avg_rating else 0.0

    calculated_age = calculate_age(profile.birth_date)

    data = {
        "user_id": profile.user_id,
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "city": profile.city,
        "postal_code": profile.postal_code,
        "avatar_url": profile.avatar_url,
        "bio": profile.bio,
        "birth_date": profile.birth_date,
        "hourly_rate": profile.hourly_rate,
        "experience_years": profile.experience_years,
        "is_verified": profile.is_verified,
        "verification_doc_url": profile.verification_doc_url,
        "verification_status": profile.verification_status,
        "calculated_age": calculated_age,
        "average_rating": avg_rating,
        "reviews_count": reviews_count,
    }
    return ProfileResponse(**data)

@router.get("/search", response_model=List[ProfileResponse])
async def search_babysitters(
    city: Optional[str] = Query(None, description="Ville ou code postal"),
    max_rate: Optional[float] = Query(None, description="Tarif horaire max"),
    min_age: Optional[int] = Query(None, description="Âge minimal"),
    max_age: Optional[int] = Query(None, description="Âge maximal"),
    verified_only: Optional[bool] = Query(None, description="Profils vérifiés uniquement"),
    limit: Optional[int] = Query(None, description="Limite de résultats"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Profile).join(User, User.id == Profile.user_id).where(
        User.role == UserRole.BABYSITTER,
        User.is_active == True
    )

    if city and city.strip():
        search_term = f"%{city.strip()}%"
        query = query.where(
            (Profile.city.ilike(search_term)) | (Profile.postal_code.ilike(search_term))
        )

    if max_rate is not None:
        query = query.where(Profile.hourly_rate <= max_rate)

    if verified_only:
        query = query.where(Profile.is_verified == True)

    result = await db.execute(query)
    profiles = result.scalars().all()

    enriched_profiles = []
    today = date.today()

    for p in profiles:
        calc_age = calculate_age(p.birth_date)
        if min_age is not None and (calc_age is None or calc_age < min_age):
            continue
        if max_age is not None and (calc_age is not None and calc_age > max_age):
            continue
        enriched = await enrich_profile(p, db)
        enriched_profiles.append(enriched)

    if limit is not None:
        enriched_profiles = enriched_profiles[:limit]

    return enriched_profiles

@router.get("/{user_id}", response_model=ProfileResponse)
async def get_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Profile).where(Profile.user_id == user_id)
    profile = (await db.execute(stmt)).scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil introuvable."
        )
    return await enrich_profile(profile, db)

@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    profile = (await db.execute(stmt)).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil non trouvé.")

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)

    await db.commit()
    await db.refresh(profile)
    return await enrich_profile(profile, db)

@router.post("/me/avatar", response_model=ProfileResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    profile = (await db.execute(stmt)).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil non trouvé.")

    content = await file.read()
    content_type = file.content_type or "image/jpeg"
    file_url = await upload_file_to_storage(content, file.filename or "avatar.jpg", content_type)

    profile.avatar_url = file_url
    await db.commit()
    await db.refresh(profile)
    return await enrich_profile(profile, db)

@router.post("/me/upload-doc", response_model=ProfileResponse)
async def upload_verification_doc(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.BABYSITTER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les babysitters peuvent téléverser des justificatifs d'identité."
        )

    stmt = select(Profile).where(Profile.user_id == current_user.id)
    profile = (await db.execute(stmt)).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil non trouvé.")

    content = await file.read()
    content_type = file.content_type or "application/pdf"
    file_url = await upload_file_to_storage(content, file.filename or "doc.pdf", content_type)

    profile.verification_doc_url = file_url
    profile.verification_status = VerificationStatus.PENDING
    await db.commit()
    await db.refresh(profile)
    return await enrich_profile(profile, db)

