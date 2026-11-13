import os
import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@db:5432/babysitting_db"
)

# Correction automatique du schéma d'URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Détection env cloud (Vercel / Supabase) vs local Docker
IS_CLOUD = "localhost" not in DATABASE_URL and "@db:" not in DATABASE_URL

connect_args = {}
if IS_CLOUD:
    parsed = urlparse(DATABASE_URL)
    query_params = parse_qs(parsed.query)
    # Retirer sslmode et ssl de l'URL (asyncpg ne les supporte pas dans la query string)
    query_params.pop("sslmode", None)
    query_params.pop("ssl", None)
    clean_query = urlencode(query_params, doseq=True)
    DATABASE_URL = urlunparse(parsed._replace(query=clean_query))
    # Contexte SSL compatible Supabase
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_context

# NullPool sur Vercel Serverless : chaque requête ouvre et ferme sa propre
# connexion, ce qui évite les connexions "fantômes" périmées entre deux
# cold-starts. En local Docker on garde le pool par défaut.
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    poolclass=NullPool if IS_CLOUD else None,
    pool_pre_ping=not IS_CLOUD,   # inutile avec NullPool
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

