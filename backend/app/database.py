from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import get_settings
from app.base import Base  # noqa: F401 — re-exported so routers can do: from app.database import Base

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_all_tables():
    """
    Called at startup (lifespan). Imports all models so SQLAlchemy's metadata
    knows about every table, then creates any that don't exist yet.
    Safe to call repeatedly — CREATE TABLE IF NOT EXISTS semantics.
    """
    import app.models  # noqa: F401 — side-effect: registers all ORM models with Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
