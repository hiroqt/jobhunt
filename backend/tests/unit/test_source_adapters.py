import pytest
from backend.app.sources.base import JobSearchQuery
from backend.app.sources.adapters.remoteok import RemoteOKAdapter
from backend.app.sources.adapters.linkedin import LinkedInAdapter
from backend.app.sources.adapters.indeed import IndeedAdapter
from backend.app.sources.adapters.jobstreet import JobStreetAdapter
from backend.app.sources.adapters.kalibrr import KalibrrAdapter
from backend.app.sources.adapters.onlinejobs import OnlineJobsAdapter
from backend.app.sources.adapters.bossjob import BossjobAdapter
from backend.app.sources.adapters.philjobnet import PhilJobNetAdapter
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
async def test_jobstreet_adapter_discovery_and_normalization():
    adapter = JobStreetAdapter()
    assert adapter.get_source_name() == "jobstreet"
    
    query = JobSearchQuery(keywords=["Laravel Developer"], locations=["Philippines"], limit=3)
    raw_jobs = await adapter.search(query)
    assert len(raw_jobs) > 0

    # Verify uniqueness of external IDs
    ext_ids = [j.external_id for j in raw_jobs]
    assert len(set(ext_ids)) == len(raw_jobs)

    for j in raw_jobs:
        norm = adapter.normalize(j)
        assert norm.source == "jobstreet"
        assert norm.company != ""
        assert norm.currency == "PHP"
        assert "psoc" in (norm.raw_data or {})

    health = await adapter.health_check()
    assert health.status == "HEALTHY"


@pytest.mark.asyncio
async def test_kalibrr_adapter_discovery_and_normalization():
    adapter = KalibrrAdapter()
    assert adapter.get_source_name() == "kalibrr"
    assert adapter.get_display_name() == "Kalibrr PH"

    query = JobSearchQuery(keywords=["Frontend Developer"], locations=["Philippines"], limit=3)
    raw_jobs = await adapter.search(query)
    assert len(raw_jobs) > 0

    norm = adapter.normalize(raw_jobs[0])
    assert norm.source == "kalibrr"
    assert norm.currency == "PHP"
    assert "psoc" in (norm.raw_data or {})

    health = await adapter.health_check()
    assert health.status == "HEALTHY"


@pytest.mark.asyncio
async def test_onlinejobs_adapter_discovery_and_normalization():
    adapter = OnlineJobsAdapter()
    assert adapter.get_source_name() == "onlinejobs"
    assert adapter.get_display_name() == "OnlineJobs.ph"

    query = JobSearchQuery(keywords=["Virtual Assistant"], locations=["Philippines"], limit=3)
    raw_jobs = await adapter.search(query)
    assert len(raw_jobs) > 0

    norm = adapter.normalize(raw_jobs[0])
    assert norm.source == "onlinejobs"
    assert norm.workplace_type == "Remote"
    assert "psoc" in (norm.raw_data or {})

    health = await adapter.health_check()
    assert health.status == "HEALTHY"


@pytest.mark.asyncio
async def test_bossjob_adapter_discovery_and_normalization():
    adapter = BossjobAdapter()
    assert adapter.get_source_name() == "bossjob"
    assert adapter.get_display_name() == "Bossjob PH"

    query = JobSearchQuery(keywords=["Customer Service Representative"], locations=["Philippines"], limit=2)
    raw_jobs = await adapter.search(query)
    assert len(raw_jobs) > 0

    norm = adapter.normalize(raw_jobs[0])
    assert norm.source == "bossjob"
    assert norm.currency == "PHP"

    health = await adapter.health_check()
    assert health.status == "HEALTHY"


@pytest.mark.asyncio
async def test_philjobnet_adapter_discovery_and_normalization():
    adapter = PhilJobNetAdapter()
    assert adapter.get_source_name() == "philjobnet"
    assert adapter.get_display_name() == "PhilJobNet (DOLE)"

    query = JobSearchQuery(keywords=["IT Specialist"], locations=["Philippines"], limit=2)
    raw_jobs = await adapter.search(query)
    assert len(raw_jobs) > 0

    norm = adapter.normalize(raw_jobs[0])
    assert norm.source == "philjobnet"
    assert norm.currency == "PHP"

    health = await adapter.health_check()
    assert health.status == "HEALTHY"
