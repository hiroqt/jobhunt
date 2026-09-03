import re
from typing import Tuple, Optional, List
from difflib import SequenceMatcher
from backend.app.models.job import Job
from backend.app.sources.base import NormalizedJobData
from backend.app.processing.url_validator import validate_and_canonicalize_url


def clean_string_for_comparison(s: Optional[str]) -> str:
    if not s:
        return ""
    # Lowercase and remove punctuation / excess whitespace
    s = s.lower()
    s = re.sub(r"[^\w\s]", " ", s)
    return " ".join(s.split())


def calculate_string_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    a_clean = clean_string_for_comparison(a)
    b_clean = clean_string_for_comparison(b)
    if a_clean == b_clean:
        return 1.0
    return SequenceMatcher(None, a_clean, b_clean).ratio()


def calculate_job_similarity(candidate_job: NormalizedJobData, existing_job: Job) -> Tuple[float, str]:
    """
    Computes a composite similarity score between a newly discovered job and an existing persisted job.
    Returns (confidence_score, reason).
    """
    # 1. Exact Source + External ID match
    if candidate_job.external_id and existing_job.external_id:
        if (candidate_job.source == existing_job.source and 
            str(candidate_job.external_id) == str(existing_job.external_id)):
            return 1.0, f"Exact match on source '{candidate_job.source}' and external ID '{candidate_job.external_id}'"

    # 2. Canonical URL exact match
    if candidate_job.canonical_url and existing_job.canonical_url:
        if candidate_job.canonical_url.strip().lower() == existing_job.canonical_url.strip().lower():
            return 0.98, f"Exact match on canonical URL: {candidate_job.canonical_url}"

    # 3. Normalized Title + Company + Location Similarity
    title_sim = calculate_string_similarity(candidate_job.title, existing_job.title)
    company_sim = calculate_string_similarity(candidate_job.company, existing_job.company)
    
    # If company doesn't match well (< 0.75), not a duplicate
    if company_sim < 0.75:
        return 0.0, "Different companies"

    # Distinct source search portals (e.g. Various Verified on Indeed vs Various on JobStreet) are distinct sources
    if "various" in candidate_job.company.lower() and "various" in existing_job.company.lower() and candidate_job.source != existing_job.source:
        return 0.0, f"Distinct discovery platforms ({candidate_job.source} vs {existing_job.source})"

    # If title is very close and company is identical or very close
    loc_sim = calculate_string_similarity(candidate_job.location or "", existing_job.location or "")
    
    # Weighted composite score: 55% Title, 35% Company, 10% Location
    composite = (title_sim * 0.55) + (company_sim * 0.35) + (loc_sim * 0.10)

    if composite >= 0.85:
        return composite, f"High content similarity (Title: {round(title_sim*100)}%, Company: {round(company_sim*100)}%)"

    return composite, f"Low duplicate confidence ({round(composite*100)}%)"


def check_job_duplicate(candidate_job: NormalizedJobData, existing_jobs: List[Job]) -> Tuple[bool, float, str, Optional[Job]]:
    """
    Evaluates a candidate job against a list of existing jobs.
    Returns (is_duplicate, confidence, reason, matched_existing_job).
    Threshold for duplicate merge is >= 0.85.
    """
    for existing in existing_jobs:
        conf, reason = calculate_job_similarity(candidate_job, existing)
        if conf >= 0.85:
            return True, conf, reason, existing

    return False, 0.0, "No duplicate found", None
