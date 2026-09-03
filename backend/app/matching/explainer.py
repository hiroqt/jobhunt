from typing import List, Tuple
from backend.app.schemas.matching import MatchBreakdown


def generate_match_explanation(
    overall_score: int,
    recommendation: str,
    breakdown: MatchBreakdown,
    matched_skills: List[str],
    missing_critical: List[str],
    missing_preferred: List[str]
) -> Tuple[List[str], List[str]]:
    """
    Generates bulleted strengths and actionable advice for the candidate.
    """
    strengths: List[str] = []
    advice: List[str] = []

    # Strengths
    if matched_skills:
        strengths.append(f"Direct match on key technologies: {', '.join(matched_skills[:4])}.")
    if breakdown.role_compatibility_score >= 80:
        strengths.append("Strong title and role compatibility aligned with your career preferences.")
    if breakdown.location_score >= 90:
        strengths.append("Workplace type (Remote/Hybrid) matches your location criteria.")
    if breakdown.experience_score >= 80:
        strengths.append("Experience requirements align well with your current background.")

    # Actionable Advice
    if recommendation == "APPLY":
        advice.append("Tailor your top 3 resume bullet points to emphasize impact using matched tech stack.")
        advice.append("Submit application within 48 hours and set a Day-5 follow-up reminder.")
        if missing_critical:
            advice.append(f"Highlight any adjacent experience related to {missing_critical[0]} in your notes.")
    elif recommendation == "REVIEW":
        advice.append("Evaluate whether you can quickly bridge the missing skills with a portfolio project.")
        if missing_critical:
            advice.append(f"Key missing skills to address: {', '.join(missing_critical)}.")
        advice.append("Consider networking with engineers at the company on LinkedIn before applying.")
    else: # SKIP
        advice.append("Do not spend extensive time on this application unless you have a direct internal referral.")
        if missing_critical:
            advice.append(f"Add {missing_critical[0]} to your weekly learning roadmap to qualify for similar roles in the future.")

    return strengths, advice
