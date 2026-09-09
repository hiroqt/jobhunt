from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db
from backend.app.models.job import Job
from backend.app.models.application import Application
from backend.app.models.candidate import CandidateProfile, CandidateSkill
from backend.app.models.resume import Resume
from backend.app.schemas.ai import (
    InterviewPrepRequest,
    InterviewPrepResponse,
    ResumeTailorRequest,
    ResumeTailorResponse,
    FollowUpEmailGenRequest,
    FollowUpEmailGenResponse,
    CoverLetterGenRequest,
    CoverLetterGenResponse
)
from backend.app.api.dependencies import get_current_candidate
from backend.app.ai.factory import get_ai_provider
from backend.app.ai.base import strip_emojis
from backend.app.core.rate_limiter import ai_rate_limiter

router = APIRouter(prefix="/ai", tags=["AI Career Intelligence"], dependencies=[Depends(ai_rate_limiter)])


@router.post("/cover-letter", response_model=CoverLetterGenResponse)
async def generate_custom_cover_letter(
    request: CoverLetterGenRequest,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    job_title = request.job_title or "Software Engineer"
    company = request.company or "Company"
    description = request.job_description or ""
    hiring_manager = request.hiring_manager_name

    if request.job_id:
        job_res = await db.execute(select(Job).where(Job.id == request.job_id))
        job = job_res.scalar_one_or_none()
        if job:
            job_title = job.title or job_title
            company = job.company or company
            description = job.raw_description or job.summary or description

    # Load candidate skills
    cs_res = await db.execute(
        select(CandidateSkill)
        .where(CandidateSkill.candidate_id == candidate.id)
        .options(selectinload(CandidateSkill.skill))
    )
    candidate_skills = [cs.skill.name for cs in cs_res.scalars().all() if cs.skill]

    # Resolve resume text
    resume_text = request.resume_text or ""
    if not resume_text and request.resume_id:
        resume_res = await db.execute(select(Resume).where(Resume.id == request.resume_id))
        resume = resume_res.scalar_one_or_none()
        if resume:
            resume_text = resume.raw_text or resume.summary or ""
            if resume.skills:
                candidate_skills = list(set(candidate_skills + (resume.skills or [])))

    if not resume_text:
        # Fallback to primary resume in DB
        prim_res = await db.execute(
            select(Resume).where(Resume.candidate_id == candidate.id, Resume.is_primary == True) # noqa: E712
        )
        prim_resume = prim_res.scalar_one_or_none()
        if prim_resume:
            resume_text = prim_resume.raw_text or prim_resume.summary or ""
            if prim_resume.skills:
                candidate_skills = list(set(candidate_skills + (prim_resume.skills or [])))

    if not resume_text:
        # Construct summary from profile
        skills_str = ", ".join(candidate_skills) if candidate_skills else "Software Engineering, Full-Stack Development"
        roles_str = ", ".join(candidate.target_roles or [])
        resume_text = (
            f"Headline: {candidate.headline or 'Full-Stack Software Engineer'}\n"
            f"Summary: {candidate.summary or 'Experienced developer specializing in scalable web systems and modern frameworks.'}\n"
            f"Target Roles: {roles_str}\n"
            f"Years of Experience: {candidate.years_of_experience}\n"
            f"Key Skills: {skills_str}\n"
        )

    ai_provider = get_ai_provider(request.provider)
    result = await ai_provider.generate_cover_letter(
        job_title=job_title,
        company=company,
        job_description=description,
        candidate_name=candidate.full_name or "Candidate",
        candidate_summary=candidate.summary or "",
        candidate_skills=candidate_skills,
        resume_text=resume_text,
        tone=request.tone or "professional",
        length=request.length or "standard",
        focus_areas=request.focus_areas,
        custom_instructions=request.custom_instructions,
        hiring_manager_name=hiring_manager
    )

    # Strict zero-emoji guarantee: strip any stray emojis from all text fields
    result.cover_letter = strip_emojis(result.cover_letter)
    result.subject_line = strip_emojis(result.subject_line)
    result.salutation = strip_emojis(result.salutation)
    result.sign_off = strip_emojis(result.sign_off)
    result.body_paragraphs = [strip_emojis(p) for p in result.body_paragraphs if strip_emojis(p)]
    result.matched_skills_highlighted = [strip_emojis(s) for s in result.matched_skills_highlighted if strip_emojis(s)]
    result.key_strengths_featured = [strip_emojis(s) for s in result.key_strengths_featured if strip_emojis(s)]
    result.word_count = len(result.cover_letter.split())
    return result



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
