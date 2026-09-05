import pytest
from httpx import AsyncClient
from backend.app.sources.base import JobSearchQuery
from backend.app.sources.adapters.linkedin import LinkedInAdapter
from backend.app.sources.adapters.indeed import IndeedAdapter
from backend.app.sources.adapters.jobstreet import JobStreetAdapter
from backend.app.sources.adapters.public_careers import PublicCareersAdapter
from backend.app.sources.adapters.remoteok import RemoteOKAdapter
from backend.app.processing.normalizer import extract_skills_from_text


@pytest.mark.asyncio
async def test_dynamic_arbitrary_keyword_adapters():
    """
    Validates that searching for an arbitrary role / technology (e.g. Laravel, Python, DevOps)
    dynamically reflects the searched keyword across job titles, skills, and search URLs.
    """
    adapters = [
        LinkedInAdapter(),
        IndeedAdapter(),
        JobStreetAdapter(),
        PublicCareersAdapter(),
        RemoteOKAdapter(),
    ]

    for kw in ["Laravel", "Python", "DevOps"]:
        query = JobSearchQuery(keywords=[kw], limit=2)
        for adapter in adapters:
            jobs = await adapter.search(query)
            assert len(jobs) > 0, f"Adapter {adapter.get_source_name()} returned no jobs for '{kw}'"

            for raw in jobs:
                norm = adapter.normalize(raw)
                # Either title contains the keyword or skills contain the normalized skill
                has_kw_in_title = kw.lower() in norm.title.lower()
                has_kw_in_skills = any(kw.lower() in s.lower() for s in norm.skills)
                has_kw_in_url = kw.lower() in norm.url.lower() or (norm.search_url and kw.lower() in norm.search_url.lower())

                assert has_kw_in_title or has_kw_in_skills or has_kw_in_url, (
                    f"Adapter {adapter.get_source_name()} failed keyword reflection for '{kw}': "
                    f"title='{norm.title}', skills={norm.skills}, url={norm.url}"
                )


@pytest.mark.asyncio
async def test_search_jobs_api_arbitrary_term():
    """
    Tests that GET /api/jobs?search=... performs broad search across title, company,
    summary, raw_description, and location.
    """
    from httpx import ASGITransport
    from backend.app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Extract a job with Laravel in description
        job_raw_text = """
        Job Title: Senior Backend Developer
        Company: Enterprise Software Lab
        Location: Remote
        Workplace Type: Remote

        Requirements:
        - Extensive experience with Laravel framework and PHP 8.3
        - Strong background with PostgreSQL and REST API design
        """

        create_res = await client.post(
            "/api/jobs/extract",
            json={
                "raw_text": job_raw_text,
                "url": "https://example.com/jobs/laravel-backend-123",
                "provider": "fallback"
            }
        )
        assert create_res.status_code == 201

        # Search by 'laravel'
        search_res = await client.get("/api/jobs?search=laravel")
        assert search_res.status_code == 200
        results = search_res.json()
        assert len(results) >= 1
        # Verify that all results returned for search=laravel actually mention laravel in title, company, or text
        assert all("laravel" in (j["title"] + " " + (j.get("raw_description") or "") + " " + (j.get("summary") or "")).lower() for j in results)

        # Search by 'Enterprise Software Lab'
        company_res = await client.get("/api/jobs?search=Enterprise%20Software")
        assert company_res.status_code == 200
        assert any("Enterprise Software Lab" in j["company"] for j in company_res.json())

        # Test search_id filtering
        create_search_res = await client.post(
            "/api/searches",
            json={
                "name": "Integration Test Laravel Run",
                "sources": ["linkedin", "indeed"],
                "keywords": ["Laravel"],
                "locations": ["Remote"],
                "remote_types": ["Remote"]
            }
        )
        assert create_search_res.status_code == 201
        new_search_id = create_search_res.json()["id"]

        run_res = await client.post(f"/api/searches/{new_search_id}/run")
        assert run_res.status_code == 200
        assert run_res.json()["status"] == "COMPLETED"

        # Verify search_id filter on /api/jobs only returns jobs belonging to this search
        scoped_jobs_res = await client.get(f"/api/jobs?search_id={new_search_id}")
        assert scoped_jobs_res.status_code == 200
        scoped_jobs = scoped_jobs_res.json()
        assert len(scoped_jobs) > 0
        assert all(j["search_id"] == new_search_id for j in scoped_jobs)
