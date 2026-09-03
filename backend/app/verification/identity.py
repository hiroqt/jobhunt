import re
from typing import Optional, Tuple
from difflib import SequenceMatcher
from backend.app.verification.types import IdentityComparison, VerificationStatus


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
        loc_sim = 1.0 # Default full match if location is missing/generic

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
