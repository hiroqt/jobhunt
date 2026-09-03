import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_sources_listing_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/sources")
        assert res.status_code == 200
        sources = res.json()
        assert isinstance(sources, list)
        assert len(sources) >= 5
        source_names = [s["source_name"] for s in sources]
        assert "linkedin" in source_names
        assert "indeed" in source_names
        assert "remoteok" in source_names


@pytest.mark.asyncio
async def test_search_configuration_crud():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create Search
        create_payload = {
            "name": "Junior Next.js Developer",
            "sources": ["linkedin", "remoteok", "public"],
            "keywords": ["Next.js", "React", "TypeScript"],
            "locations": ["Remote"],
            "remote_types": ["Remote"],
            "employment_types": ["Full-time"],
            "experience_levels": ["Junior"],
            "salary_min": 60000,
            "currency": "USD",
            "posted_within": "24_HOURS",
            "schedule_frequency": "DAILY"
        }
        res = await client.post("/api/searches", json=create_payload)
        assert res.status_code == 201
        search_data = res.json()
        search_id = search_data["id"]
        assert search_data["name"] == "Junior Next.js Developer"
        assert "remoteok" in search_data["sources"]

        # 2. List Searches
        list_res = await client.get("/api/searches")
        assert list_res.status_code == 200
        searches = list_res.json()
        assert any(s["id"] == search_id for s in searches)

        # 3. Get Search
        get_res = await client.get(f"/api/searches/{search_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == search_id

        # 4. Patch Search
        patch_res = await client.patch(
            f"/api/searches/{search_id}",
            json={"name": "Junior Next.js & React Pro", "salary_min": 65000}
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["name"] == "Junior Next.js & React Pro"
        assert patch_res.json()["salary_min"] == 65000

        # 5. Run Search
        run_res = await client.post(f"/api/searches/{search_id}/run")
        assert run_res.status_code == 200
        run_data = run_res.json()
        assert run_data["search_id"] == search_id
        assert run_data["status"] in ("COMPLETED", "PARTIAL_SUCCESS")
        assert run_data["jobs_discovered"] >= 0

        # 6. Check Executions
        execs_res = await client.get(f"/api/searches/{search_id}/executions")
        assert execs_res.status_code == 200
        execs = execs_res.json()
        assert len(execs) > 0
        assert execs[0]["id"] == run_data["execution_id"]


@pytest.mark.asyncio
async def test_saved_jobs_and_notifications():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create candidate profile & extract a sample job
        job_res = await client.post(
            "/api/jobs/extract",
            json={
                "raw_text": "Job Title: Full Stack React Engineer\nCompany: Awesome Tech Inc\nRequirements: React, TypeScript, Node.js",
                "provider": "fallback"
            }
        )
        assert job_res.status_code == 201
        job_id = job_res.json()["id"]

        # 1. Save Job
        save_res = await client.post(f"/api/jobs/{job_id}/save")
        assert save_res.status_code == 200
        assert save_res.json()["is_saved"] is True

        # 2. List Saved Jobs
        saved_list_res = await client.get("/api/jobs/saved")
        assert saved_list_res.status_code == 200
        saved_jobs = saved_list_res.json()
        assert any(j["id"] == job_id for j in saved_jobs)

        # 3. Unsave Job
        unsave_res = await client.delete(f"/api/jobs/{job_id}/save")
        assert unsave_res.status_code == 200
        assert unsave_res.json()["is_saved"] is False

        # 4. Check Notifications
        notif_res = await client.get("/api/notifications")
        assert notif_res.status_code == 200
        notif_data = notif_res.json()
        assert "notifications" in notif_data
        assert "unread_count" in notif_data

        if notif_data["notifications"]:
            first_id = notif_data["notifications"][0]["id"]
            # Mark single read
            read_res = await client.patch(f"/api/notifications/{first_id}/read", json={"read": True})
            assert read_res.status_code == 200
            assert read_res.json()["read"] is True

        # Mark all read
        mark_all_res = await client.post("/api/notifications/read-all")
        assert mark_all_res.status_code == 200

        # 5. Verify Job Link Endpoint
        verify_res = await client.post(f"/api/jobs/{job_id}/verify-link")
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert verify_data["job_id"] == job_id
        assert "is_active" in verify_data
        assert "search_url" in verify_data
        assert verify_data["is_active"] is True
