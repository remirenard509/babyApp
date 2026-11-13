import os
from contextlib import asynccontextmanager
from datetime import date
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select

from .database import engine, Base, AsyncSessionLocal
from .models import User, Profile, UserRole, VerificationStatus, Offer, OfferStatus, Booking, BookingStatus, Review
from .auth import get_password_hash
from .routers import auth, profiles, offers, bookings, messages, reviews, admin

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def init_db_and_seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Initialiser les données de démonstration si la base est vide
    async with AsyncSessionLocal() as db:
        admin_check = await db.execute(select(User).where(User.email == "admin@babyapp.fr"))
        if not admin_check.scalar_one_or_none():
            # 1. Admin
            admin_user = User(
                email="admin@babyapp.fr",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            await db.flush()
            admin_profile = Profile(
                user_id=admin_user.id,
                first_name="Super",
                last_name="Admin",
                city="Paris",
                postal_code="75001"
            )
            db.add(admin_profile)

            # 2. Babysitter 1 - Sophie (Vérifiée)
            b1 = User(
                email="sophie.martin@example.com",
                password_hash=get_password_hash("password123"),
                role=UserRole.BABYSITTER,
                is_active=True
            )
            db.add(b1)
            await db.flush()
            p1 = Profile(
                user_id=b1.id,
                first_name="Sophie",
                last_name="Martin",
                city="Orléans",
                postal_code="45000",
                bio="Étudiante en psychologie, sérieuse, douce et attentive aux rythmes de l'enfant. Titulaire du PSC1 et du BAFA.",
                birth_date=date(2004, 3, 15),
                hourly_rate=12.0,
                experience_years=3,
                is_verified=True,
                verification_status=VerificationStatus.APPROVED,
                avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"
            )
            db.add(p1)

            # 3. Babysitter 2 - Thomas
            b2 = User(
                email="thomas.leroy@example.com",
                password_hash=get_password_hash("password123"),
                role=UserRole.BABYSITTER,
                is_active=True
            )
            db.add(b2)
            await db.flush()
            p2 = Profile(
                user_id=b2.id,
                first_name="Thomas",
                last_name="Leroy",
                city="Orléans",
                postal_code="45000",
                bio="Animateur passionné en centre de loisirs, grand adepte de jeux de société et d'activités créatives.",
                birth_date=2001 and date(2001, 7, 20),
                hourly_rate=14.0,
                experience_years=4,
                is_verified=False,
                verification_status=VerificationStatus.PENDING,
                avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
            )
            db.add(p2)

            # 4. Babysitter 3 - Camille (Vérifiée)
            b3 = User(
                email="camille.rousseau@example.com",
                password_hash=get_password_hash("password123"),
                role=UserRole.BABYSITTER,
                is_active=True
            )
            db.add(b3)
            await db.flush()
            p3 = Profile(
                user_id=b3.id,
                first_name="Camille",
                last_name="Rousseau",
                city="Jargeau",
                postal_code="45150",
                bio="Éducatrice de jeunes enfants en formation, 5 ans de baby-sitting régulier auprès de nourrissons et enfants jusqu'à 10 ans.",
                birth_date=date(2002, 11, 5),
                hourly_rate=13.0,
                experience_years=5,
                is_verified=True,
                verification_status=VerificationStatus.APPROVED,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
            )
            db.add(p3)

            # 5. Parent 1 - Marie
            parent1 = User(
                email="marie.dupont@example.com",
                password_hash=get_password_hash("password123"),
                role=UserRole.PARENT,
                is_active=True
            )
            db.add(parent1)
            await db.flush()
            p_parent1 = Profile(
                user_id=parent1.id,
                first_name="Marie",
                last_name="Dupont",
                city="Orléans",
                postal_code="45000",
                bio="Maman de deux adorables garçons de 4 et 7 ans.",
                avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
            )
            db.add(p_parent1)

            # 6. Offres initiales
            off1 = Offer(
                parent_id=parent1.id,
                title="Recherche babysitter pour soirée samedi",
                description="Besoin d'une personne de confiance pour 2 enfants (3 et 6 ans). Jeux calmes et coucher vers 21h.",
                date=date(2026, 6, 15),
                start_time=date(2026, 6, 15) and __import__("datetime").time(19, 0),
                end_time=__import__("datetime").time(23, 0),
                hourly_rate=13.0,
                city="Orléans",
                status=OfferStatus.OPEN
            )
            off2 = Offer(
                parent_id=parent1.id,
                title="Garde régulière les mardis soirs",
                description="Sortie d'école à 16h30, aide aux devoirs et préparation du repas jusqu'à 19h30.",
                date=date(2026, 6, 16),
                start_time=__import__("datetime").time(16, 30),
                end_time=__import__("datetime").time(19, 30),
                hourly_rate=12.5,
                city="Saint-Jean-de-Braye",
                status=OfferStatus.OPEN
            )
            db.add_all([off1, off2])

            # 7. Réservation terminée avec Sophie pour avis
            book1 = Booking(
                parent_id=parent1.id,
                babysitter_id=b1.id,
                date=date(2026, 5, 10),
                start_time=__import__("datetime").time(18, 0),
                end_time=__import__("datetime").time(22, 0),
                children_count=2,
                notes="Tout s'est très bien passé.",
                total_price=48.0,
                status=BookingStatus.COMPLETED
            )
            db.add(book1)
            await db.flush()

            rev1 = Review(
                booking_id=book1.id,
                parent_id=parent1.id,
                babysitter_id=b1.id,
                rating=5,
                comment="Super avec les enfants, ponctuelle, attentionnée et très douce ! Je recommande les yeux fermés."
            )
            db.add(rev1)

            await db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_and_seed()
    yield

app = FastAPI(
    title="Plateforme Babysitting MVP API",
    description="Backend FastAPI selon les spécifications strictes GEMINI.md",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fichiers Statiques Uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Inclusion des 7 routeurs
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(offers.router)
app.include_router(bookings.router)
app.include_router(messages.router)
app.include_router(reviews.router)
app.include_router(admin.router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": "Babysitting MVP API"}

