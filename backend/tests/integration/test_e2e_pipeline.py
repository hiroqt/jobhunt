import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_complete_end_to_end_job_search_lifecycle():
    """
    E2E Test: Full user journey
    Candidate Profile -> Resume Upload -> Automated Search Execution -> Discovery & Deduplication ->
    Match Scoring -> High-Match Notification -> Save Job -> Application Pipeline -> Interview ->
    AI Interview Prep -> Feedback & Analytics.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Initialize Candidate Profile & Resume Upload
        resume_text = """
        Alex Rivera
        alex.rivera@example.com
        https://github.com/alexrivera
        https://linkedin.com/in/alexrivera

        Full-Stack Engineer with 2 years of experience specializing in TypeScript, React, Next.js, and Python FastAPI.
        Passionate about automated pipelines, high-performance web systems, and clean architecture.

        Technical Skills:
        - Languages: TypeScript, JavaScript, Python, SQL, HTML/CSS
        - Frameworks: React, Next.js, FastAPI, Node.js, Tailwind CSS
        - Databases & Tools: PostgreSQL, SQLite, Docker, Git, CI/CD, Pytest, Redis
        """
        upload_resp = await client.post(
            "/api/candidate/resume/upload",
            data={"raw_text": resume_text, "provider": "fallback"}
        )
        assert upload_resp.status_code == 200
        profile = upload_resp.json()
        assert profile["full_name"] == "Alex Rivera"
        assert len(profile["skills"]) >= 5

        # Step 2: Check Source Registry & Available Adapters
        sources_resp = await client.get("/api/sources")
        assert sources_resp.status_code == 200
        sources = sources_resp.json()
        assert len(sources) >= 5
        available_source_names = [s["source_name"] for s in sources]
        assert "linkedin" in available_source_names
        assert "indeed" in available_source_names
        assert "remoteok" in available_source_names

        # Step 3: Create Automated Search Configuration
        search_payload = {
            "name": "Full Stack React & FastAPI Remote",
            "sources": ["linkedin", "indeed", "remoteok", "public"],
            "keywords": ["React", "FastAPI", "Full Stack"],
            "locations": ["Remote"],
            "remote_types": ["Remote"],
            "employment_types": ["Full-time"],
            "experience_levels": ["Junior"],
            "salary_min": 55000,
            "currency": "USD",
            "posted_within": "24_HOURS",
            "schedule_frequency": "DAILY",
            "enabled": True
        }
        create_search_resp = await client.post("/api/searches", json=search_payload)
        assert create_search_resp.status_code == 201
        search = create_search_resp.json()
        search_id = search["id"]

        # Step 4: Trigger Search Run (Automated Discovery Pipeline)
        run_resp = await client.post(f"/api/searches/{search_id}/run")
        assert run_resp.status_code == 200
        run_result = run_resp.json()
        assert run_result["status"] in ("COMPLETED", "PARTIAL_SUCCESS")
        assert run_result["jobs_discovered"] > 0

        # Step 5: Verify Discovered Jobs & Match Scoring
        jobs_resp = await client.get("/api/jobs?limit=20")
        assert jobs_resp.status_code == 200
        jobs = jobs_resp.json()
        assert len(jobs) > 0

        # Check job has match score & qualification details
        top_job = jobs[0]
        assert top_job["match_score"] is not None
        assert top_job["recommendation"] in ("APPLY", "REVIEW", "SKIP")
        assert len(top_job["matched_skills"]) > 0

        # Step 6: Verify Notifications Generated
        notifs_resp = await client.get("/api/notifications")
        assert notifs_resp.status_code == 200
        notifs_data = notifs_resp.json()
        assert notifs_data["total_count"] > 0
        assert notifs_data["unread_count"] > 0

        # Step 7: Bookmark / Save the Top Job
        save_resp = await client.post(f"/api/jobs/{top_job['id']}/save")
        assert save_resp.status_code == 200
        assert save_resp.json()["is_saved"] is True

        # Verify it appears in saved jobs feed
        saved_jobs_resp = await client.get("/api/jobs/saved")
        assert saved_jobs_resp.status_code == 200
        saved_list = saved_jobs_resp.json()
        assert any(j["id"] == top_job["id"] for j in saved_list)

        # Step 8: Add Job to Application Pipeline (Kanban CRM)
        app_create_payload = {
            "job_id": top_job["id"],
            "status": "SAVED",
            "notes": "Target company discovered via automated search pipeline.",
            "recruiter_name": "Sarah Miller",
            "recruiter_email": "sarah@example.com"
        }
        app_resp = await client.post("/api/applications", json=app_create_payload)
        assert app_resp.status_code == 201
        app_data = app_resp.json()
        app_id = app_data["id"]
        assert app_data["status"] == "SAVED"

        # Step 9: Progress Application Status -> APPLIED -> TECHNICAL_INTERVIEW
        status_update_resp = await client.post(
            f"/api/applications/{app_id}/status",
            json={"status": "APPLIED", "notes": "Submitted custom resume and cover letter."}
        )
        assert status_update_resp.status_code == 200
        assert status_update_resp.json()["status"] == "APPLIED"

        # Progress to Interview
        interview_status_resp = await client.post(
            f"/api/applications/{app_id}/status",
            json={"status": "TECHNICAL_INTERVIEW", "notes": "Recruiter scheduled technical screening round."}
        )
        assert interview_status_resp.status_code == 200
        assert interview_status_resp.json()["status"] == "TECHNICAL_INTERVIEW"

        # Step 10: Schedule an Interview Round
        interview_payload = {
            "application_id": app_id,
            "round_name": "System Architecture & Live Coding",
            "scheduled_at": "2026-09-10T14:00:00Z",
            "interviewers": "Lead Software Architect",
            "meeting_link": "https://meet.google.com/xyz-test",
            "topics_covered": ["React State Management", "FastAPI Endpoints", "PostgreSQL Optimization"],
            "outcome": "PENDING"
        }
        iv_resp = await client.post("/api/interviews", json=interview_payload)
        assert iv_resp.status_code == 201
        iv_data = iv_resp.json()
        assert iv_data["round_name"] == "System Architecture & Live Coding"

        # Step 11: Generate AI Interview Prep Materials
        prep_resp = await client.post(
            "/api/ai/interview-prep",
            json={"job_id": top_job["id"], "provider": "fallback"}
        )
        assert prep_resp.status_code == 200
        prep_data = prep_resp.json()
        assert len(prep_data["top_technical_questions"]) > 0
        assert len(prep_data["top_behavioral_questions"]) > 0
        assert len(prep_data["questions_to_ask_interviewer"]) > 0

        # Step 12: Verify Analytics Dashboard reflect active pipeline & funnel
        analytics_resp = await client.get("/api/analytics/overview")
        assert analytics_resp.status_code == 200
        analytics = analytics_resp.json()
        assert analytics["total_applications"] >= 1
        assert analytics["active_applications"] >= 1
        assert len(analytics["funnel"]) >= 5
        assert len(analytics["source_breakdown"]) > 0
