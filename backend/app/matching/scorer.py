from typing import List, Dict, Set, Tuple, Optional
from backend.app.schemas.matching import MatchBreakdown, SkillMatchDetail
from backend.app.models.candidate import CandidateProfile, CandidateSkill
from backend.app.models.job import Job, JobSkill
from backend.app.processing.normalizer import normalize_skill_name


def calculate_match_scores(
    candidate: CandidateProfile,
    job: Job,
    job_skills: List[JobSkill],
    candidate_skills: List[CandidateSkill]
) -> Tuple[int, MatchBreakdown, List[SkillMatchDetail], List[str], List[str], List[str]]:
    """
    Calculates weighted match score across 6 dimensions according to V3.0 Production Architecture:
    - Technical Skills: 35% (using 4-tier skill weighting: CRITICAL=3.0, REQUIRED=2.0, PREFERRED=1.0, BONUS=0.5)
    - Role Compatibility: 25%
    - Experience: 15% (with semantic range and junior-friendly curve)
    - Education: 10%
    - Location / Remote: 10%
    - Other (Salary/Culture): 5%
    
    Also evaluates Hard Requirement Eligibility Gate for mandatory non-negotiable constraints.
    Returns: (overall_score, breakdown, skill_details, matched_skills, missing_critical, missing_preferred)
    """
    # 1. Technical Skills (35%)
    cand_skill_map: Dict[str, CandidateSkill] = {}
    for cs in candidate_skills:
        if cs.skill:
            canon = normalize_skill_name(cs.skill.name)
            cand_skill_map[canon.lower()] = cs

    skill_details: List[SkillMatchDetail] = []
    matched_skills: List[str] = []
    missing_critical: List[str] = []
    missing_preferred: List[str] = []

    total_weight = 0.0
    earned_weight = 0.0
    critical_constraint_failed = False
    hard_requirement_reason: Optional[str] = None

    if not job_skills:
        # Default generous baseline if no explicit skills parsed
        tech_score = 75.0
    else:
        for js in job_skills:
            if not js.skill:
                continue
            skill_name = js.skill.name
            canon = normalize_skill_name(skill_name)
            
            # Determine 4-tier skill level
            raw_tier = getattr(js, "tier", None)
            if raw_tier in ("CRITICAL", "REQUIRED", "PREFERRED", "BONUS"):
                tier = raw_tier
            elif js.is_required and getattr(js, "importance_weight", 1) >= 4:
                tier = "CRITICAL"
            elif js.is_required:
                tier = "REQUIRED"
            else:
                tier = "PREFERRED"

            # Assign tier weights: CRITICAL=3.0, REQUIRED=2.0, PREFERRED=1.0, BONUS=0.5
            tier_weights = {
                "CRITICAL": 3.0,
                "REQUIRED": 2.0,
                "PREFERRED": 1.0,
                "BONUS": 0.5
            }
            weight = tier_weights.get(tier, 2.0 if js.is_required else 1.0)
            total_weight += weight
            
            cs = cand_skill_map.get(canon.lower())
            if cs:
                # Candidate has skill
                matched_skills.append(canon)
                earned_weight += weight
                status = "MATCH"
                skill_details.append(SkillMatchDetail(
                    skill_name=canon,
                    is_required=js.is_required,
                    candidate_has=True,
                    candidate_proficiency=cs.proficiency_level,
                    candidate_years=cs.years_experience,
                    status=status,
                    tier=tier
                ))
            else:
                # Candidate missing skill
                if js.is_required:
                    missing_critical.append(canon)
                    status = "MISSING"
                    if tier == "CRITICAL" and not hard_requirement_reason:
                        critical_constraint_failed = True
                        hard_requirement_reason = f"Missing critical required skill '{canon}'"
                else:
                    missing_preferred.append(canon)
                    status = "PARTIAL"
                
                skill_details.append(SkillMatchDetail(
                    skill_name=canon,
                    is_required=js.is_required,
                    candidate_has=False,
                    candidate_proficiency=None,
                    candidate_years=0,
                    status=status,
                    tier=tier
                ))

        tech_score = (earned_weight / total_weight * 100.0) if total_weight > 0 else 80.0

    # 2. Role Compatibility (25%)
    role_score = 60.0
    cand_target_roles = [r.lower() for r in (candidate.target_roles or [])]
    job_title_lower = (job.title or "").lower()
    
    if any(target in job_title_lower or job_title_lower in target for target in cand_target_roles):
        role_score = 100.0
    elif any(word in job_title_lower for word in ["developer", "engineer", "software", "full stack", "frontend", "backend"]):
        role_score = 85.0
    else:
        role_score = 65.0

    # 3. Experience Match (15%)
    cand_years = candidate.years_of_experience or 0
    job_req_years = job.min_years_experience or 0
    exp_gap = max(0, job_req_years - cand_years)
    
    if cand_years >= job_req_years:
        exp_score = 100.0
    elif exp_gap <= 1:
        exp_score = 85.0  # Junior-friendly curve for 1-year gap
    elif exp_gap <= 2:
        exp_score = 60.0
    else:
        exp_score = 30.0
        if exp_gap > 3 and not hard_requirement_reason:
            critical_constraint_failed = True
            hard_requirement_reason = f"Excessive experience gap ({exp_gap} years required delta)"

    # 4. Education Match (10%)
    edu_score = 90.0  # Default high match for CS / IT / Bootcamp backgrounds

    # 5. Location / Workplace Type Match (10%)
    cand_workplaces = [w.lower() for w in (candidate.workplace_types or ["remote", "hybrid"])]
    job_workplace = (job.workplace_type or "remote").lower()
    
    if job_workplace in cand_workplaces or "remote" in job_workplace:
        loc_score = 100.0
    else:
        loc_score = 60.0

    # 6. Other / Salary alignment (5%)
    other_score = 85.0
    if job.salary_min and candidate.min_salary:
        cand_curr = (getattr(candidate, "currency", None) or "USD").upper()
        job_curr = (getattr(job, "currency", None) or "USD").upper()
        
        cand_min = float(candidate.min_salary)
        job_min = float(job.salary_min)

        # Standardize monthly vs annual for PHP (amounts < 200,000 PHP are monthly)
        if cand_curr == "PHP" and cand_min < 200000:
            cand_min *= 12.0
        if job_curr == "PHP" and job_min < 200000:
            job_min *= 12.0

        # Approximate cross-currency conversion if currencies differ (e.g. PHP vs USD, 1 USD ≈ 56 PHP)
        if job_curr == "USD" and cand_curr == "PHP":
            job_min *= 56.0
        elif job_curr == "PHP" and cand_curr == "USD":
            job_min /= 56.0
        elif job_curr == "SGD" and cand_curr == "PHP":
            job_min *= 42.0
        elif job_curr == "PHP" and cand_curr == "SGD":
            job_min /= 42.0

        if job_min >= cand_min:
            other_score = 100.0
        elif job_min >= cand_min * 0.8:
            other_score = 75.0
        else:
            other_score = 50.0

    # Weighted Overall Score
    overall_float = (
        (tech_score * 0.35) +
        (role_score * 0.25) +
        (exp_score * 0.15) +
        (edu_score * 0.10) +
        (loc_score * 0.10) +
        (other_score * 0.05)
    )
    overall_score = max(10, min(99, int(round(overall_float))))

    eligibility_status = "FAILED_CRITICAL_CONSTRAINT" if critical_constraint_failed else "ELIGIBLE"

    breakdown = MatchBreakdown(
        technical_skills_score=round(tech_score, 1),
        role_compatibility_score=round(role_score, 1),
        experience_score=round(exp_score, 1),
        education_score=round(edu_score, 1),
        location_score=round(loc_score, 1),
        other_score=round(other_score, 1),
        eligibility_status=eligibility_status,
        critical_constraint_failed=critical_constraint_failed,
        hard_requirement_reason=hard_requirement_reason
    )

    return overall_score, breakdown, skill_details, matched_skills, missing_critical, missing_preferred
