from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db
from backend.app.models.job import Job, JobSkill
from backend.app.models.skill import Skill
from backend.app.models.candidate import CandidateProfile, CandidateSkill
from backend.app.schemas.job import JobResponse, JobCreate, JobUpdate, JobExtractRequest
from backend.app.api.dependencies import get_current_candidate
from backend.app.processing.url_validator import validate_and_canonicalize_url
from backend.app.processing.content_fetcher import fetch_web_content
from backend.app.processing.content_extractor import extract_readable_job_text
from backend.app.ai.factory import get_ai_provider
from backend.app.matching.scorer import calculate_match_scores
from backend.app.matching.rules import evaluate_decision_rules
from backend.app.core.logging import logger

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/extract", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def extract_and_analyze_job(
    request: JobExtractRequest,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    raw_text = request.raw_text or ""
    canonical_url = None

    if request.url:
        is_valid, clean_url, err = validate_and_canonicalize_url(request.url)
        if not is_valid:
            raise HTTPException(status_code=400, detail=err or "Invalid URL provided")
        canonical_url = clean_url

        # Check for duplicate job URL - delete existing to re-extract and re-score freshly
        dup_query = await db.execute(select(Job).where(Job.canonical_url == canonical_url))
        existing_job = dup_query.scalars().first()
        if existing_job:
            await db.delete(existing_job)
            await db.commit()

        # Fetch web content if raw_text not explicitly given
        if not raw_text:
            success, html, fetch_err = await fetch_web_content(canonical_url)
            if not success or not html:
                raise HTTPException(
                    status_code=422,
                    detail=fetch_err or "Could not retrieve job posting HTML. Please paste the job description text manually."
                )
            raw_text = extract_readable_job_text(html)

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Please provide a valid Job URL or paste the job description text.")

    # 1. AI or Heuristic Extraction
    ai_provider = get_ai_provider(request.provider)
    job_create = await ai_provider.extract_job_information(raw_text=raw_text, source_url=canonical_url)

    # 2. Persist Job
    job = Job(
        url=canonical_url,
        canonical_url=canonical_url,
        source=job_create.source,
        title=job_create.title,
        company=job_create.company,
        location=job_create.location,
        workplace_type=job_create.workplace_type,
        employment_type=job_create.employment_type,
        salary_min=job_create.salary_min,
        salary_max=job_create.salary_max,
        currency=job_create.currency,
        experience_level=job_create.experience_level,
        min_years_experience=job_create.min_years_experience,
        education_requirement=job_create.education_requirement,
        raw_description=raw_text,
        summary=job_create.summary,
        responsibilities=job_create.responsibilities,
        benefits=job_create.benefits,
    )
    db.add(job)
    await db.flush()

    # 3. Associate & Upsert Skills
    job_skills_list: List[JobSkill] = []
    for skill_info in job_create.skills:
        # Check if skill exists in taxonomy
        skill_res = await db.execute(select(Skill).where(Skill.name == skill_info.name))
        skill = skill_res.scalar_one_or_none()
        if not skill:
            skill = Skill(name=skill_info.name, category=skill_info.category)
            db.add(skill)
            await db.flush()
        
        js = JobSkill(
            job_id=job.id,
            skill_id=skill.id,
            is_required=skill_info.is_required,
            years_required=skill_info.years_required
        )
        js.skill = skill
        db.add(js)
        job_skills_list.append(js)

    await db.flush()

    # 4. Run Match Engine
    cand_stmt = (
        select(CandidateProfile)
        .where(CandidateProfile.id == candidate.id)
        .execution_options(populate_existing=True)
    )
    cand_res = await db.execute(cand_stmt)
    full_cand = cand_res.scalar_one()

    cand_skills_stmt = (
        select(CandidateSkill)
        .where(CandidateSkill.candidate_id == candidate.id)
        .options(selectinload(CandidateSkill.skill))
    )
    cand_skills_res = await db.execute(cand_skills_stmt)
    cand_skills_list = cand_skills_res.scalars().all()

    overall_score, breakdown, skill_details, matched, missing_crit, missing_pref = calculate_match_scores(
        candidate=full_cand,
        job=job,
        job_skills=job_skills_list,
        candidate_skills=cand_skills_list
    )

    rec, summary = evaluate_decision_rules(
        overall_score=overall_score,
        missing_critical_skills=missing_crit,
        experience_gap=max(0, (job.min_years_experience or 0) - (full_cand.years_of_experience or 0))
    )

    job.match_score = overall_score
    job.recommendation = rec
    job.match_summary = summary
    job.matched_skills = matched
    job.missing_critical_skills = missing_crit
    job.missing_preferred_skills = missing_pref

    await db.commit()
    await db.refresh(job)

    return job


@router.get("", response_model=List[JobResponse])
async def list_jobs(
    search: Optional[str] = None,
    recommendation: Optional[str] = None,
    workplace_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    query = select(Job).order_by(desc(Job.created_at))

    if search:
        s = f"%{search}%"
        query = query.where(or_(Job.title.ilike(s), Job.company.ilike(s), Job.summary.ilike(s)))
    if recommendation:
        query = query.where(Job.recommendation == recommendation.upper())
    if workplace_type:
        query = query.where(Job.workplace_type == workplace_type)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(job)
    await db.commit()
