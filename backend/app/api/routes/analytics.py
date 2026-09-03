from typing import Dict, List
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db
from backend.app.models.application import Application
from backend.app.models.job import Job
from backend.app.models.interview import Interview
from backend.app.models.follow_up import FollowUp
from backend.app.schemas.analytics import DashboardOverview, FunnelStageMetric, SkillGapFrequency, SourceMetric
from backend.app.api.dependencies import get_current_candidate
from backend.app.models.candidate import CandidateProfile
from backend.app.processing.normalizer import get_skill_category

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    # Fetch all applications for the candidate
    stmt = (
        select(Application)
        .where(Application.candidate_id == candidate.id)
        .options(selectinload(Application.job))
    )
    apps_res = await db.execute(stmt)
    apps = apps_res.scalars().all()

    total_apps = len(apps)
    
    # Status Counts
    stage_counts = Counter(app.status for app in apps)
    
    # Active applications: not in OFFER, REJECTED, WITHDRAWN, ARCHIVED
    inactive_statuses = {"OFFER", "REJECTED", "WITHDRAWN", "ARCHIVED"}
    active_apps = sum(count for st, count in stage_counts.items() if st not in inactive_statuses)
    
    # Total offers
    offers_received = stage_counts.get("OFFER", 0)
    
    # Interviews scheduled
    iv_res = await db.execute(
        select(func.count(Interview.id))
        .join(Application)
        .where(Application.candidate_id == candidate.id, Interview.outcome == "PENDING")
    )
    interviews_scheduled = iv_res.scalar_one() or 0
    
    # Follow-ups due (pending follow-ups)
    fu_res = await db.execute(
        select(func.count(FollowUp.id))
        .join(Application)
        .where(Application.candidate_id == candidate.id, FollowUp.is_completed == False)
    )
    follow_ups_due = fu_res.scalar_one() or 0
    
    # Funnel Metric Generation
    applied_count = sum(count for st, count in stage_counts.items() if st != "SAVED")
    screen_count = stage_counts.get("HR_SCREENING", 0) + stage_counts.get("RECRUITER_CONTACTED", 0)
    tech_count = stage_counts.get("TECHNICAL_INTERVIEW", 0) + stage_counts.get("FINAL_INTERVIEW", 0) + offers_received
    
    response_rate = round((applied_count - stage_counts.get("APPLIED", 0)) / applied_count * 100, 1) if applied_count > 0 else 0.0
    interview_rate = round((screen_count + tech_count) / applied_count * 100, 1) if applied_count > 0 else 0.0
    
    funnel = [
        FunnelStageMetric(stage="Saved / Wishlist", count=stage_counts.get("SAVED", 0), conversion_rate_pct=100.0),
        FunnelStageMetric(stage="Applications Submitted", count=applied_count, conversion_rate_pct=round(applied_count / max(1, total_apps) * 100, 1)),
        FunnelStageMetric(stage="Recruiter Screen", count=screen_count, conversion_rate_pct=round(screen_count / max(1, applied_count) * 100, 1)),
        FunnelStageMetric(stage="Technical / Final Round", count=tech_count, conversion_rate_pct=round(tech_count / max(1, applied_count) * 100, 1)),
        FunnelStageMetric(stage="Job Offer Extended", count=offers_received, conversion_rate_pct=round(offers_received / max(1, applied_count) * 100, 1)),
    ]

    # Average match score
    match_scores = [app.job.match_score for app in apps if app.job and app.job.match_score is not None]
    avg_match = round(sum(match_scores) / len(match_scores), 1) if match_scores else 0.0


    # Aggregate missing skill gaps across all saved / rejected jobs
    missing_skill_counter = Counter()
    for app in apps:
        if app.job and app.job.missing_critical_skills:
            for skill in app.job.missing_critical_skills:
                missing_skill_counter[skill] += 1

    top_skill_gaps = []
    total_gaps_analyzed = max(1, len(apps))
    for skill_name, count in missing_skill_counter.most_common(5):
        cat = get_skill_category(skill_name)
        pct = round(count / total_gaps_analyzed * 100, 1)
        top_skill_gaps.append(SkillGapFrequency(
            skill_name=skill_name,
            category=cat,
            missing_count=count,
            percentage_of_rejections=pct,
            learning_recommendation=f"Build a small demonstration project integrating {skill_name} into your GitHub portfolio."
        ))

    # Source metrics
    source_counter = Counter()
    source_interviews = Counter()
    source_offers = Counter()
    
    for app in apps:
        src = (app.job.source if app.job and app.job.source else "Manual")
        source_counter[src] += 1
        if app.status in ("HR_SCREENING", "TECHNICAL_INTERVIEW", "FINAL_INTERVIEW", "OFFER"):
            source_interviews[src] += 1
        if app.status == "OFFER":
            source_offers[src] += 1

    source_breakdown = []
    for src, count in source_counter.items():
        iv_count = source_interviews.get(src, 0)
        source_breakdown.append(SourceMetric(
            source=src,
            applications_count=count,
            interviews_count=iv_count,
            offers_count=source_offers.get(src, 0),
            interview_rate_pct=round(iv_count / max(1, count) * 100, 1)
        ))

    return DashboardOverview(
        total_applications=total_apps,
        active_applications=active_apps,
        interviews_scheduled=interviews_scheduled,
        follow_ups_due=follow_ups_due,
        offers_received=offers_received,
        response_rate_pct=response_rate,
        interview_conversion_rate_pct=interview_rate,
        average_match_score=avg_match,
        recent_activity_count=total_apps,
        funnel=funnel,
        top_skill_gaps=top_skill_gaps,
        source_breakdown=source_breakdown
    )
