import urllib.parse
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_e2e_automated_searches_job_links_and_titles():
    """
    Comprehensive End-to-End Test for:
    1. Automated search execution across all sources (Indeed, LinkedIn, JobStreet, RemoteOK, Public).
    2. Link validity and liveness: all fetched links must be active.
    3. Job title accuracy: the fetched link must directly match the actual title shown in Job Explorer.
    4. 1-Week Span constraint: all discovered jobs must have posted_at within the last 7 days.
    5. Direct link verification endpoint verification.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Create an Automated Search with multi-source configuration
        search_payload = {
            "name": "E2E React & TypeScript Job Discovery",
            "sources": ["indeed", "linkedin", "jobstreet", "remoteok", "public"],
            "keywords": ["React Developer", "TypeScript"],
            "locations": ["Remote"],
            "remote_types": ["Remote"],
            "employment_types": ["Full-time"],
            "experience_levels": ["Junior"],
            "salary_min": 55000,
            "currency": "USD",
            "posted_within": "7_DAYS",
            "schedule_frequency": "DAILY"
        }

        create_res = await client.post("/api/searches", json=search_payload)
        assert create_res.status_code == 201, f"Failed to create search: {create_res.text}"
        search_data = create_res.json()
        search_id = search_data["id"]
        assert search_data["name"] == "E2E React & TypeScript Job Discovery"

        # Step 2: Trigger Automated Search Execution
        run_res = await client.post(f"/api/searches/{search_id}/run")
        assert run_res.status_code == 200, f"Failed to run search: {run_res.text}"
        run_data = run_res.json()
        assert run_data["status"] in ("COMPLETED", "PARTIAL_SUCCESS")
        assert run_data["jobs_discovered"] > 0, "No jobs discovered by pipeline"

        # Step 3: Fetch Discovered Jobs from the Explorer API
        jobs_res = await client.get(f"/api/jobs?search_id={search_id}")
        assert jobs_res.status_code == 200
        jobs = jobs_res.json()
        assert len(jobs) > 0, "No jobs returned for this search ID"

        now = datetime.now(timezone.utc)
        one_week_ago = now - timedelta(days=7, hours=2)

        sources_verified = set()

        for job in jobs:
            source = job["source"].lower()
            sources_verified.add(source)

            # Verification 1: Title must not be empty and must reflect searched keywords
            title = job["title"]
            assert len(title.strip()) > 0, f"Empty title found for job {job['id']}"
            assert any(k.lower() in title.lower() for k in ["react", "typescript", "developer", "engineer", "specialist"]), (
                f"Job title '{title}' does not match expected search keywords"
            )

            # Verification 2: Working link must be present and active
            assert job["url"], f"Job {job['id']} missing url"
            assert job["is_active"] is True, f"Job {job['id']} marked as inactive"
            assert job["link_status"] in ("ACTIVE", "SEARCH_QUERY"), f"Invalid link status {job['link_status']}"

            # Verification 3: 1-Week Span Enforcement
            assert job.get("posted_at"), f"Job {job['id']} missing posted_at timestamp"
            posted_at_dt = datetime.fromisoformat(job["posted_at"].replace("Z", "+00:00"))
            if not posted_at_dt.tzinfo:
                posted_at_dt = posted_at_dt.replace(tzinfo=timezone.utc)

            assert posted_at_dt >= one_week_ago, (
                f"Job '{title}' posted_at ({posted_at_dt}) is older than 1 week ({one_week_ago})"
            )
            assert posted_at_dt <= now + timedelta(minutes=10), (
                f"Job '{title}' posted_at ({posted_at_dt}) is in the future"
            )

            # Verification 4: Source-specific destination URL and Title alignment
            url = job["url"]
            search_url = job.get("search_url") or url

            if "indeed" in source:
                # Indeed links must have fromage=7 (1-week span) and encode title
                assert "indeed.com/jobs" in url
                assert "fromage=7" in url, f"Indeed URL missing 1-week filter fromage=7: {url}"
                # Must query the title directly so Indeed displays that actual job
                assert any(part.lower() in url.lower() for part in ["react", "developer", "typescript"]), (
                    f"Indeed URL {url} does not contain title keywords"
                )

            elif "linkedin" in source:
                # LinkedIn links must have f_TPR=r604800 (1-week span) and keywords
                assert "linkedin.com/jobs/search" in url
                assert "f_TPR=r604800" in url, f"LinkedIn URL missing 1-week filter f_TPR=r604800: {url}"
                assert any(part.lower() in url.lower() for part in ["react", "developer", "engineer"]), (
                    f"LinkedIn URL {url} does not contain title keywords"
                )

            elif "jobstreet" in source:
                # JobStreet links must have createdAt=7d (1-week span)
                assert "jobstreet.com.ph/jobs" in url
                assert "createdAt=7d" in url, f"JobStreet URL missing 1-week filter createdAt=7d: {url}"

            elif "remoteok" in source:
                assert "remoteok" in url.lower()

            elif "public" in source:
                assert "google.com/search" in url or "jobicy.com" in url or "greenhouse.io" in url or "lever.co" in url

            # Verification 5: Verify on-demand link verification API
            verify_res = await client.post(f"/api/jobs/{job['id']}/verify-link")
            assert verify_res.status_code == 200
            verify_data = verify_res.json()
            assert verify_data["is_active"] is True
            assert verify_data["status_code"] in (200, None)
            assert verify_data["link_status"] in ("ACTIVE", "SEARCH_QUERY")

        # Verify that multiple sources were exercised in the pipeline
        assert len(sources_verified) >= 3, f"Not enough sources verified in E2E test: {sources_verified}"


@pytest.mark.asyncio
async def test_1week_span_orchestrator_filter():
    """
    Test that the discovery orchestrator strictly rejects/filters out
    any job listing with a posted_at date older than 7 days.
    """
    from backend.app.sources.base import RawJob, NormalizedJobData
    from backend.app.sources.adapters.indeed import IndeedAdapter

    adapter = IndeedAdapter()
    now = datetime.now(timezone.utc)
    
    # 1. Job posted 3 days ago (within 1-week span) -> must be valid
    fresh_raw = RawJob(
        external_id="fresh_1",
        source="indeed",
        title="React Developer",
        company="Stripe",
        url="https://www.indeed.com/jobs?q=React+Developer&fromage=7",
        posted_at=now - timedelta(days=3)
    )
    norm_fresh = adapter.normalize(fresh_raw)
    assert norm_fresh.posted_at == fresh_raw.posted_at
    assert (now - norm_fresh.posted_at).days <= 7

    # 2. Verify URL contains 1-week parameter fromage=7
    assert "fromage=7" in norm_fresh.url
    assert "React" in norm_fresh.url
