import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, List, Any
from difflib import SequenceMatcher

from backend.app.verification.types import (
    IdentityComparison,
    VerificationStatus,
    JobTrustScore,
    FreshnessClassification,
    FieldCertainty,
    JobFieldEvidence
)


def clean_string_for_comparison(s: Optional[str]) -> str:
    if not s:
        return ""
    # Lowercase, strip special symbols, and collapse multiple spaces
    s = s.lower()
    s = re.sub(r"[^\w\s]", " ", s)
    return " ".join(s.split())


def calculate_string_similarity(a: Optional[str], b: Optional[str]) -> float:
    if not a or not b:
        return 0.0
    a_clean = clean_string_for_comparison(a)
    b_clean = clean_string_for_comparison(b)
    if not a_clean or not b_clean:
        return 0.0
    if a_clean == b_clean:
        return 1.0
    return SequenceMatcher(None, a_clean, b_clean).ratio()


def calculate_source_authority(source: Optional[str]) -> float:
    """
    Evaluates intrinsic domain credibility based on data ownership:
    - Official company careers page / direct ATS (Greenhouse, Lever): 1.0 / 0.95
    - Major trusted job board (LinkedIn, Indeed, JobStreet): 0.85
    - Aggregator / curated remote board (RemoteOK): 0.75
    - Search snippet / unverified manual: 0.50
    """
    if not source:
        return 0.70
    src = source.lower().strip()
    if any(k in src for k in ["company", "careers", "greenhouse", "lever", "workday", "ashby"]):
        return 0.98
    if any(k in src for k in ["linkedin", "jobstreet", "indeed"]):
        return 0.88
    if any(k in src for k in ["remoteok", "public careers", "wellfound"]):
        return 0.78
    return 0.70


def evaluate_freshness_confidence(
    posted_at: Optional[datetime],
    now: Optional[datetime] = None
) -> Tuple[float, FreshnessClassification]:
    """
    Nuanced freshness evaluation:
    - FRESH: < 7 days (confidence 1.0)
    - RECENT: 7 - 14 days (confidence 0.80)
    - STALE: 14 - 30 days (confidence 0.50)
    - UNKNOWN: Missing timestamp (confidence 0.60 - do not discard!)
    - EXPIRED: Confirmed closed (confidence 0.0)
    """
    if not posted_at:
        return 0.60, FreshnessClassification.UNKNOWN

    current_time = now or datetime.now(timezone.utc)
    p_at = posted_at if posted_at.tzinfo else posted_at.replace(tzinfo=timezone.utc)
    delta = current_time - p_at

    if delta < timedelta(days=0):
        # Future-dated or clock skew, treat as Fresh
        return 1.0, FreshnessClassification.FRESH
    elif delta <= timedelta(days=7):
        return 1.0, FreshnessClassification.FRESH
    elif delta <= timedelta(days=14):
        return 0.80, FreshnessClassification.RECENT
    elif delta <= timedelta(days=30):
        return 0.50, FreshnessClassification.STALE
    else:
        return 0.25, FreshnessClassification.STALE


def evaluate_content_completeness(
    title: Optional[str],
    company: Optional[str],
    description: Optional[str],
    skills: Optional[List[Any]] = None,
    salary_min: Optional[int] = None
) -> float:
    """
    Measures extracted content completeness:
    - Title & Company present: 40%
    - Rich Description (> 300 chars): 30%
    - Skills identified: 15%
    - Salary identified: 15%
    """
    score = 0.0
    if title and len(title.strip()) >= 3:
        score += 0.20
    if company and len(company.strip()) >= 2:
        score += 0.20
    if description and len(description.strip()) >= 300:
        score += 0.30
    elif description and len(description.strip()) >= 100:
        score += 0.15
    if skills and len(skills) > 0:
        score += 0.15
    if salary_min is not None and salary_min > 0:
        score += 0.15
    return min(1.0, score)


