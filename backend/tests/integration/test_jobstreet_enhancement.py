import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from backend.app.models.base import Base
from backend.app.models.candidate import CandidateProfile
from backend.app.models.search import JobSearch
from backend.app.models.job import Job
from backend.app.sources.adapters.jobstreet import JobStreetAdapter
from backend.app.sources.base import JobSearchQuery
from backend.app.verification.verifier import job_verification_service
from backend.app.verification.types import VerificationStatus
from backend.app.discovery.orchestrator import execute_search_pipeline


@pytest.mark.asyncio
async def test_jobstreet_adapter_multi_query_and_regional_routing():
    adapter = JobStreetAdapter()

    # 1. Test Philippines query for Laravel
    q_ph = JobSearchQuery(keywords=["Laravel"], locations=["Philippines"], limit=8)
    jobs_ph = await adapter.search(q_ph)
    assert len(jobs_ph) == 8
    
    # Check that companies are diverse and external IDs are unique
    companies_ph = [j.company for j in jobs_ph]
    assert len(set(companies_ph)) >= 7
    ext_ids_ph = [j.external_id for j in jobs_ph]
    assert len(set(ext_ids_ph)) == len(jobs_ph)

    for j in jobs_ph:
        assert "laravel" in j.title.lower()
        assert "jobstreet.com.ph" in j.url
        assert "createdAt=7d" in j.url or "/job/" in j.url

    # 2. Test Singapore query for React
    q_sg = JobSearchQuery(keywords=["React"], locations=["Singapore"], limit=6)
    jobs_sg = await adapter.search(q_sg)
    assert len(jobs_sg) == 6
    for j in jobs_sg:
        assert "react" in j.title.lower()
        assert "jobstreet.com.sg" in j.url
        assert "createdAt=7d" in j.url or "/job/" in j.url


@pytest.mark.asyncio
async def test_jobstreet_verification_service_compliance():
    adapter = JobStreetAdapter()
    q = JobSearchQuery(keywords=["Vue.js Developer"], locations=["Philippines"], limit=5)
    raw_jobs = await adapter.search(q)
    assert len(raw_jobs) == 5

    for rj in raw_jobs:
        v_res = await job_verification_service.verify_discovered_job(rj, perform_network_verification=False)
        assert v_res.exists is True
        assert v_res.status in (VerificationStatus.VERIFIED, VerificationStatus.UNVERIFIED)
        assert v_res.status != VerificationStatus.INVALID
        assert v_res.confidence >= 0.75


@pytest.mark.asyncio
async def test_jobstreet_orchestrator_pipeline_e2e():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Create candidate
        candidate = CandidateProfile(
            full_name="JobStreet Candidate",
            email="candidate@jobstreet.test",
            target_roles=["Full Stack Laravel Developer"],
            preferred_locations=["Philippines"],
            years_of_experience=3
        )
        db.add(candidate)
        await db.flush()

        # Create search configured with JobStreet
        search = JobSearch(
            candidate_id=candidate.id,
            name="JobStreet Exclusive Test Search",
            keywords=["Laravel"],
            locations=["Philippines"],
            sources=["jobstreet"],
            enabled=True
        )
        db.add(search)
        await db.commit()

        # Execute discovery pipeline
        execution = await execute_search_pipeline(search=search, candidate=candidate, db=db)
        assert execution.status == "COMPLETED"
        assert execution.jobs_found >= 10
        assert execution.jobs_normalized >= 10
        assert execution.jobs_failed == 0

        # Query persisted jobs
        stmt = select(Job).where(Job.search_id == search.id)
        res = await db.execute(stmt)
        saved_jobs = list(res.scalars().all())

        assert len(saved_jobs) >= 10
        for job in saved_jobs:
            assert job.source == "jobstreet"
            assert "laravel" in job.title.lower()
            assert "jobstreet.com.ph" in job.url
            assert "createdAt=7d" in job.url or "/job/" in job.url
            assert job.verification_status in ("VERIFIED", "UNVERIFIED")
            assert job.verification_confidence is not None
            assert job.verification_confidence >= 0.75

    await engine.dispose()
