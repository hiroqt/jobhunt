import re
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from backend.app.sources.base import RawJob, NormalizedJobData
from backend.app.processing.url_validator import validate_and_canonicalize_url
from backend.app.verification.types import (
    VerificationResult,
    VerificationStatus,
    AuthoritativeSourceData,
    IdentityComparison,
    JobTrustScore,
    JobFieldEvidence,
    FieldCertainty
)
from backend.app.verification.identity import (
    calculate_identity_comparison,
    evaluate_verification_confidence,
    evaluate_content_completeness,
    calculate_job_trust_score
)
from backend.app.verification.extractor import (
    extract_authoritative_source_data,
    is_valid_source_host
)
from backend.app.core.logging import logger


class JobVerificationService:
    """
    Implements Sections 31-35 of Job Data Accuracy & Verification Specification,
    upgraded to V3.0 multi-dimensional Job Trust Scoring and Evidence Tracking.
    """

    @staticmethod
    async def verify_discovered_job(
        job: RawJob,
        perform_network_verification: bool = False
    ) -> VerificationResult:
        """
        Executes verification workflow:
        1. URL validation & canonicalization
        2. Host validation
        3. Authoritative data extraction (if network check enabled)
        4. Identity comparison
        5. Multi-dimensional trust scoring & threshold evaluation
        6. Field-level evidence extraction
        """
        now = datetime.now(timezone.utc)
        target_url = job.url

        # 1. URL Canonicalization
        is_valid, canonical_url, err = validate_and_canonicalize_url(target_url)
        if not is_valid:
            trust_score = JobTrustScore(
                source_authority=0.50,
                identity_confidence=0.0,
                content_confidence=0.0,
                freshness_confidence=0.0,
                availability_confidence=0.0,
                overall_trust_score=0.0,
                trust_grade="SUSPICIOUS"
            )
            return VerificationResult(
                exists=False,
                status=VerificationStatus.INVALID,
                confidence=0.0,
                canonical_url=target_url,
                external_id=job.external_id,
                trust_score=trust_score,
                checked_at=now,
                reason=f"Malformed URL: {err}",
                error=err
            )

        # 2. Host validation
        if not is_valid_source_host(canonical_url):
            trust_score = JobTrustScore(
                source_authority=0.50,
                identity_confidence=0.0,
                content_confidence=0.0,
                freshness_confidence=0.0,
                availability_confidence=0.0,
                overall_trust_score=0.0,
                trust_grade="SUSPICIOUS"
            )
            return VerificationResult(
                exists=False,
                status=VerificationStatus.INVALID,
                confidence=0.0,
                canonical_url=canonical_url,
                external_id=job.external_id,
                trust_score=trust_score,
                checked_at=now,
                reason="Disallowed or unrecognized source host",
                error="Invalid domain"
            )

        # 3. Authoritative Data Extraction
        source_data = AuthoritativeSourceData(is_active=True)
        has_network_data = False

        if perform_network_verification and not any(k in canonical_url.lower() for k in ["/jobs/search", "?search="]):
            source_data = await extract_authoritative_source_data(canonical_url)
            has_network_data = bool(source_data.title or source_data.company)
            if not source_data.is_active:
                status = VerificationStatus.EXPIRED if source_data.status_code in (404, 410) else VerificationStatus.INVALID
                trust_score = JobTrustScore(
                    source_authority=0.70,
                    identity_confidence=0.0,
                    content_confidence=0.0,
                    freshness_confidence=0.0,
                    availability_confidence=0.0,
                    overall_trust_score=0.0,
                    trust_grade="SUSPICIOUS"
                )
                return VerificationResult(
                    exists=False,
                    status=status,
                    confidence=0.0,
                    canonical_url=canonical_url,
                    external_id=job.external_id,
                    source_data=source_data,
                    trust_score=trust_score,
                    checked_at=now,
                    reason=f"Destination page inactive (status: {source_data.status_code})",
                )

        # 4. Identity Comparison
        auth_title = source_data.title or job.title
        auth_company = source_data.company or job.company
        auth_loc = source_data.location or job.location
        auth_id = source_data.external_id or job.external_id

        identity = calculate_identity_comparison(
            discovered_external_id=job.external_id,
            authoritative_external_id=auth_id,
            discovered_title=job.title,
            authoritative_title=auth_title,
            discovered_company=job.company,
            authoritative_company=auth_company,
            discovered_location=job.location,
            authoritative_location=auth_loc
        )

        # 5. Evaluate Confidence
        confidence, status, reason = evaluate_verification_confidence(
            identity,
            has_authoritative_data=True
        )

        # 6. Multi-Dimensional Trust Score & Field Evidence
        job_desc = source_data.description or (job.raw_data.get("description") if job.raw_data else "")
        content_comp = evaluate_content_completeness(
            title=auth_title,
            company=auth_company,
            description=job_desc,
            skills=job.raw_data.get("skills") if job.raw_data else None,
            salary_min=job.raw_data.get("salary_min") if job.raw_data else None
        )

        # Extract posted_at if present in raw_job
        posted_at_raw = getattr(job, "posted_at", None)
        if not posted_at_raw and job.raw_data:
            posted_at_raw = job.raw_data.get("posted_at")

        trust_score = calculate_job_trust_score(
            source=getattr(job, "source", None),
            identity_confidence=confidence,
            content_confidence=content_comp,
            posted_at=posted_at_raw,
            is_active=source_data.is_active,
            status_code=source_data.status_code or 200
        )

        field_evidence: List[JobFieldEvidence] = [
            JobFieldEvidence(
                field_name="title",
                extracted_value=auth_title,
                source_layer="AUTHORITATIVE_EXTRACTOR" if has_network_data else "DISCOVERY_FEED",
                confidence=round(identity.title_similarity, 2),
                evidence_text=f"Discovered '{job.title}' vs Authoritative '{auth_title}'",
                field_certainty=FieldCertainty.VERIFIED if identity.title_similarity >= 0.90 else FieldCertainty.LIKELY
            ),
            JobFieldEvidence(
                field_name="company",
                extracted_value=auth_company,
                source_layer="AUTHORITATIVE_EXTRACTOR" if has_network_data else "DISCOVERY_FEED",
                confidence=round(identity.company_similarity, 2),
                evidence_text=f"Discovered '{job.company}' vs Authoritative '{auth_company}'",
                field_certainty=FieldCertainty.VERIFIED if identity.company_similarity >= 0.90 else FieldCertainty.LIKELY
            )
        ]

        if auth_loc:
            field_evidence.append(JobFieldEvidence(
                field_name="location",
                extracted_value=auth_loc,
                source_layer="AUTHORITATIVE_EXTRACTOR" if has_network_data else "DISCOVERY_FEED",
                confidence=round(identity.location_similarity, 2),
                evidence_text=f"Location verified as '{auth_loc}'",
                field_certainty=FieldCertainty.VERIFIED if identity.location_similarity >= 0.90 else FieldCertainty.LIKELY
            ))

        return VerificationResult(
            exists=True,
            status=status,
            confidence=confidence,
            canonical_url=canonical_url,
            external_id=job.external_id,
            source_data=source_data,
            identity=identity,
            trust_score=trust_score,
            field_evidence=field_evidence,
            checked_at=now,
            reason=reason
        )


job_verification_service = JobVerificationService()
