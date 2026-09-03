from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db
from backend.app.models.follow_up import FollowUp
from backend.app.models.application import Application
from backend.app.schemas.follow_up import FollowUpResponse, FollowUpCreate, FollowUpUpdate
from backend.app.api.dependencies import get_current_candidate
from backend.app.models.candidate import CandidateProfile

router = APIRouter(prefix="/follow-ups", tags=["Follow-ups"])


@router.get("", response_model=List[FollowUpResponse])
async def list_follow_ups(
    completed: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    query = (
        select(FollowUp)
        .join(Application)
        .where(Application.candidate_id == candidate.id)
        .options(selectinload(FollowUp.application).selectinload(Application.job))
        .order_by(FollowUp.due_date.asc())
    )
    if completed is not None:
        query = query.where(FollowUp.is_completed == completed)

    result = await db.execute(query)
    follow_ups = result.scalars().all()

    responses = []
    for fu in follow_ups:
        resp = FollowUpResponse.model_validate(fu)
        if fu.application and fu.application.job:
            resp.job_title = fu.application.job.title
            resp.company_name = fu.application.job.company
        responses.append(resp)

    return responses


@router.post("", response_model=FollowUpResponse, status_code=status.HTTP_201_CREATED)
async def create_follow_up(
    fu_data: FollowUpCreate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    app_res = await db.execute(
        select(Application).where(
            Application.id == fu_data.application_id,
            Application.candidate_id == candidate.id
        ).options(selectinload(Application.job))
    )
    app = app_res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    fu = FollowUp(**fu_data.model_dump())
    db.add(fu)
    await db.commit()
    await db.refresh(fu)

    resp = FollowUpResponse.model_validate(fu)
    if app.job:
        resp.job_title = app.job.title
        resp.company_name = app.job.company
    return resp


@router.patch("/{follow_up_id}", response_model=FollowUpResponse)
async def update_follow_up(
    follow_up_id: str,
    update_data: FollowUpUpdate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = (
        select(FollowUp)
        .join(Application)
        .where(FollowUp.id == follow_up_id, Application.candidate_id == candidate.id)
        .options(selectinload(FollowUp.application).selectinload(Application.job))
    )
    res = await db.execute(stmt)
    fu = res.scalar_one_or_none()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up record not found")

    update_dict = update_data.model_dump(exclude_unset=True)
    if "is_completed" in update_dict and update_dict["is_completed"] and not fu.completed_at:
        fu.completed_at = datetime.now(timezone.utc)

    for key, val in update_dict.items():
        setattr(fu, key, val)

    await db.commit()
    await db.refresh(fu)

    resp = FollowUpResponse.model_validate(fu)
    if fu.application and fu.application.job:
        resp.job_title = fu.application.job.title
        resp.company_name = fu.application.job.company
    return resp


@router.delete("/{follow_up_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_follow_up(
    follow_up_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = (
        select(FollowUp)
        .join(Application)
        .where(FollowUp.id == follow_up_id, Application.candidate_id == candidate.id)
    )
    res = await db.execute(stmt)
    fu = res.scalar_one_or_none()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    await db.delete(fu)
    await db.commit()
