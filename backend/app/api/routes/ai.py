from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.db.session import get_db
from backend.app.models.job import Job
from backend.app.models.application import Application
from backend.app.models.candidate import CandidateProfile
from backend.app.schemas.ai import (
    InterviewPrepRequest,
    InterviewPrepResponse,
    ResumeTailorRequest,
    ResumeTailorResponse,
    FollowUpEmailGenRequest,
    FollowUpEmailGenResponse
)
from backend.app.api.dependencies import get_current_candidate
from backend.app.ai.factory import get_ai_provider

router = APIRouter(prefix="/ai", tags=["AI Career Intelligence"])


@router.post("/interview-prep", response_model=InterviewPrepResponse)
async def generate_interview_prep_questions(
    request: InterviewPrepRequest,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    job_title = request.job_title or "Software Engineer"
    company = request.company or "Company"
    description = request.job_description or ""

    if request.job_id:
        job_res = await db.execute(select(Job).where(Job.id == request.job_id))
        job = job_res.scalar_one_or_none()
        if job:
            job_title = job.title
            company = job.company
            description = job.raw_description or job.summary or ""

    ai_provider = get_ai_provider(request.provider)
    return await ai_provider.generate_interview_prep(
        job_title=job_title,
        company=company,
        job_description=description,
        candidate_summary=candidate.summary
    )


@router.post("/tailor-resume", response_model=ResumeTailorResponse)
async def tailor_resume_for_job(
    request: ResumeTailorRequest,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    job_res = await db.execute(select(Job).where(Job.id == request.job_id))
    job = job_res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidate_resume_text = candidate.summary or f"Full-stack developer with experience in {', '.join(candidate.target_roles or [])}"

    ai_provider = get_ai_provider(request.provider)
    return await ai_provider.tailor_resume(
        job_title=job.title,
        company=job.company,
        job_description=job.raw_description or job.summary or "",
        candidate_resume_text=candidate_resume_text
    )


@router.post("/follow-up-email", response_model=FollowUpEmailGenResponse)
async def generate_follow_up_email(
    request: FollowUpEmailGenRequest,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    app_res = await db.execute(select(Application).where(Application.id == request.application_id))
    app = app_res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    job_res = await db.execute(select(Job).where(Job.id == app.job_id))
    job = job_res.scalar_one_or_none()
    job_title = job.title if job else "Role"
    company = job.company if job else "Company"

    ai_provider = get_ai_provider(request.provider)
    return await ai_provider.generate_follow_up_email(
        job_title=job_title,
        company=company,
        candidate_name=candidate.full_name or "Candidate",
        email_type=request.email_type,
        interviewer_name=request.interviewer_name or app.recruiter_name,
        notes=request.topics_discussed or app.notes
    )
