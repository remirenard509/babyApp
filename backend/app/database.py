import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@db:5432/babysitting_db"
)

# Correction pour les chaînes fournies par les hébergeurs (postgres:// ou postgresql:// -> postgresql+asyncpg://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# asyncpg ne supporte pas "?sslmode=..." dans l'URL et plante s'il est présent.
# On extrait les paramètres d'URL pour configurer SSL proprement via connect_args.
connect_args = {}
if "localhost" not in DATABASE_URL and "@db:" not in DATABASE_URL:
    parsed = urlparse(DATABASE_URL)
    query_params = parse_qs(parsed.query)
    
    # Retirer les paramètres SSL de la query string pour éviter les conflits asyncpg
    sslmode = query_params.pop("sslmode", [None])[0]
    query_params.pop("ssl", None)
    
    # Reconstruire l'URL propre sans sslmode
    clean_query = urlencode(query_params, doseq=True)
    DATABASE_URL = urlunparse(parsed._replace(query=clean_query))
    
    # Configurer le contexte SSL pour Supabase / Cloud DB
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_context

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
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

