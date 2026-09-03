from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends, HTTPException
from backend.app.db.session import get_db
from backend.app.models.candidate import CandidateProfile


async def get_current_candidate(db: AsyncSession = Depends(get_db)) -> CandidateProfile:
    """
    Retrieves the active candidate profile (single user personal OS model).
    """
    result = await db.execute(select(CandidateProfile))
    candidate = result.scalars().first()
    if not candidate:
        # Create empty profile ready for dynamic population
        candidate = CandidateProfile(
            full_name="",
            target_roles=[],
            preferred_locations=[],
            workplace_types=[],
            min_salary=0,
            target_salary=0,
            currency="USD",
            years_of_experience=0,
            education_level=None
        )
        db.add(candidate)
        await db.commit()
        await db.refresh(candidate)
    return candidate

