import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.models.job import Job
from backend.app.models.candidate import CandidateProfile
from backend.app.models.search import JobSearch
from backend.app.sources.base import RawJob
from backend.app.verification.types import VerificationStatus
from backend.app.verification.identity import (
    calculate_string_similarity,
    calculate_identity_comparison,
    evaluate_verification_confidence,
)
from backend.app.verification.extractor import (
    extract_json_ld_job_posting,
    extract_opengraph_metadata,
    is_valid_source_host,
)
from backend.app.verification.verifier import JobVerificationService
from backend.app.discovery.orchestrator import execute_search_pipeline
from backend.app.db.session import AsyncSessionLocal


@pytest.mark.asyncio
async def test_identity_comparison_and_scoring():
    # 1. Exact match test
    identity = calculate_identity_comparison(
        discovered_external_id="12345",
        authoritative_external_id="12345",
        discovered_title="Senior Frontend Engineer",
        authoritative_title="Senior Frontend Engineer",
        discovered_company="Stripe",
        authoritative_company="Stripe",
        discovered_location="Remote",
        authoritative_location="Remote",
    )
    assert identity.external_id_match is True
    assert identity.title_similarity == 1.0
    assert identity.company_similarity == 1.0

    conf, status, reason = evaluate_verification_confidence(identity)
    assert conf >= 0.95
    assert status == VerificationStatus.VERIFIED

    # 2. Hard failure test: Mismatched ID + Mismatched Company
    bad_identity = calculate_identity_comparison(
        discovered_external_id="12345",
        authoritative_external_id="99999",
        discovered_title="Frontend Engineer",
        authoritative_title="Backend Architect",
        discovered_company="Stripe",
        authoritative_company="Netflix",
        discovered_location="Remote",
        authoritative_location="New York",
    )
    assert bad_identity.external_id_match is False
    assert bad_identity.company_similarity < 0.70

    bad_conf, bad_status, bad_reason = evaluate_verification_confidence(bad_identity)
    assert bad_status == VerificationStatus.INVALID
    assert "Critical failure" in bad_reason


@pytest.mark.asyncio
async def test_html_metadata_extraction():
    # Test JSON-LD schema extraction
    html_json_ld = """
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Software Engineer",
          "identifier": {
            "@type": "PropertyValue",
            "name": "Datadog",
            "value": "dd-987"
          },
          "hiringOrganization": {
            "@type": "Organization",
            "name": "Datadog"
          }
        }
        </script>
      </head>
      <body></body>
    </html>
    """
    extracted = extract_json_ld_job_posting(html_json_ld)
    assert extracted is not None
    assert extracted.get("title") == "Software Engineer"
    assert extracted.get("hiringOrganization", {}).get("name") == "Datadog"

    # Test OpenGraph extraction
    html_og = """
    <html>
      <head>
        <meta property="og:title" content="Staff Engineer at Stripe" />
        <meta property="og:description" content="Build global payments infrastructure." />
      </head>
      <body></body>
    </html>
    """
    og_meta = extract_opengraph_metadata(html_og)
    assert og_meta.get("og:title") == "Staff Engineer at Stripe"
    assert "payments" in og_meta.get("og:description")


@pytest.mark.asyncio
async def test_job_verification_service_flow():
    # Valid verified job
    valid_raw = RawJob(
        external_id="li_1001",
        source="linkedin",
        title="Frontend Developer",
        company="Stripe",
        location="Remote",
        url="https://www.linkedin.com/jobs/search/?keywords=Frontend+Developer",
    )
    v_res = await JobVerificationService.verify_discovered_job(valid_raw, perform_network_verification=False)
    assert v_res.exists is True
    assert v_res.status == VerificationStatus.VERIFIED
    assert v_res.confidence >= 0.90

    # Malformed URL should be rejected
    invalid_raw = RawJob(
        external_id="bad_1",
        source="linkedin",
        title="Unknown",
        company="Unknown",
        url="ht!tp://invalid url!@#$",
    )
    inv_res = await JobVerificationService.verify_discovered_job(invalid_raw, perform_network_verification=False)
    assert inv_res.status == VerificationStatus.INVALID


@pytest.mark.asyncio
async def test_e2e_search_discovery_and_verification_persistence():
    async with AsyncSessionLocal() as session:
        # 1. Setup candidate profile
        candidate = CandidateProfile(
            full_name="Verification Test User",
            email="test@verification.pipeline",
            target_roles=["Software Engineer"],
            preferred_locations=["Remote"],
            workplace_types=["Remote"],
            min_salary=60000,
            target_salary=90000,
            currency="USD",
            years_of_experience=2
        )
        session.add(candidate)
        await session.flush()

        # 2. Setup job search
        job_search = JobSearch(
            candidate_id=candidate.id,
            name="E2E Verification Search",
            sources=["remoteok", "linkedin"],
            keywords=["Software Engineer"],
            locations=["Remote"],
            remote_types=["Remote"],
            employment_types=["Full-time"],
            experience_levels=["Junior"],
            enabled=True
        )
        session.add(job_search)
        await session.flush()

        # 3. Execute discovery & verification pipeline
        execution = await execute_search_pipeline(
            search=job_search,
            candidate=candidate,
            db=session
        )
        assert execution.status in ("COMPLETED", "RUNNING")

        # 4. Assert that newly discovered jobs have verification fields populated
        jobs_stmt = select(Job).where(Job.search_id == job_search.id)
        res = await session.execute(jobs_stmt)
        persisted_jobs = res.scalars().all()

        assert len(persisted_jobs) > 0
        for j in persisted_jobs:
            assert j.verification_status in ("VERIFIED", "UNVERIFIED")
            assert j.verification_confidence is not None
            assert j.verification_confidence >= 0.75
            assert j.canonical_url is not None
            assert j.discovered_at is not None


@pytest.mark.asyncio
async def test_e2e_api_jobs_verification_contract():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/jobs")
        assert resp.status_code == 200
        jobs_data = resp.json()
        assert isinstance(jobs_data, list)
        if len(jobs_data) > 0:
            first_job = jobs_data[0]
            assert "verification_status" in first_job
            assert "verification_confidence" in first_job
            assert "canonical_url" in first_job

        # Test filter by verification_status
        verified_resp = await client.get("/api/jobs?verification_status=VERIFIED")
        assert verified_resp.status_code == 200
        verified_jobs = verified_resp.json()
        for vj in verified_jobs:
            assert vj["verification_status"] == "VERIFIED"
