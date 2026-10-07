"""
MCP Tools Implementation for Job Hunt Pipeline.

Provides 8 core tools:
1. get_candidate_profile
2. search_jobs
3. extract_job_url
4. score_job_match
5. save_job_to_pipeline
6. update_application_stage
7. generate_interview_prep
8. generate_followup_email

Includes guardrails:
- PromptInjectionGuardrail: Sanitizes untrusted web content
- TieredPermissionGuardrail: Requires explicit confirmation for state-mutating actions
"""

import re
import html
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from selectolax.parser import HTMLParser
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.ai.base import strip_emojis
from backend.app.ai.factory import get_ai_provider
from backend.app.core.logging import logger
from backend.app.db.session import AsyncSessionLocal
from backend.app.matching.rules import evaluate_decision_rules
from backend.app.matching.scorer import calculate_match_scores
from backend.app.models.application import Application, ApplicationTimeline
from backend.app.models.candidate import CandidateProfile, CandidateSkill
from backend.app.models.follow_up import FollowUp
from backend.app.models.job import Job, JobSkill
from backend.app.models.skill import Skill
from backend.app.processing.content_fetcher import fetch_web_content
from backend.app.processing.normalizer import (
    extract_skills_from_text,
    get_skill_category,
    normalize_skill_name,
)


