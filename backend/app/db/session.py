from typing import AsyncGenerator
from contextlib import asynccontextmanager
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.logging import logger
from backend.app.db.session_manager import session_manager


async def get_db(request: Request) -> AsyncGenerator[AsyncSession, None]:
    """
    Dynamically resolves the scoped database session for the incoming request's
    X-Session-ID header. Ensures 100% ephemeral isolation between visitors.
    """
    session_id = None
    if request:
        try:
            session_id = request.headers.get("x-session-id") or request.query_params.get("session_id")
        except Exception:
            session_id = None
    
    session_maker, _ = await session_manager.get_or_create_session(session_id)
    
    async with session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initializes the default guest session DB for server startup checks."""
    logger.info("Initializing ephemeral session manager...")
    await session_manager.get_or_create_session("guest_default")
    logger.info("Ephemeral session engine ready.")


# Helper for standalone CLI / test runner access
@asynccontextmanager
async def AsyncSessionLocal() -> AsyncGenerator[AsyncSession, None]:
    maker, _ = await session_manager.get_or_create_session("guest_default")
    async with maker() as session:
        yield session