def calculate_job_trust_score(
    source: Optional[str],
    identity_confidence: float,
    content_confidence: float,
    posted_at: Optional[datetime],
    is_active: bool = True,
    status_code: Optional[int] = 200,
) -> JobTrustScore:
    """
    Computes composite multi-dimensional Job Trust Score:
    Overall = (0.20 * SourceAuth) + (0.30 * IdentityConf) + (0.20 * ContentConf) + (0.15 * FreshnessConf) + (0.15 * AvailabilityConf)
    """
    source_auth = calculate_source_authority(source)
    fresh_conf, fresh_class = evaluate_freshness_confidence(posted_at)

    if not is_active or status_code in (404, 410):
        avail_conf = 0.0
        fresh_class = FreshnessClassification.EXPIRED
    elif status_code and status_code >= 400:
        avail_conf = 0.30
    else:
        avail_conf = 1.0

    overall = (
        (0.20 * source_auth) +
        (0.30 * identity_confidence) +
        (0.20 * content_confidence) +
        (0.15 * fresh_conf) +
        (0.15 * avail_conf)
    )
    overall = round(max(0.0, min(1.0, overall)), 2)

    if overall >= 0.85:
        grade = "HIGH_TRUST"
    elif overall >= 0.70:
        grade = "VERIFIED"
    elif overall >= 0.50:
        grade = "PROVISIONAL"
    else:
        grade = "SUSPICIOUS"

    return JobTrustScore(
        source_authority=round(source_auth, 2),
        identity_confidence=round(identity_confidence, 2),
        content_confidence=round(content_confidence, 2),
        freshness_confidence=round(fresh_conf, 2),
        availability_confidence=round(avail_conf, 2),
        overall_trust_score=overall,
        trust_grade=grade,
        freshness_classification=fresh_class
    )


def calculate_identity_comparison(
    discovered_external_id: Optional[str],
    authoritative_external_id: Optional[str],
    discovered_title: str,
    authoritative_title: Optional[str],
    discovered_company: str,
    authoritative_company: Optional[str],
    discovered_location: Optional[str],
    authoritative_location: Optional[str],
) -> IdentityComparison:
    """
    Compares discovered candidate attributes against source-derived authoritative data.
    """
    # External ID matching
    id_match = False
    if discovered_external_id and authoritative_external_id:
        clean_disc_id = str(discovered_external_id).strip().lower()
        clean_auth_id = str(authoritative_external_id).strip().lower()
        id_match = (clean_disc_id == clean_auth_id) or (clean_disc_id in clean_auth_id) or (clean_auth_id in clean_disc_id)
    elif not discovered_external_id and not authoritative_external_id:
        # If neither had an external ID, neutral
        id_match = True

    title_sim = calculate_string_similarity(discovered_title, authoritative_title or discovered_title)
    company_sim = calculate_string_similarity(discovered_company, authoritative_company or discovered_company)
    
    # Location similarity
    if discovered_location and authoritative_location:
        loc_sim = calculate_string_similarity(discovered_location, authoritative_location)
    else:
        loc_sim = 1.0  # Default full match if location is missing/generic

    return IdentityComparison(
        title_similarity=title_sim,
        company_similarity=company_sim,
        location_similarity=loc_sim,
        external_id_match=id_match,
    )


def evaluate_verification_confidence(
    identity: IdentityComparison,
    has_authoritative_data: bool = True
) -> Tuple[float, VerificationStatus, str]:
    """
    Implements Section 34 (Confidence Model) and Section 35 (Verification Thresholds):
    - External Job ID: 40%
    - Company: 25%
    - Title: 20%
    - Location: 15%
    
    Thresholds:
    >= 0.90 -> VERIFIED
    0.75 - 0.89 -> UNVERIFIED / REVIEW
    < 0.75 -> INVALID
    
    Hard Failure Heuristic:
    External ID mismatch + Different company (< 0.70) => INVALID
    """
    id_score = 1.0 if identity.external_id_match else 0.0
    company_score = identity.company_similarity
    title_score = identity.title_similarity
    location_score = identity.location_similarity

    # Hard failure check: Mismatched ID AND mismatched company
    if not identity.external_id_match and company_score < 0.70:
        return 0.20, VerificationStatus.INVALID, "Critical failure: External ID mismatch and company mismatch"

    # Weighted confidence calculation
    confidence = (
        (id_score * 0.40) +
        (company_score * 0.25) +
        (title_score * 0.20) +
        (location_score * 0.15)
    )

    if not has_authoritative_data:
        # If authoritative data could not be fetched due to network/anti-bot
        # Preserve record as UNVERIFIED rather than INVALID
        return min(confidence, 0.80), VerificationStatus.UNVERIFIED, "Awaiting authoritative confirmation"

    if confidence >= 0.90:
        return round(confidence, 2), VerificationStatus.VERIFIED, "High confidence identity verification"
    elif confidence >= 0.75:
        return round(confidence, 2), VerificationStatus.UNVERIFIED, "Moderate confidence; flagged for unverified state"
    else:
        return round(confidence, 2), VerificationStatus.INVALID, f"Confidence {round(confidence*100)}% below 75% threshold"
