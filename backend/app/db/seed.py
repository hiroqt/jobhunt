from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.logging import logger


async def seed_initial_data(db: AsyncSession) -> None:
    """
    Dynamic initialization hook. No predefined or hardcoded data is added.
    Skills, jobs, and candidate profiles are created dynamically through user interactions.
    """
    logger.info("Database initialized in dynamic mode (no predefined seed data).")

