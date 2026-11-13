from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import User, Profile, UserRole, VerificationStatus
from ..schemas import UserRegister, UserLogin, Token, UserResponse
from ..auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # Vérifier si l'email existe déjà
    stmt = select(User).where(User.email == user_in.email)
    existing_user = (await db.execute(stmt)).scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte avec cette adresse email existe déjà."
        )

    # Création de l'utilisateur
    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    # Création du profil rattaché
    new_profile = Profile(
        user_id=new_user.id,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        city=user_in.city,
        postal_code=user_in.postal_code,
        verification_status=VerificationStatus.NONE
    )
    db.add(new_profile)
    await db.commit()

    # Génération du token JWT
    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == credentials.email).options(selectinload(User.profile))
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ou mot de passe incorrect."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte est désactivé. Veuillez contacter l'administrateur."
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

