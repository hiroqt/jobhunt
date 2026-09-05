import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, or_, desc

from backend.app.models.base import Base
from backend.app.models.job import Job
from backend.app.processing.psoc_classifier import (
    get_location_filter_keywords,
    get_all_philippines_keywords,
    get_psoc_group_keywords,
    PH_REGIONS,
)


def test_location_filter_keywords_resolution():
    # NCR resolution
    is_remote, ncr_kws = get_location_filter_keywords("NCR")
    assert is_remote is False
    assert "bgc" in ncr_kws
    assert "taguig" in ncr_kws
    assert "makati" in ncr_kws
    assert "pasig" in ncr_kws
    assert "quezon city" in ncr_kws

    # Clark / Central Luzon resolution
    is_remote, clark_kws = get_location_filter_keywords("Clark")
    assert is_remote is False
    assert "clark" in clark_kws
    assert "pampanga" in clark_kws
    assert "angeles" in clark_kws
    assert "subic" in clark_kws

    # Cebu / Central Visayas resolution
    is_remote, cebu_kws = get_location_filter_keywords("Cebu")
    assert is_remote is False
    assert "cebu" in cebu_kws
    assert "mandaue" in cebu_kws
    assert "cebu it park" in cebu_kws

    # CALABARZON / Laguna resolution
    is_remote, calabarzon_kws = get_location_filter_keywords("CALABARZON")
    assert is_remote is False
    assert "laguna" in calabarzon_kws
    assert "cavite" in calabarzon_kws
    assert "santa rosa" in calabarzon_kws
    assert "dasmarinas" in calabarzon_kws

    # Davao / Mindanao resolution
    is_remote, davao_kws = get_location_filter_keywords("Davao")
    assert is_remote is False
    assert "davao" in davao_kws
    assert "tagum" in davao_kws
    assert "cagayan de oro" in davao_kws

    # Worldwide Remote resolution
    is_remote, remote_kws = get_location_filter_keywords("Remote")
    assert is_remote is True
    assert "remote" in remote_kws


def test_all_philippines_keywords():
    all_ph = get_all_philippines_keywords()
    assert len(all_ph) > 50
    assert "philippines" in all_ph
    assert "bgc" in all_ph
    assert "taguig" in all_ph
    assert "cebu" in all_ph
    assert "pampanga" in all_ph
    assert "davao" in all_ph
    assert "baguio" in all_ph
    assert "iloilo" in all_ph


