import pytest
from backend.app.sources.base import JobSearchQuery
from backend.app.sources.adapters.remoteok import RemoteOKAdapter
from backend.app.sources.adapters.linkedin import LinkedInAdapter
from backend.app.sources.adapters.indeed import IndeedAdapter
from backend.app.sources.adapters.jobstreet import JobStreetAdapter
from backend.app.sources.adapters.public_careers import PublicCareersAdapter


@pytest.mark.asyncio
async def test_linkedin_adapter_discovery_and_normalization():
    adapter = LinkedInAdapter()
    assert adapter.get_source_name() == "linkedin"
    assert adapter.get_display_name() == "LinkedIn"
    
    policy = adapter.get_policy()
    assert policy.allowed is True
    assert policy.supports_search is True

    query = JobSearchQuery(
        keywords=["React Developer"],
        locations=["Remote"],
        remote_types=["Remote"],
        employment_types=["Full-time"],
        limit=3
    )

    raw_jobs = await adapter.search(query)
    assert len(raw_jobs) > 0
    raw = raw_jobs[0]
    assert raw.source == "linkedin"
    assert any(k in raw.title.lower() for k in ["react", "developer", "engineer", "ui", "web", "frontend", "software"])

    norm = adapter.normalize(raw)
    assert norm.source == "linkedin"
    assert norm.canonical_url.startswith("https://")
    assert len(norm.skills) > 0
    assert norm.workplace_type == "Remote"

    health = await adapter.health_check()
    assert health.status == "HEALTHY"


@pytest.mark.asyncio
async def test_indeed_adapter_discovery_and_normalization():
    adapter = IndeedAdapter()
    assert adapter.get_source_name() == "indeed"
    
    query = JobSearchQuery(keywords=["Python Developer"], limit=2)
    raw_jobs = await adapter.search(query)
    assert len(raw_jobs) > 0

    norm = adapter.normalize(raw_jobs[0])
    assert norm.source == "indeed"
    assert norm.title != ""
    assert norm.company != ""

    health = await adapter.health_check()
    assert health.status == "HEALTHY"


@pytest.mark.asyncio
async def test_jobstreet_adapter_discovery_and_normalization():
    adapter = JobStreetAdapter()
    assert adapter.get_source_name() == "jobstreet"
    
    query = JobSearchQuery(keywords=["Laravel Developer"], locations=["Philippines"], limit=5)
    raw_jobs = await adapter.search(query)
    assert len(raw_jobs) == 5

    # Verify uniqueness of external IDs
    ext_ids = [j.external_id for j in raw_jobs]
    assert len(set(ext_ids)) == len(raw_jobs)

    # Verify normalization and 1-week span URL
    for j in raw_jobs:
        norm = adapter.normalize(j)
        assert norm.source == "jobstreet"
        assert norm.location == "Philippines"
        assert "createdAt=7d" in norm.url or "/job/" in norm.url
        assert norm.company != ""

    health = await adapter.health_check()
    assert health.status == "HEALTHY"


@pytest.mark.asyncio
async def test_public_careers_adapter_discovery_and_normalization():
    adapter = PublicCareersAdapter()
    assert adapter.get_source_name() == "public"
    
    query = JobSearchQuery(keywords=["Next.js Developer"], limit=2)
    raw_jobs = await adapter.search(query)
    assert len(raw_jobs) > 0

    norm = adapter.normalize(raw_jobs[0])
    assert norm.source == "public"
    assert "Next.js" in norm.skills or "TypeScript" in norm.skills

    health = await adapter.health_check()
    assert health.status == "HEALTHY"


@pytest.mark.asyncio
async def test_remoteok_adapter_fallback_and_normalization():
    adapter = RemoteOKAdapter()
    assert adapter.get_source_name() == "remoteok"
    
    query = JobSearchQuery(keywords=["Frontend Developer"], limit=2)
    raw_jobs = await adapter.search(query)
    assert len(raw_jobs) > 0

    norm = adapter.normalize(raw_jobs[0])
    assert norm.source == "remoteok"
    assert norm.salary_min is not None
