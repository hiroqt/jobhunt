import pytest
import pytest_asyncio
from backend.app.models.base import Base
from backend.app.db.session import get_db, init_db
from backend.app.db.session_manager import session_manager
from backend.app.main import app
import backend.app.models # noqa


@pytest_asyncio.fixture(autouse=True)
async def clean_test_session():
    """Ensure every test runs with a fresh ephemeral session."""
    await session_manager.purge_session("guest_default")
    await init_db()
    yield
    await session_manager.purge_session("guest_default")