class PromptInjectionGuardrail:
    """
    Sanitizes untrusted web and user input against prompt injection vectors,
    jailbreak attempts, hidden instructions, system prompt overrides, and script exploits.
    """

    SUSPICIOUS_PATTERNS = [
        re.compile(r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?", re.IGNORECASE),
        re.compile(r"system\s*prompt\s*override", re.IGNORECASE),
        re.compile(r"you\s+are\s+now\s+(an?|in)\b", re.IGNORECASE),
        re.compile(r"disregard\s+(all\s+)?(previous|prior)\b", re.IGNORECASE),
        re.compile(r"do\s+not\s+follow\s+any\s+(previous|prior)\b", re.IGNORECASE),
        re.compile(r"new\s+instructions?:", re.IGNORECASE),
        re.compile(r"output\s+only\b", re.IGNORECASE),
        re.compile(r"bypass\s+(safety|security|rules)\b", re.IGNORECASE),
        re.compile(r"<script[\s\S]*?</script>", re.IGNORECASE),
        re.compile(r"javascript:\s*", re.IGNORECASE),
        re.compile(r"base64\s*,\s*[A-Za-z0-9+/=]{20,}", re.IGNORECASE),
        re.compile(r"\{\{[\s\S]*?\}\}"),  # Template injection attempts
    ]

    @classmethod
    def sanitize_untrusted_content(cls, content: str, max_chars: int = 15000) -> str:
        """
        Sanitizes text by stripping malicious injection patterns, neutralizing
        script tags, unescaping HTML entities safely, and capping character length.
        """
        if not content:
            return ""

        # 1. Unescape HTML entities
        sanitized = html.unescape(content)

        # 2. Neutralize null bytes and control chars (except normal newlines/tabs)
        sanitized = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", sanitized)

        # 3. Detect and neutralize suspicious prompt injection strings
        for pattern in cls.SUSPICIOUS_PATTERNS:
            sanitized = pattern.sub("[REDACTED_SUSPICIOUS_CONTENT]", sanitized)

        # 4. Collapse redundant white space
        sanitized = re.sub(r"[ \t]+", " ", sanitized)
        sanitized = re.sub(r"\n{3,}", "\n\n", sanitized)

        # 5. Cap length
        return sanitized[:max_chars].strip()


class TieredPermissionGuardrail:
    """
    Enforces explicit confirmation gates for actions that alter database state.
    """

    @classmethod
    def check_permission(
        cls,
        action: str,
        confirm: bool,
        preview_payload: Dict[str, Any],
        warning_message: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        If confirm is False, blocks state alteration and returns dry-run metadata.
        If confirm is True, returns None allowing execution to proceed.
        """
        if not confirm:
            return {
                "status": "requires_confirmation",
                "action": action,
                "confirmed": False,
                "message": warning_message
                or f"Action '{action}' modifies state. Please review preview and re-run with confirm=True to execute.",
                "preview": preview_payload,
            }
        return None


# =============================================================================
# 1. get_candidate_profile
# =============================================================================
async def get_candidate_profile(candidate_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches target roles, preferred locations, workplace types, salary targets,
    and top skills from CandidateProfile/CandidateSkill.
    """
    async with AsyncSessionLocal() as db:
        if candidate_id:
            stmt = (
                select(CandidateProfile)
                .where(CandidateProfile.id == candidate_id)
                .options(selectinload(CandidateProfile.skills).selectinload(CandidateSkill.skill))
            )
            result = await db.execute(stmt)
            profile = result.scalar_one_or_none()
        else:
            stmt = (
                select(CandidateProfile)
                .options(selectinload(CandidateProfile.skills).selectinload(CandidateSkill.skill))
            )
            result = await db.execute(stmt)
            profile = result.scalars().first()

        if not profile:
            # If no profile exists, create a default empty candidate profile
            new_prof = CandidateProfile(
                full_name="",
                target_roles=[],
                preferred_locations=[],
                workplace_types=[],
                min_salary=0,
                target_salary=0,
                currency="USD",
                years_of_experience=0,
                education_level=None,
            )
            db.add(new_prof)
            await db.commit()
            
            stmt = (
                select(CandidateProfile)
                .where(CandidateProfile.id == new_prof.id)
                .options(selectinload(CandidateProfile.skills).selectinload(CandidateSkill.skill))
            )
            res = await db.execute(stmt)
            profile = res.scalar_one()

        # Collect skills
        skills_list = []
        top_skills = []
        for cs in profile.skills or []:
            skill_name = cs.skill.name if cs.skill else "Unknown"
            category = cs.skill.category if cs.skill else "General"
            item = {
                "skill_name": skill_name,
                "category": category,
                "proficiency_level": cs.proficiency_level,
                "years_experience": cs.years_experience,
                "is_top_skill": cs.is_top_skill,
                "notes": cs.notes,
            }
            skills_list.append(item)
            if cs.is_top_skill:
                top_skills.append(skill_name)

        return {
            "id": profile.id,
            "full_name": profile.full_name,
            "email": profile.email,
            "headline": profile.headline,
            "summary": profile.summary,
            "target_roles": profile.target_roles or [],
            "preferred_locations": profile.preferred_locations or [],
            "workplace_types": profile.workplace_types or [],
            "min_salary": profile.min_salary,
            "target_salary": profile.target_salary,
            "currency": profile.currency or "USD",
            "years_of_experience": profile.years_of_experience,
            "education_level": profile.education_level,
            "portfolio_url": profile.portfolio_url,
            "github_url": profile.github_url,
            "linkedin_url": profile.linkedin_url,
            "top_skills": top_skills,
            "skills": skills_list,
        }


# =============================================================================
# 2. search_jobs
# =============================================================================
async def search_jobs(
    query: str,
    location: Optional[str] = None,
    remote_only: bool = False,
    limit: int = 10,
) -> Dict[str, Any]:
    """
    Queries job listings using the database or discovery sources.
    Matches against title, company, summary, and location.
    """
    limit = max(1, min(limit, 50))
    async with AsyncSessionLocal() as db:
        stmt = (
            select(Job)
            .options(selectinload(Job.skills).selectinload(JobSkill.skill))
            .order_by(Job.created_at.desc())
        )

        query_terms = [t.strip().lower() for t in query.split() if t.strip()]

        result = await db.execute(stmt)
        all_jobs = result.scalars().all()

        matched_jobs: List[Job] = []
        for job in all_jobs:
            title_text = (job.title or "").lower()
            company_text = (job.company or "").lower()
            summary_text = (job.summary or job.raw_description or "").lower()
            loc_text = (job.location or "").lower()
            workplace_text = (job.workplace_type or "").lower()

            # Location filter
            if location and location.strip():
                loc_clean = location.strip().lower()
                if loc_clean not in loc_text and loc_clean not in workplace_text:
                    continue

            # Remote only filter
            if remote_only:
                if "remote" not in workplace_text and "remote" not in loc_text:
                    continue

            # Query term matching
            full_searchable = f"{title_text} {company_text} {summary_text}"
            if query_terms and not any(term in full_searchable for term in query_terms):
                continue

            matched_jobs.append(job)
            if len(matched_jobs) >= limit:
                break

        jobs_output = []
        for j in matched_jobs:
            job_skills = [
                js.skill.name for js in (j.skills or []) if js.skill
            ]
            jobs_output.append({
                "id": j.id,
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "workplace_type": j.workplace_type,
                "employment_type": j.employment_type,
                "salary_min": j.salary_min,
                "salary_max": j.salary_max,
                "currency": j.currency,
                "url": j.canonical_url or j.url,
                "match_score": j.match_score,
                "recommendation": j.recommendation,
                "skills": job_skills,
                "summary": (j.summary or "")[:300],
            })

        return {
            "query": query,
            "location": location,
            "remote_only": remote_only,
            "total_found": len(jobs_output),
            "jobs": jobs_output,
        }


# =============================================================================
# 3. extract_job_url
# =============================================================================
async def extract_job_url(url: str) -> Dict[str, Any]:
    """
    Ingests external job URL, extracts content using selectolax HTML parser,
    runs PromptInjectionGuardrail.sanitize_untrusted_content, and extracts
    structured job information, skills, and requirements.
    """
    if not url or not url.strip().startswith(("http://", "https://")):
        return {
            "success": False,
            "url": url,
            "error": "Invalid URL. Please provide a valid HTTP/HTTPS link.",
        }

    success, raw_html, error_msg = await fetch_web_content(url)
    if not success or not raw_html:
        return {
            "success": False,
            "url": url,
            "error": error_msg or "Failed to fetch webpage content.",
        }

    # 1. Parse HTML via selectolax
    tree = HTMLParser(raw_html)

    # Decompose noisy script/style/nav/header/footer tags
    for tag in tree.css("script, style, nav, footer, header, noscript, svg, iframe, form"):
        tag.decompose()

    # Extract meta title & description
    title_node = tree.css_first("title")
    meta_title = title_node.text(strip=True) if title_node else ""

    og_title_node = tree.css_first("meta[property='og:title'], meta[name='twitter:title']")
    if og_title_node and og_title_node.attributes.get("content"):
        meta_title = og_title_node.attributes["content"].strip()

    body_node = tree.body
    raw_body_text = body_node.text(separator="\n", strip=True) if body_node else ""

    combined_text = f"{meta_title}\n\n{raw_body_text}"

    # 2. Run PromptInjectionGuardrail
    sanitized_text = PromptInjectionGuardrail.sanitize_untrusted_content(combined_text)

    # 3. Extract structured job details using AI or heuristic extractor
    ai_provider = get_ai_provider("fallback")
    extracted_job = await ai_provider.extract_job_information(sanitized_text, source_url=url)

    skills_detected = extract_skills_from_text(sanitized_text)

    return {
        "success": True,
        "url": url,
        "title": extracted_job.title,
        "company": extracted_job.company,
        "location": extracted_job.location,
        "workplace_type": extracted_job.workplace_type,
        "employment_type": extracted_job.employment_type,
        "salary_min": extracted_job.salary_min,
        "salary_max": extracted_job.salary_max,
        "currency": extracted_job.currency,
        "min_years_experience": extracted_job.min_years_experience,
        "education_requirement": extracted_job.education_requirement,
        "skills_required": [s.name for s in extracted_job.skills if s.is_required],
        "skills_preferred": [s.name for s in extracted_job.skills if not s.is_required] or skills_detected,
        "summary": extracted_job.summary or sanitized_text[:400],
        "raw_text_length": len(sanitized_text),
    }


# =============================================================================
# 4. score_job_match
# =============================================================================
async def score_job_match(
    job_title: str,
    company: str,
    description: str,
    skills_required: Optional[List[str]] = None,
    candidate_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Runs deterministic qualification scoring:
    - Technical skills: 35%
    - Role compatibility: 25%
    - Experience: 15%
    - Education: 10%
    - Workplace: 10%
    - Salary: 5%
    Returns breakdown and decision badge (APPLY, REVIEW, SKIP).
    """
    async with AsyncSessionLocal() as db:
        if candidate_id:
            stmt = (
                select(CandidateProfile)
                .where(CandidateProfile.id == candidate_id)
                .options(selectinload(CandidateProfile.skills).selectinload(CandidateSkill.skill))
            )
            cand_res = await db.execute(stmt)
            candidate = cand_res.scalar_one_or_none()
        else:
            stmt = (
                select(CandidateProfile)
                .options(selectinload(CandidateProfile.skills).selectinload(CandidateSkill.skill))
            )
            cand_res = await db.execute(stmt)
            candidate = cand_res.scalars().first()

        if not candidate:
            candidate = CandidateProfile(
                full_name="Candidate",
                target_roles=[job_title],
                preferred_locations=[],
                workplace_types=["Remote", "Hybrid"],
                min_salary=0,
                target_salary=0,
                years_of_experience=3,
            )

        candidate_skills = candidate.skills or []

        # Create transient Job and JobSkill objects
        transient_job = Job(
            title=job_title,
            company=company,
            raw_description=description,
            workplace_type="Remote",
            min_years_experience=2,
            currency="USD",
        )

        all_req_skills = skills_required or []
        if not all_req_skills:
            # Extract skills heuristically from description
            all_req_skills = extract_skills_from_text(description)[:6]

        job_skills: List[JobSkill] = []
        for idx, sk_name in enumerate(all_req_skills):
            sk = Skill(name=sk_name, category=get_skill_category(sk_name))
            js = JobSkill(
                skill=sk,
                is_required=(idx < len(all_req_skills) // 2 + 1),
                importance_weight=4 if idx == 0 else 2,
                tier="CRITICAL" if idx == 0 else "REQUIRED",
            )
            job_skills.append(js)

        overall_score, breakdown, skill_details, matched_skills, missing_crit, missing_pref = (
            calculate_match_scores(candidate, transient_job, job_skills, candidate_skills)
        )

        exp_gap = max(0, (transient_job.min_years_experience or 0) - (candidate.years_of_experience or 0))
        recommendation, summary = evaluate_decision_rules(
            overall_score=overall_score,
            missing_critical_skills=missing_crit,
            experience_gap=exp_gap,
            critical_constraint_failed=breakdown.critical_constraint_failed,
            hard_requirement_reason=breakdown.hard_requirement_reason,
        )

        return {
            "job_title": job_title,
            "company": company,
            "overall_score": overall_score,
            "recommendation": recommendation,
            "summary": summary,
            "breakdown": {
                "technical_skills_score": breakdown.technical_skills_score,
                "role_compatibility_score": breakdown.role_compatibility_score,
                "experience_score": breakdown.experience_score,
                "education_score": breakdown.education_score,
                "location_score": breakdown.location_score,
                "other_score": breakdown.other_score,
                "eligibility_status": breakdown.eligibility_status,
                "critical_constraint_failed": breakdown.critical_constraint_failed,
                "hard_requirement_reason": breakdown.hard_requirement_reason,
            },
            "matched_skills": matched_skills,
            "missing_critical_skills": missing_crit,
            "missing_preferred_skills": missing_pref,
        }


# =============================================================================
# 5. save_job_to_pipeline
# =============================================================================
async def save_job_to_pipeline(
    job_data: Dict[str, Any],
    confirm: bool = False,
) -> Dict[str, Any]:
    """
    Applies TieredPermissionGuardrail (confirm=True).
    If confirm=False, returns a dry-run preview.
    If True, saves job and creates Application in SAVED status.
    """
    preview = {
        "title": job_data.get("title", "Untitled Job"),
        "company": job_data.get("company", "Unknown Company"),
        "location": job_data.get("location"),
        "workplace_type": job_data.get("workplace_type", "Remote"),
        "url": job_data.get("url"),
        "status": "SAVED",
    }

    gate_check = TieredPermissionGuardrail.check_permission(
        action="save_job_to_pipeline",
        confirm=confirm,
        preview_payload=preview,
        warning_message="Saving a job creates a new tracked job and SAVED application in the database.",
    )
    if gate_check:
        return gate_check

    async with AsyncSessionLocal() as db:
        # Load or create candidate
        cand_res = await db.execute(select(CandidateProfile))
        candidate = cand_res.scalars().first()
        if not candidate:
            candidate = CandidateProfile(full_name="")
            db.add(candidate)
            await db.flush()

        # Create Job
        job = Job(
            title=job_data.get("title", "Untitled Job"),
            company=job_data.get("company", "Unknown Company"),
            url=job_data.get("url"),
            canonical_url=job_data.get("url"),
            location=job_data.get("location"),
            workplace_type=job_data.get("workplace_type", "Remote"),
            employment_type=job_data.get("employment_type", "Full-time"),
            salary_min=job_data.get("salary_min"),
            salary_max=job_data.get("salary_max"),
            currency=job_data.get("currency", "USD"),
            raw_description=job_data.get("raw_description"),
            summary=job_data.get("summary"),
            match_score=job_data.get("match_score"),
            recommendation=job_data.get("recommendation", "APPLY"),
        )
        db.add(job)
        await db.flush()

        # Handle skills if provided
        skills_in = job_data.get("skills", [])
        for sk_name in skills_in:
            norm_name = normalize_skill_name(sk_name)
            sk_res = await db.execute(select(Skill).where(Skill.name == norm_name))
            skill = sk_res.scalar_one_or_none()
            if not skill:
                skill = Skill(name=norm_name, category=get_skill_category(norm_name))
                db.add(skill)
                await db.flush()
            job_skill = JobSkill(job_id=job.id, skill_id=skill.id, is_required=True)
            db.add(job_skill)

        # Create Application in SAVED status
        application = Application(
            candidate_id=candidate.id,
            job_id=job.id,
            status="SAVED",
            notes=job_data.get("notes", "Saved via MCP Server Tool"),
        )
        db.add(application)
        await db.flush()

        # Log initial timeline
        timeline = ApplicationTimeline(
            application_id=application.id,
            previous_status=None,
            new_status="SAVED",
            notes="Job saved to pipeline via MCP tool.",
        )
        db.add(timeline)
        await db.commit()

        return {
            "success": True,
            "action": "saved",
            "job_id": job.id,
            "application_id": application.id,
            "status": "SAVED",
            "title": job.title,
            "company": job.company,
        }


# =============================================================================
# 6. update_application_stage
# =============================================================================
VALID_STAGES = [
    "saved",
    "applied",
    "screening",
    "technical_round",
    "final_round",
    "offer",
    "rejected",
]

# Mapping from tool lowercase stage names to application model statuses
STAGE_STATUS_MAP = {
    "saved": "SAVED",
    "applied": "APPLIED",
    "screening": "HR_SCREENING",
    "technical_round": "TECHNICAL_INTERVIEW",
    "final_round": "FINAL_INTERVIEW",
    "offer": "OFFER",
    "rejected": "REJECTED",
}


async def update_application_stage(
    application_id: str,
    new_stage: str,
    notes: Optional[str] = None,
    confirm: bool = False,
) -> Dict[str, Any]:
    """
    Validates stage (saved, applied, screening, technical_round, final_round, offer, rejected),
    applies confirm=True guardrail. Returns dry run preview or updated application.
    """
    stage_key = new_stage.strip().lower()
    if stage_key not in VALID_STAGES:
        return {
            "success": False,
            "error": f"Invalid stage '{new_stage}'. Must be one of: {', '.join(VALID_STAGES)}",
        }

    target_status = STAGE_STATUS_MAP[stage_key]

    preview = {
        "application_id": application_id,
        "new_stage": stage_key,
        "new_status": target_status,
        "notes": notes,
    }

    gate_check = TieredPermissionGuardrail.check_permission(
        action="update_application_stage",
        confirm=confirm,
        preview_payload=preview,
        warning_message=f"Updating application '{application_id}' stage to '{target_status}' will alter pipeline progression.",
    )
    if gate_check:
        return gate_check

    async with AsyncSessionLocal() as db:
        stmt = (
            select(Application)
            .where(Application.id == application_id)
            .options(selectinload(Application.job), selectinload(Application.timeline))
        )
        result = await db.execute(stmt)
        application = result.scalar_one_or_none()

        if not application:
            return {
                "success": False,
                "error": f"Application with ID '{application_id}' not found.",
            }

        old_status = application.status
        application.status = target_status

        if notes:
            application.notes = (f"{application.notes}\n{notes}" if application.notes else notes)

        if target_status == "APPLIED" and not application.applied_date:
            application.applied_date = datetime.now(timezone.utc)

        # Record timeline event
        timeline_entry = ApplicationTimeline(
            application_id=application.id,
            previous_status=old_status,
            new_status=target_status,
            notes=notes or f"Stage updated from {old_status} to {target_status} via MCP",
        )
        db.add(timeline_entry)

        # Auto-schedule follow-up if transitioning to APPLIED
        if target_status == "APPLIED":
            import datetime as dt

            due = datetime.now(timezone.utc) + dt.timedelta(days=7)
            fu = FollowUp(
                application_id=application.id,
                due_date=due,
                follow_up_type="5 Business Days Check",
                notes="Follow up on application status 5 business days after submission.",
            )
            db.add(fu)

        await db.commit()

        return {
            "success": True,
            "application_id": application.id,
            "previous_status": old_status,
            "current_status": target_status,
            "job_title": application.job.title if application.job else None,
            "company": application.job.company if application.job else None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }


# =============================================================================
# 7. generate_interview_prep
# =============================================================================
async def generate_interview_prep(
    role_title: str,
    company: str,
    job_description: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates role-tailored technical questions, STAR behavioral frameworks,
    and smart questions for the candidate to ask interviewers.
    """
    ai_provider = get_ai_provider("fallback")
    prep_data = await ai_provider.generate_interview_prep(
        job_title=role_title,
        company=company,
        job_description=job_description or "",
    )

    tech_questions = []
    for q in getattr(prep_data, "top_technical_questions", []):
        tech_questions.append({
            "question": q.question,
            "category": getattr(q, "concept_tested", getattr(q, "question_type", "Technical")),
            "difficulty": getattr(q, "difficulty", "Intermediate"),
            "star_framework": q.star_guidance or {},
            "suggested_points": q.suggested_answer_points or [],
        })

    behavioral_questions = []
    for q in getattr(prep_data, "top_behavioral_questions", []):
        behavioral_questions.append({
            "question": q.question,
            "category": getattr(q, "concept_tested", getattr(q, "question_type", "Behavioral")),
            "difficulty": getattr(q, "difficulty", "Intermediate"),
            "star_framework": q.star_guidance or {},
            "suggested_points": q.suggested_answer_points or [],
        })

    return {
        "role_title": role_title,
        "company": company,
        "technical_questions": tech_questions,
        "behavioral_questions": behavioral_questions,
        "questions_to_ask_interviewer": getattr(prep_data, "questions_to_ask_interviewer", []),
        "preparation_tips": getattr(prep_data, "key_topics_to_review", []),
    }


# =============================================================================
# 8. generate_followup_email
# =============================================================================
async def generate_followup_email(
    application_id: Optional[str] = None,
    company: str = "Company",
    role_title: str = "Developer",
    days_since_applied: int = 5,
) -> Dict[str, Any]:
    """
    Calculates cadence recommendations (Day 5 / Day 10) and generates
    professional follow-up email drafts.
    """
    interviewer_name = None
    candidate_name = "Candidate"

    async with AsyncSessionLocal() as db:
        if application_id:
            stmt = (
                select(Application)
                .where(Application.id == application_id)
                .options(selectinload(Application.job), selectinload(Application.candidate))
            )
            res = await db.execute(stmt)
            app = res.scalar_one_or_none()
            if app:
                if app.job:
                    company = app.job.company or company
                    role_title = app.job.title or role_title
                if app.candidate and app.candidate.full_name:
                    candidate_name = app.candidate.full_name
                if app.recruiter_name:
                    interviewer_name = app.recruiter_name
        else:
            cand_res = await db.execute(select(CandidateProfile))
            cand = cand_res.scalars().first()
            if cand and cand.full_name:
                candidate_name = cand.full_name

    # Cadence recommendation
    if days_since_applied <= 5:
        cadence_type = "Day 5 Polite Check-In"
        cadence_advice = (
            "Day 5 is the optimal timing for your first gentle status inquiry. "
            "Reiterate enthusiasm and express appreciation for the team's consideration."
        )
    elif days_since_applied <= 10:
        cadence_type = "Day 10 Follow-Up / Value Add"
        cadence_advice = (
            "Day 10 cadence: Reference your initial application, provide a brief update or value-add, "
            "and reiterate your availability."
        )
    else:
        cadence_type = "Day 14+ Final Graceful Check-In"
        cadence_advice = (
            "Subsequent follow-up: Keep it succinct and gracious, acknowledging their busy hiring schedule."
        )

    ai_provider = get_ai_provider("fallback")
    email_result = await ai_provider.generate_follow_up_email(
        job_title=role_title,
        company=company,
        candidate_name=candidate_name,
        email_type="application_status",
        interviewer_name=interviewer_name,
        notes=f"{cadence_type} - {days_since_applied} days since applied",
    )

    clean_subject = strip_emojis(email_result.subject)
    clean_body = strip_emojis(email_result.body)

    return {
        "cadence_type": cadence_type,
        "days_since_applied": days_since_applied,
        "cadence_advice": cadence_advice,
        "recommended_timing": "5 business days for initial check-in, 10 business days for secondary inquiry",
        "subject": clean_subject,
        "body": clean_body,
        "recipient_company": company,
        "role_title": role_title,
    }
