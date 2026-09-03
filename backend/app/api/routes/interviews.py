from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db
from backend.app.models.interview import Interview
from backend.app.models.application import Application
from backend.app.schemas.interview import InterviewResponse, InterviewCreate, InterviewUpdate
from backend.app.api.dependencies import get_current_candidate
from backend.app.models.candidate import CandidateProfile

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.get("", response_model=List[InterviewResponse])
async def list_interviews(
    application_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    query = (
        select(Interview)
        .join(Application)
        .where(Application.candidate_id == candidate.id)
        .options(selectinload(Interview.application).selectinload(Application.job))
        .order_by(desc(Interview.scheduled_at))
    )
    if application_id:
        query = query.where(Interview.application_id == application_id)

    result = await db.execute(query)
    interviews = result.scalars().all()
    
    responses = []
    for iv in interviews:
        resp = InterviewResponse.model_validate(iv)
        if iv.application and iv.application.job:
            resp.job_title = iv.application.job.title
            resp.company_name = iv.application.job.company
        responses.append(resp)
        
    return responses


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    interview_data: InterviewCreate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    # Verify application belongs to candidate
    app_res = await db.execute(
        select(Application).where(
            Application.id == interview_data.application_id,
            Application.candidate_id == candidate.id
        ).options(selectinload(Application.job))
    )
    app = app_res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    new_iv = Interview(**interview_data.model_dump())
    db.add(new_iv)

    # Auto-progress application status if currently in APPLIED or SCREEN
    if app.status in ("APPLIED", "QUALIFIED", "APPLICATION_VIEWED"):
        app.status = "TECHNICAL_INTERVIEW"

    await db.commit()
    await db.refresh(new_iv)

    resp = InterviewResponse.model_validate(new_iv)
    if app.job:
        resp.job_title = app.job.title
        resp.company_name = app.job.company
    return resp


@router.patch("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: str,
    update_data: InterviewUpdate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = (
        select(Interview)
        .join(Application)
        .where(Interview.id == interview_id, Application.candidate_id == candidate.id)
        .options(selectinload(Interview.application).selectinload(Application.job))
    )
    res = await db.execute(stmt)
    iv = res.scalar_one_or_none()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview record not found")

    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(iv, key, val)

    await db.commit()
    await db.refresh(iv)

    resp = InterviewResponse.model_validate(iv)
    if iv.application and iv.application.job:
        resp.job_title = iv.application.job.title
        resp.company_name = iv.application.job.company
    return resp


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = (
        select(Interview)
        .join(Application)
        .where(Interview.id == interview_id, Application.candidate_id == candidate.id)
    )
    res = await db.execute(stmt)
    iv = res.scalar_one_or_none()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
    await db.delete(iv)
    await db.commit()
