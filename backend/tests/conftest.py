import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.app.models.base import Base
from backend.app.db.session import engine, get_db
from backend.app.main import app
from backend.app.db.seed import seed_initial_data
import backend.app.models # noqa


@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database():
    """Ensure all tables are freshly created for test runs."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
