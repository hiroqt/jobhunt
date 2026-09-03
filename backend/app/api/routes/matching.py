from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db
from backend.app.models.job import Job, JobSkill
from backend.app.models.candidate import CandidateProfile, CandidateSkill
from backend.app.schemas.matching import MatchResult
from backend.app.api.dependencies import get_current_candidate
from backend.app.matching.scorer import calculate_match_scores
from backend.app.matching.rules import evaluate_decision_rules
from backend.app.matching.explainer import generate_match_explanation

router = APIRouter(prefix="/jobs", tags=["Matching"])


@router.get("/{job_id}/match", response_model=MatchResult)
@router.post("/{job_id}/match", response_model=MatchResult)
async def get_job_match_analysis(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    # Fetch job with skills
    job_stmt = (
        select(Job)
        .where(Job.id == job_id)
        .options(selectinload(Job.skills).selectinload(JobSkill.skill))
    )
    job_res = await db.execute(job_stmt)
    job = job_res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch candidate with skills
    cand_stmt = (
        select(CandidateProfile)
        .where(CandidateProfile.id == candidate.id)
        .options(selectinload(CandidateProfile.skills).selectinload(CandidateSkill.skill))
    )
    cand_res = await db.execute(cand_stmt)
    full_cand = cand_res.scalar_one()

    overall_score, breakdown, skill_details, matched, missing_crit, missing_pref = calculate_match_scores(
        candidate=full_cand,
        job=job,
        job_skills=job.skills,
        candidate_skills=full_cand.skills
    )

    rec, summary = evaluate_decision_rules(
        overall_score=overall_score,
        missing_critical_skills=missing_crit,
        experience_gap=max(0, (job.min_years_experience or 0) - (full_cand.years_of_experience or 0))
    )

    strengths, advice = generate_match_explanation(
        overall_score=overall_score,
        recommendation=rec,
        breakdown=breakdown,
        matched_skills=matched,
        missing_critical=missing_crit,
        missing_preferred=missing_pref
    )

    # Update job cache
    job.match_score = overall_score
    job.recommendation = rec
    job.match_summary = summary
    job.matched_skills = matched
    job.missing_critical_skills = missing_crit
    job.missing_preferred_skills = missing_pref
    await db.commit()

    return MatchResult(
        job_id=job.id,
        candidate_id=full_cand.id,
        overall_score=overall_score,
        recommendation=rec,
        summary=summary,
        breakdown=breakdown,
        skills_detail=skill_details,
        matched_skills=matched,
        missing_critical_skills=missing_crit,
        missing_preferred_skills=missing_pref,
        strengths=strengths,
        actionable_advice=advice
    )
