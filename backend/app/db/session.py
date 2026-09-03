from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from backend.app.core.config import settings
from backend.app.core.logging import logger

# Create engine with appropriate pool arguments based on DB type
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    from backend.app.models.base import Base
    # Import all models so that Base.metadata has all table definitions registered
    import backend.app.models.candidate # noqa
    import backend.app.models.skill # noqa
    import backend.app.models.job # noqa
    import backend.app.models.application # noqa
    import backend.app.models.interview # noqa
    import backend.app.models.follow_up # noqa
    import backend.app.models.resume # noqa
    import backend.app.models.feedback # noqa
    import backend.app.models.search # noqa
    import backend.app.models.notification # noqa

    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        def migrate_sqlite_columns(connection):
            try:
                cursor = connection.execute("PRAGMA table_info(jobs)")
                cols = [row[1] for row in cursor.fetchall()]
                if "posted_at" not in cols:
                    connection.execute("ALTER TABLE jobs ADD COLUMN posted_at DATETIME;")
                    logger.info("Added missing posted_at column to jobs table.")
            except Exception as ex:
                logger.debug(f"SQLite column migration note: {ex}")

        await conn.run_sync(migrate_sqlite_columns)
    logger.info("Database tables initialized successfully.")
