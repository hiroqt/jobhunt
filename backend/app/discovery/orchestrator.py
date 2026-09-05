import asyncio
import time
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.models.search import JobSearch, SearchExecution
from backend.app.models.job import Job, JobSkill
from backend.app.models.skill import Skill
from backend.app.models.candidate import CandidateProfile, CandidateSkill
from backend.app.models.notification import Notification
from backend.app.sources.registry import source_registry
from backend.app.sources.base import JobSearchQuery, RawJob, NormalizedJobData
from backend.app.processing.deduplicator import check_job_duplicate
from backend.app.processing.normalizer import get_skill_category
from backend.app.matching.scorer import calculate_match_scores
from backend.app.matching.rules import evaluate_decision_rules
from backend.app.verification.verifier import job_verification_service
from backend.app.verification.types import VerificationStatus
from backend.app.core.logging import logger


async def execute_search_pipeline(
    search: JobSearch,
    candidate: CandidateProfile,
    db: AsyncSession,
    execution_id: str = None,
) -> SearchExecution:
    """
    Executes the end-to-end multi-source discovery, normalization, deduplication,
    match qualification, persistence, and notification pipeline.
    """
    start_time = datetime.now(timezone.utc)
    
    # Create or load execution record
    if execution_id:
        res = await db.execute(select(SearchExecution).where(SearchExecution.id == execution_id))
        execution = res.scalar_one_or_none()
    else:
        execution = None

    if not execution:
        execution = SearchExecution(
            search_id=search.id,
            candidate_id=candidate.id,
            status="RUNNING",
            started_at=start_time,
            jobs_found=0,
            jobs_normalized=0,
            jobs_deduplicated=0,
            jobs_failed=0,
            logs=[]
        )
        db.add(execution)
        await db.flush()
    else:
        execution.status = "RUNNING"
        execution.started_at = start_time
        await db.flush()

    logs: List[Dict[str, Any]] = []

    def log_step(message: str, level: str = "INFO", details: Any = None):
        logger.info(f"[{search.name}] {message}")
        logs.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "message": message,
            "details": details
        })

    log_step(f"Starting discovery pipeline for saved search '{search.name}' across sources: {search.sources}")

    # Build search query
    query = JobSearchQuery(
        keywords=search.keywords or ["Software Engineer"],
        locations=search.locations or ["Remote"],
        remote_types=search.remote_types or ["Remote"],
        employment_types=search.employment_types or ["Full-time"],
        experience_levels=search.experience_levels or ["Junior"],
        salary_min=search.salary_min,
        salary_max=search.salary_max,
        currency=search.currency or "USD",
        posted_within=search.posted_within or "24_HOURS",
        limit=15
    )

    # 1. Dispatch queries across enabled sources concurrently
    sources_to_query = search.sources or ["linkedin", "indeed", "remoteok"]
    raw_jobs_by_source: Dict[str, List[RawJob]] = {}
    source_errors: Dict[str, str] = {}

    async def fetch_from_source(src_name: str) -> Tuple[str, List[RawJob], str]:
        adapter = source_registry.get_adapter(src_name)
        if not adapter:
            return src_name, [], f"Source adapter '{src_name}' not registered."
        try:
            jobs = await adapter.search(query)
            return src_name, jobs, ""
        except Exception as e:
            return src_name, [], str(e)

    tasks = [fetch_from_source(src) for src in sources_to_query]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    total_raw_found = 0
    for res in results:
        if isinstance(res, Exception):
            log_step(f"Unexpected source worker exception: {res}", "ERROR")
            continue
        src_name, jobs, err = res
        if err:
            source_errors[src_name] = err
            log_step(f"Source '{src_name}' encountered an error: {err}", "WARNING")
        else:
            raw_jobs_by_source[src_name] = jobs
            total_raw_found += len(jobs)
            log_step(f"Source '{src_name}' discovered {len(jobs)} potential job listings.", "INFO")

    execution.jobs_found = total_raw_found

    # 2. Fetch existing jobs for deduplication
    existing_jobs_res = await db.execute(select(Job))
    existing_jobs: List[Job] = list(existing_jobs_res.scalars().all())

    # 3. Fetch candidate profile and skills for scoring
    cand_stmt = (
        select(CandidateProfile)
        .where(CandidateProfile.id == candidate.id)
        .options(selectinload(CandidateProfile.skills).selectinload(CandidateSkill.skill))
    )
    cand_res = await db.execute(cand_stmt)
    full_cand = cand_res.scalar_one()

    # 4. Normalize, Deduplicate, Score & Persist
    jobs_normalized_count = 0
    jobs_dedup_count = 0
    jobs_failed_count = 0
    high_match_jobs: List[Job] = []

    for src_name, raw_jobs in raw_jobs_by_source.items():
        adapter = source_registry.get_adapter(src_name)
        if not adapter:
            continue

        now = datetime.now(timezone.utc)
        one_week_ago = now - timedelta(days=7)

        for raw_job in raw_jobs:
            try:
                # 1. Verification Stage (Sections 31-35)
                # Verify discovered identity, source host, and confidence
                v_res = await job_verification_service.verify_discovered_job(raw_job, perform_network_verification=False)
                if v_res.status in (VerificationStatus.INVALID, VerificationStatus.REMOVED):
                    jobs_failed_count += 1
                    log_step(f"Verification rejected job '{raw_job.title}' at '{raw_job.company}'. Reason: {v_res.reason}", "WARNING")
                    continue

                # Normalization
                norm: NormalizedJobData = adapter.normalize(raw_job)
                norm.verification_status = v_res.status.value
                norm.verification_confidence = v_res.confidence
                norm.verified_at = v_res.checked_at
                norm.canonical_url = v_res.canonical_url or norm.canonical_url
                
                # ENFORCE 1-WEEK SPAN: Exclude jobs older than 7 days
                if norm.posted_at:
                    p_at = norm.posted_at if norm.posted_at.tzinfo else norm.posted_at.replace(tzinfo=timezone.utc)
                    if p_at < one_week_ago or p_at > now:
                        log_step(f"Excluded job '{norm.title}' from '{src_name}' (posted {p_at.isoformat()}) outside 1-week span.", "DEBUG")
                        continue
                else:
                    norm.posted_at = now - timedelta(days=1, hours=2)

                # Check Deduplication
                is_dup, dup_conf, dup_reason, dup_existing = check_job_duplicate(norm, existing_jobs)
                if is_dup and dup_existing:
                    jobs_dedup_count += 1
                    log_step(f"Deduplicated job '{norm.title}' at '{norm.company}' (Confidence: {round(dup_conf*100)}%). Reason: {dup_reason}", "DEBUG")
                    continue

                # Create new Job record with verification metadata
                new_job = Job(
                    url=norm.url,
                    canonical_url=norm.canonical_url,
                    external_id=norm.external_id,
                    source=norm.source,
                    search_id=search.id,
                    title=norm.title,
                    company=norm.company,
                    location=norm.location,
                    workplace_type=norm.workplace_type,
                    employment_type=norm.employment_type,
                    salary_min=norm.salary_min,
                    salary_max=norm.salary_max,
                    currency=norm.currency,
                    experience_level=norm.experience_level,
                    min_years_experience=norm.min_years_experience,
                    education_requirement=None,
                    raw_description=norm.raw_description,
                    summary=norm.summary,
                    responsibilities=norm.responsibilities,
                    benefits=norm.benefits,
                    is_active=norm.is_active and (v_res.status != VerificationStatus.INVALID),
                    link_status=norm.link_status,
                    link_type=norm.link_type,
                    search_url=norm.search_url,
                    last_checked_at=datetime.now(timezone.utc),
                    posted_at=norm.posted_at,
                    verification_status=norm.verification_status,
                    verification_confidence=norm.verification_confidence,
                    trust_score=v_res.trust_score.overall_trust_score,
                    trust_grade=v_res.trust_score.trust_grade,
                    verified_at=norm.verified_at,
                    discovered_at=datetime.now(timezone.utc),
                    first_seen_at=datetime.now(timezone.utc),
                    last_seen_at=datetime.now(timezone.utc),
                    last_changed_at=datetime.now(timezone.utc),
                    raw_data=raw_job.raw_data or {"source_payload": "raw_discovery"},
                    field_evidence_data=[e.model_dump() for e in v_res.field_evidence],
                )
                db.add(new_job)
                await db.flush()

                # Upsert Skills
                job_skills_list: List[JobSkill] = []
                for s_name in norm.skills:
                    if not s_name:
                        continue
                    # Check taxonomy
                    skill_res = await db.execute(select(Skill).where(Skill.name.ilike(s_name)))
                    tax_skill = skill_res.scalar_one_or_none()
                    if not tax_skill:
                        cat = get_skill_category(s_name)
                        tax_skill = Skill(name=s_name, category=cat)
                        db.add(tax_skill)
                        await db.flush()

                    js = JobSkill(
                        job_id=new_job.id,
                        skill_id=tax_skill.id,
                        is_required=True,
                        tier="REQUIRED",
                        years_required=new_job.min_years_experience or 0,
                        importance_weight=3
                    )
                    js.skill = tax_skill
                    db.add(js)
                    job_skills_list.append(js)

                await db.flush()

                # Calculate Match Scoring
                score, breakdown, skill_details, matched, missing_crit, missing_pref = calculate_match_scores(
                    candidate=full_cand,
                    job=new_job,
                    job_skills=job_skills_list,
                    candidate_skills=full_cand.skills
                )

                rec, summary_rec = evaluate_decision_rules(
                    overall_score=score,
                    missing_critical_skills=missing_crit,
                    experience_gap=max(0, (new_job.min_years_experience or 0) - (full_cand.years_of_experience or 0)),
                    critical_constraint_failed=breakdown.critical_constraint_failed,
                    hard_requirement_reason=breakdown.hard_requirement_reason
                )

                new_job.match_score = score
                new_job.recommendation = rec
                new_job.eligibility_status = breakdown.eligibility_status
                new_job.match_summary = summary_rec
                new_job.matched_skills = matched
                new_job.missing_critical_skills = missing_crit
                new_job.missing_preferred_skills = missing_pref

                existing_jobs.append(new_job)
                jobs_normalized_count += 1

                # Check if high match for notification
                if score >= 80:
                    high_match_jobs.append(new_job)

            except Exception as ex:
                jobs_failed_count += 1
                log_step(f"Failed to process raw job '{raw_job.title}': {ex}", "ERROR")

    # 5. Trigger notifications for high match jobs
    for h_job in high_match_jobs:
        notif = Notification(
            candidate_id=candidate.id,
            type="HIGH_MATCH",
            title=f"High Match Opportunity ({h_job.match_score}%): {h_job.title}",
            message=f"{h_job.company} posted a {h_job.title} position matching your profile with a {h_job.match_score}% match score.",
            data={"job_id": h_job.id, "match_score": h_job.match_score, "company": h_job.company}
        )
        db.add(notif)

    # General Search Completed notification if new jobs found
    if jobs_normalized_count > 0:
        notif_search = Notification(
            candidate_id=candidate.id,
            type="SEARCH_COMPLETED",
            title=f"Search '{search.name}' Finished",
            message=f"Discovered {jobs_normalized_count} new jobs ({jobs_dedup_count} duplicates filtered) from {', '.join(sources_to_query)}.",
            data={"search_id": search.id, "jobs_count": jobs_normalized_count}
        )
        db.add(notif_search)

    # Finalize execution status
    end_time = datetime.now(timezone.utc)
    execution.completed_at = end_time
    execution.jobs_normalized = jobs_normalized_count
    execution.jobs_deduplicated = jobs_dedup_count
    execution.jobs_failed = jobs_failed_count
    
    if len(source_errors) == len(sources_to_query) and sources_to_query:
        execution.status = "FAILED"
        execution.error = f"All sources failed: {source_errors}"
    elif source_errors:
        execution.status = "PARTIAL_SUCCESS"
        execution.error = f"Some sources failed: {source_errors}"
    else:
        execution.status = "COMPLETED"

    log_step(f"Pipeline finished with status {execution.status}. Discovered: {total_raw_found}, New Saved: {jobs_normalized_count}, Deduplicated: {jobs_dedup_count}, Failed: {jobs_failed_count}.")
    execution.logs = logs

    # Update search last_run_at
    search.last_run_at = end_time
    await db.commit()
    await db.refresh(execution)

    return execution