@pytest.mark.asyncio
async def test_db_location_and_psoc_filtering_queries():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        test_jobs = [
            # 1. NCR Job (Taguig BGC)
            Job(
                title="Senior Laravel Engineer",
                company="Fintech Phils",
                location="Bonifacio Global City, Taguig",
                workplace_type="Hybrid",
                source="jobstreet",
                currency="PHP",
                summary="Build web applications in BGC.",
            ),
            # 2. NCR Job (Makati)
            Job(
                title="React Frontend Developer",
                company="Ayala Corp",
                location="Makati City, Metro Manila",
                workplace_type="Onsite",
                source="kalibrr",
                currency="PHP",
                summary="React UI development in Makati.",
            ),
            # 3. Central Visayas (Cebu)
            Job(
                title="DevOps Engineer",
                company="Cebu IT Park Hub",
                location="Mandaue City, Cebu",
                workplace_type="Hybrid",
                source="bossjob",
                currency="PHP",
                summary="Kubernetes and cloud infra in Cebu.",
            ),
            # 4. Central Luzon (Pampanga / Clark)
            Job(
                title="Python Backend Engineer",
                company="Clark Tech Park",
                location="Angeles City, Pampanga",
                workplace_type="Hybrid",
                source="jobstreet",
                currency="PHP",
                summary="Python services in Pampanga.",
            ),
            # 5. CALABARZON (Laguna / Cavite)
            Job(
                title="Systems Software Developer",
                company="Laguna Technopark",
                location="Santa Rosa, Laguna",
                workplace_type="Onsite",
                source="philjobnet",
                currency="PHP",
                summary="C++ firmware development in Santa Rosa.",
            ),
            # 6. Mindanao (Davao)
            Job(
                title="Full Stack Web Developer",
                company="Davao Tech Group",
                location="Davao City, Davao del Sur",
                workplace_type="Hybrid",
                source="kalibrr",
                currency="PHP",
                summary="Full stack web apps in Davao.",
            ),
            # 7. Worldwide Remote
            Job(
                title="Staff Distributed Systems Architect",
                company="Global Distributed Labs",
                location="Worldwide Remote",
                workplace_type="Remote",
                source="remoteok",
                currency="USD",
                summary="Architect global distributed systems.",
            ),
            # 8. Foreign US Onsite
            Job(
                title="Hardware Lab Technician",
                company="San Francisco Tech Lab",
                location="San Francisco, CA, United States",
                workplace_type="Onsite",
                source="indeed",
                currency="USD",
                summary="Hardware testing onsite in California.",
            ),
        ]

        db.add_all(test_jobs)
        await db.commit()

        # Query helper simulating list_jobs logic
        async def query_jobs(location=None, ph_only=None, psoc_group=None):
            q = select(Job).order_by(desc(Job.created_at))
            if ph_only:
                ph_sources = ["jobstreet", "kalibrr", "onlinejobs", "bossjob", "philjobnet"]
                all_ph_kw = get_all_philippines_keywords()
                loc_clauses = [Job.location.ilike(f"%{k}%") for k in all_ph_kw]
                q = q.where(
                    or_(
                        Job.source.in_(ph_sources),
                        Job.currency == "PHP",
                        *loc_clauses
                    )
                )

            if location:
                is_remote, kw_list = get_location_filter_keywords(location)
                if is_remote:
                    q = q.where(
                        or_(
                            Job.workplace_type.ilike("%Remote%"),
                            Job.location.ilike("%Remote%"),
                            Job.location.ilike("%Worldwide%"),
                            Job.location.ilike("%Anywhere%"),
                            Job.location.ilike("%Work from home%"),
                            Job.location.ilike("%WFH%")
                        )
                    )
                elif kw_list:
                    loc_conditions = [Job.location.ilike(f"%{k}%") for k in kw_list]
                    q = q.where(or_(*loc_conditions))

            if psoc_group is not None:
                psoc_kws = get_psoc_group_keywords(psoc_group)
                if psoc_kws:
                    psoc_conditions = []
                    for kw in psoc_kws:
                        psoc_conditions.append(Job.title.ilike(f"%{kw}%"))
                        psoc_conditions.append(Job.summary.ilike(f"%{kw}%"))
                    q = q.where(or_(*psoc_conditions))

            res = await db.execute(q)
            return list(res.scalars().all())

        # Test NCR Filter: Should return Taguig and Makati jobs
        ncr_results = await query_jobs(location="NCR")
        assert len(ncr_results) == 2
        titles = [j.title for j in ncr_results]
        assert "Senior Laravel Engineer" in titles
        assert "React Frontend Developer" in titles

        # Test Cebu Filter: Should return Mandaue/Cebu job
        cebu_results = await query_jobs(location="Cebu")
        assert len(cebu_results) == 1
        assert cebu_results[0].title == "DevOps Engineer"

        # Test Clark Filter: Should return Pampanga/Clark job
        clark_results = await query_jobs(location="Clark")
        assert len(clark_results) == 1
        assert clark_results[0].title == "Python Backend Engineer"

        # Test CALABARZON Filter: Should return Laguna job
        calabarzon_results = await query_jobs(location="CALABARZON")
        assert len(calabarzon_results) == 1
        assert calabarzon_results[0].title == "Systems Software Developer"

        # Test Davao Filter: Should return Davao job
        davao_results = await query_jobs(location="Davao")
        assert len(davao_results) == 1
        assert davao_results[0].title == "Full Stack Web Developer"

        # Test Remote Filter: Should return Worldwide Remote job
        remote_results = await query_jobs(location="Remote")
        assert len(remote_results) == 1
        assert remote_results[0].title == "Staff Distributed Systems Architect"

        # Test Philippines Only Filter: Should return 6 Philippine jobs and exclude San Francisco
        ph_results = await query_jobs(ph_only=True)
        assert len(ph_results) == 6
        for j in ph_results:
            assert "San Francisco" not in j.location

        # Test Combined: ph_only=True AND location="NCR"
        combined_results = await query_jobs(ph_only=True, location="NCR")
        assert len(combined_results) == 2

        # Test PSOC Group 2 (Professionals - Engineers/Developers)
        psoc2_results = await query_jobs(psoc_group=2)
        assert len(psoc2_results) >= 6

    await engine.dispose()
