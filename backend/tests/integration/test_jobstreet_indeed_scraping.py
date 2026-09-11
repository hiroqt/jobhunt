import pytest
from datetime import datetime, timezone, timedelta

from backend.app.sources.base import JobSearchQuery
from backend.app.sources.adapters.jobstreet import JobStreetAdapter
from backend.app.sources.adapters.indeed import IndeedAdapter
from backend.app.processing.link_checker import verify_job_url_liveness
from backend.app.verification.verifier import job_verification_service
from backend.app.verification.types import VerificationStatus


@pytest.mark.asyncio
async def test_jobstreet_live_scraping_accuracy():
    adapter = JobStreetAdapter()
    query = JobSearchQuery(
        keywords=["Python Developer"],
        locations=["Philippines"],
        limit=5
    )

    jobs = await adapter.search(query)
    assert len(jobs) >= 3, f"Expected at least 3 jobs from JobStreet, got {len(jobs)}"

    has_live_v5 = any(j.raw_data.get("source_origin") == "jobstreet_v5_api" for j in jobs)
    assert has_live_v5, "Expected at least one job with origin 'jobstreet_v5_api'"

    for job in jobs:
        assert job.source == "jobstreet"
        assert job.title and len(job.title) > 3
        assert job.company and len(job.company) > 2
        assert job.url and job.url.startswith("https://")
        assert "jobstreet" in job.url.lower()
        assert job.posted_at is not None
        assert isinstance(job.skills, list) and len(job.skills) > 0

        # Normalization verification
        norm = adapter.normalize(job)
        assert norm.title == job.title.strip()
        assert norm.company == job.company.strip()
        assert norm.source == "jobstreet"
        assert norm.link_status == "ACTIVE"
        assert norm.search_url and "createdAt=7d" in norm.search_url
        if "/job/" in norm.canonical_url:
            assert norm.link_type == "DIRECT"


@pytest.mark.asyncio
async def test_indeed_live_scraping_accuracy():
    adapter = IndeedAdapter()
    query = JobSearchQuery(
        keywords=["React Developer"],
        locations=["Philippines"],
        limit=5
    )

    jobs = await adapter.search(query)
    assert len(jobs) >= 3, f"Expected at least 3 jobs from Indeed, got {len(jobs)}"

    has_live_gql = any(j.raw_data.get("source_origin") == "indeed_graphql_api" for j in jobs)
    assert has_live_gql, "Expected at least one job with origin 'indeed_graphql_api'"

    for job in jobs:
        assert job.source == "indeed"
        assert job.title and len(job.title) > 3
        assert job.company and len(job.company) > 2
        assert job.url and job.url.startswith("http")
        assert job.posted_at is not None
        assert isinstance(job.skills, list) and len(job.skills) > 0

        # Normalization verification
        norm = adapter.normalize(job)
        assert norm.title == job.title.strip()
        assert norm.company == job.company.strip()
        assert norm.source == "indeed"
        assert norm.link_status == "ACTIVE"
        assert norm.search_url and "fromage=7" in norm.search_url
        if "/viewjob" in norm.canonical_url or "/job/" in norm.canonical_url:
            assert norm.link_type == "DIRECT"


@pytest.mark.asyncio
async def test_indeed_remote_search():
    adapter = IndeedAdapter()
    query = JobSearchQuery(
        keywords=["Python Engineer"],
        locations=["Remote"],
        limit=3
    )

    jobs = await adapter.search(query)
    assert len(jobs) >= 1
    for job in jobs:
        assert job.source == "indeed"
        norm = adapter.normalize(job)
        assert norm.currency in ("USD", "PHP")
        assert norm.search_url and "fromage=7" in norm.search_url


@pytest.mark.asyncio
async def test_link_verification_service_with_jobstreet_and_indeed():
    # Test JobStreet direct URL
    js_res = await verify_job_url_liveness(
        url="https://www.jobstreet.com.ph/job/94570801",
        title="Test JobStreet Posting",
        source="jobstreet"
    )
    assert js_res["is_active"] is True
    assert js_res["status_code"] in (200, None)
    assert js_res["link_status"] in ("ACTIVE", "SEARCH_QUERY")

    # Test Indeed direct URL
    ind_res = await verify_job_url_liveness(
        url="https://ph.indeed.com/viewjob?jk=2dcf8e62fdd9f928",
        title="Test Indeed Posting",
        source="indeed"
    )
    assert ind_res["is_active"] is True
    assert ind_res["status_code"] in (200, None)
    assert ind_res["link_status"] in ("ACTIVE", "SEARCH_QUERY")
