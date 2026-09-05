import asyncio
import os
import shutil
import time
from pathlib import Path
from typing import Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.config import settings
from backend.app.core.logging import logger

SESSION_DIR = Path("/tmp/jobhunt_ephemeral_sessions")


class EphemeralSessionInstance:
    def __init__(self, session_id: str, engine: AsyncEngine, session_maker: async_sessionmaker):
        self.session_id = session_id
        self.engine = engine
        self.session_maker = session_maker
        self.last_accessed = time.time()
        self.created_at = time.time()

    def touch(self):
        self.last_accessed = time.time()


class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, EphemeralSessionInstance] = {}
        self._lock = asyncio.Lock()
        SESSION_DIR.mkdir(parents=True, exist_ok=True)

    async def get_or_create_session(self, session_id: Optional[str] = None) -> Tuple[async_sessionmaker, str]:
        if not session_id or not session_id.strip():
            session_id = "guest_default"
        
        # Sanitize session_id to alphanumeric + dashes/underscores
        clean_id = "".join(c for c in session_id if c.isalnum() or c in "-_")[:64]
        if not clean_id:
            clean_id = "guest_default"

        async with self._lock:
            if clean_id in self._sessions:
                inst = self._sessions[clean_id]
                inst.touch()
                return inst.session_maker, clean_id

            # Create new isolated ephemeral SQLite database for this session
            db_path = SESSION_DIR / f"{clean_id}.db"
            db_url = f"sqlite+aiosqlite:///{db_path}"
            
            engine = create_async_engine(
                db_url,
                echo=False,
                future=True,
                connect_args={"check_same_thread": False},
            )
            
            session_maker = async_sessionmaker(
                bind=engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autocommit=False,
                autoflush=False,
            )

            # Initialize tables and seed initial taxonomy
            await self._init_session_db(engine, session_maker)

            inst = EphemeralSessionInstance(clean_id, engine, session_maker)
            self._sessions[clean_id] = inst
            logger.info(f"Initialized new ephemeral guest session: {clean_id}")
            return session_maker, clean_id

    async def _init_session_db(self, engine: AsyncEngine, session_maker: async_sessionmaker):
        from backend.app.models.base import Base
        # Register all models
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

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Seed taxonomy & initial candidate profile
        from backend.app.db.seed import seed_initial_data
        async with session_maker() as session:
            try:
                await seed_initial_data(session)
            except Exception as e:
                logger.warning(f"Error seeding session database: {e}")

    async def purge_session(self, session_id: str) -> bool:
        clean_id = "".join(c for c in session_id if c.isalnum() or c in "-_")[:64]
        async with self._lock:
            if clean_id in self._sessions:
                inst = self._sessions.pop(clean_id)
                try:
                    await inst.engine.dispose()
                except Exception as e:
                    logger.warning(f"Error disposing engine for session {clean_id}: {e}")

            db_path = SESSION_DIR / f"{clean_id}.db"
            if db_path.exists():
                try:
                    os.remove(db_path)
                except Exception as e:
                    logger.warning(f"Error removing db file for session {clean_id}: {e}")
            logger.info(f"Purged ephemeral guest session: {clean_id}")
            return True

    async def cleanup_expired_sessions(self, max_idle_seconds: int = 3600):
        """Purges sessions that have been idle for longer than max_idle_seconds (default 1 hour)."""
        now = time.time()
        expired_ids = []
        async with self._lock:
            for sid, inst in self._sessions.items():
                if now - inst.last_accessed > max_idle_seconds:
                    expired_ids.append(sid)

        for sid in expired_ids:
            await self.purge_session(sid)

    def get_active_session_count(self) -> int:
        return len(self._sessions)


# Global singleton instance
session_manager = SessionManager()
