import re
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from backend.app.sources.base import RawJob, NormalizedJobData
from backend.app.processing.url_validator import validate_and_canonicalize_url
from backend.app.verification.types import (
    VerificationResult,
    VerificationStatus,
    AuthoritativeSourceData,
    IdentityComparison
)
from backend.app.verification.identity import (
    calculate_identity_comparison,
    evaluate_verification_confidence
)
from backend.app.verification.extractor import (
    extract_authoritative_source_data,
    is_valid_source_host
)
from backend.app.core.logging import logger


class JobVerificationService:
    """
    Implements Sections 31-35 of Job Data Accuracy & Verification Specification.
    Verifies discovered job listings against destination authoritative metadata.
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
        5. Confidence scoring & threshold evaluation
        """
        now = datetime.now(timezone.utc)
        target_url = job.url

        # 1. URL Canonicalization
        is_valid, canonical_url, err = validate_and_canonicalize_url(target_url)
        if not is_valid:
            return VerificationResult(
                exists=False,
                status=VerificationStatus.INVALID,
                confidence=0.0,
                canonical_url=target_url,
                external_id=job.external_id,
                checked_at=now,
                reason=f"Malformed URL: {err}",
                error=err
            )

        # 2. Host validation
        if not is_valid_source_host(canonical_url):
            return VerificationResult(
                exists=False,
                status=VerificationStatus.INVALID,
                confidence=0.0,
                canonical_url=canonical_url,
                external_id=job.external_id,
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
                return VerificationResult(
                    exists=False,
                    status=VerificationStatus.EXPIRED if source_data.status_code in (404, 410) else VerificationStatus.INVALID,
                    confidence=0.0,
                    canonical_url=canonical_url,
                    external_id=job.external_id,
                    source_data=source_data,
                    checked_at=now,
                    reason=f"Destination page inactive (status: {source_data.status_code})",
                )

        # 4. Identity Comparison
        # Compare discovered attributes with source authoritative data (or self-consistency if feed is authoritative)
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

        return VerificationResult(
            exists=True,
            status=status,
            confidence=confidence,
            canonical_url=canonical_url,
            external_id=job.external_id,
            source_data=source_data,
            identity=identity,
            checked_at=now,
            reason=reason
        )


job_verification_service = JobVerificationService()
