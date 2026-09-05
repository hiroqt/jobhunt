from typing import List, Tuple, Optional


def evaluate_decision_rules(
    overall_score: int,
    missing_critical_skills: List[str],
    experience_gap: int,
    critical_constraint_failed: bool = False,
    hard_requirement_reason: Optional[str] = None
) -> Tuple[str, str]:
    """
    Evaluates business decision rules for the candidate:
    - APPLY (Score >= 75, missing_critical <= 1, exp gap <= 1, no critical constraint failed)
    - REVIEW (Score 60-74, 2 missing skills, or critical constraint failed)
    - SKIP (Score < 60, > 2 missing mandatory skills, or experience gap > 2)
    
    Returns: (recommendation, justification_summary)
    """
    if critical_constraint_failed:
        # Hard Requirement Eligibility Gate tripped
        if overall_score >= 60 and experience_gap <= 2 and len(missing_critical_skills) <= 2:
            recommendation = "REVIEW"
            summary = (
                f"Review Required: Failed critical constraint ({hard_requirement_reason or 'missing mandatory qualification'}). "
                f"Overall composite score is {overall_score}%, but key non-negotiable requirements need human review."
            )
        else:
            recommendation = "SKIP"
            summary = (
                f"Role Not Recommended: Failed critical constraint ({hard_requirement_reason or 'missing mandatory qualification'}). "
                f"Prioritize higher-match roles to maximize interview callback rates."
            )
        return recommendation, summary

    if overall_score >= 75 and len(missing_critical_skills) <= 1 and experience_gap <= 1:
        recommendation = "APPLY"
        if not missing_critical_skills:
            summary = "High qualification match across technical requirements, seniority level, and target role. Highly recommended to apply."
        else:
            summary = f"Strong profile match. Only 1 critical requirement ({missing_critical_skills[0]}) is not explicitly listed in your profile, which can be addressed in your cover letter."
    elif overall_score >= 60 and len(missing_critical_skills) <= 2:
        recommendation = "REVIEW"
        summary = f"Moderate fit ({overall_score}%). Missing some key skills ({', '.join(missing_critical_skills[:2])}). Review the job description to decide if you have transferable project experience."
    else:
        recommendation = "SKIP"
        if len(missing_critical_skills) > 2:
            summary = f"Low qualification fit. Multiple mandatory skill gaps identified ({', '.join(missing_critical_skills[:3])}). Prioritize higher-match roles to maximize interview callback rates."
        elif experience_gap > 2:
            summary = f"Role requires significantly more experience ({experience_gap}+ years delta) than currently recorded on your profile."
        else:
            summary = f"Match score ({overall_score}%) falls below optimal qualification threshold."

    return recommendation, summary
