from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db
from backend.app.models.application import Application, ApplicationTimeline
from backend.app.models.job import Job
from backend.app.models.candidate import CandidateProfile
from backend.app.models.follow_up import FollowUp
from backend.app.schemas.application import (
    ApplicationResponse,
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationStatusUpdate
)
from backend.app.api.dependencies import get_current_candidate

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("", response_model=List[ApplicationResponse])
async def list_applications(
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    query = (
        select(Application)
        .where(Application.candidate_id == candidate.id)
        .options(
            selectinload(Application.job),
            selectinload(Application.timeline)
        )
        .order_by(desc(Application.updated_at))
    )
    if status_filter:
        query = query.where(Application.status == status_filter.upper())

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    app_data: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    # Check if job exists
    job_res = await db.execute(select(Job).where(Job.id == app_data.job_id))
    job = job_res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if already added
    existing = await db.execute(
        select(Application).where(
            Application.candidate_id == candidate.id,
            Application.job_id == job.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Job is already tracked in your application pipeline")

    applied_date = app_data.applied_date
    if app_data.status.upper() == "APPLIED" and not applied_date:
        applied_date = datetime.now(timezone.utc)

    application = Application(
        candidate_id=candidate.id,
        job_id=job.id,
        resume_id=app_data.resume_id,
        status=app_data.status.upper(),
        applied_date=applied_date,
        salary_offered=app_data.salary_offered,
        recruiter_name=app_data.recruiter_name,
        recruiter_email=app_data.recruiter_email,
        notes=app_data.notes,
        custom_cover_letter=app_data.custom_cover_letter
    )
    db.add(application)
    await db.flush()

    # Log initial timeline
    timeline = ApplicationTimeline(
        application_id=application.id,
        previous_status=None,
        new_status=application.status,
        notes="Application added to pipeline."
    )
    db.add(timeline)

    # If applied, auto-schedule follow-up 5 business days (7 calendar days) later
    if application.status == "APPLIED":
        import datetime as dt
        due = datetime.now(timezone.utc) + dt.timedelta(days=7)
        fu = FollowUp(
            application_id=application.id,
            due_date=due,
            follow_up_type="5 Business Days Check",
            notes="Follow up on application status 5 business days (7 calendar days) after submission if no response received."
        )
        db.add(fu)

    await db.commit()

    # Reload with relationships
    stmt = (
        select(Application)
        .where(Application.id == application.id)
        .options(selectinload(Application.job), selectinload(Application.timeline))
    )
    res = await db.execute(stmt)
    return res.scalar_one()


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = (
        select(Application)
        .where(Application.id == application_id, Application.candidate_id == candidate.id)
        .options(selectinload(Application.job), selectinload(Application.timeline))
    )
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.post("/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: str,
    status_update: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = (
        select(Application)
        .where(Application.id == application_id, Application.candidate_id == candidate.id)
        .options(selectinload(Application.job), selectinload(Application.timeline))
    )
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = app.status
    new_status = status_update.status.upper()

    if old_status != new_status:
        app.status = new_status
        if new_status == "APPLIED":
            if not app.applied_date:
                app.applied_date = status_update.applied_date or datetime.now(timezone.utc)
            # Auto-schedule 5 business days check (7 calendar days)
            import datetime as dt
            due = datetime.now(timezone.utc) + dt.timedelta(days=7)
            fu = FollowUp(
                application_id=app.id,
                due_date=due,
                follow_up_type="5 Business Days Check",
                notes="Follow up on application status 5 business days (7 calendar days) after submission if no response received."
            )
            db.add(fu)
        if status_update.salary_offered is not None:
            app.salary_offered = status_update.salary_offered

        # Log timeline transition
        timeline = ApplicationTimeline(
            application_id=app.id,
            previous_status=old_status,
            new_status=new_status,
            notes=status_update.notes or f"Moved from {old_status} to {new_status}"
        )
        db.add(timeline)
        await db.commit()
        await db.refresh(app)

    return app


@router.patch("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: str,
    update_data: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = (
        select(Application)
        .where(Application.id == application_id, Application.candidate_id == candidate.id)
        .options(selectinload(Application.job), selectinload(Application.timeline))
    )
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    update_dict = update_data.model_dump(exclude_unset=True)
    if "status" in update_dict and update_dict["status"]:
        new_status = update_dict["status"].upper()
        if app.status != new_status:
            timeline = ApplicationTimeline(
                application_id=app.id,
                previous_status=app.status,
                new_status=new_status,
                notes="Stage updated"
            )
            db.add(timeline)
            app.status = new_status
        del update_dict["status"]

    for key, val in update_dict.items():
        setattr(app, key, val)

    await db.commit()
    await db.refresh(app)
    return app


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    res = await db.execute(
        select(Application).where(Application.id == application_id, Application.candidate_id == candidate.id)
    )
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)
    await db.commit()
