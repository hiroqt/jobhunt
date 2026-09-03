import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.db.session import init_db, AsyncSessionLocal
from backend.app.db.seed import seed_initial_data


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)


@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_get_candidate_profile_and_resume_upload():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Initial clean profile
        response = await client.get("/api/candidate")
        assert response.status_code == 200
        data = response.json()
        assert "full_name" in data

        # 2. Upload and auto-populate profile from resume text
        sample_resume = """
        Jane Doe
        jane.doe@example.com
        https://github.com/janedoe
        https://linkedin.com/in/janedoe

        Full Stack Developer with 2 years of experience building modern web applications.
        Education: Bachelor of Science in Computer Science

        Skills:
        - React, TypeScript, Next.js, HTML5, CSS3, Tailwind CSS
        - Python, FastAPI, Node.js, REST API, PostgreSQL
        - Git, GitHub, Docker, CI/CD, pytest
        """
        upload_resp = await client.post(
            "/api/candidate/resume/upload",
            data={"raw_text": sample_resume, "provider": "fallback"}
        )
        assert upload_resp.status_code == 200
        updated = upload_resp.json()
        assert updated["full_name"] == "Jane Doe"
        assert updated["github_url"] == "https://github.com/janedoe"
        assert updated["years_of_experience"] == 2
        assert len(updated["skills"]) > 5


@pytest.mark.asyncio
async def test_job_extraction_and_matching():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First ensure candidate has skills via resume upload
        sample_resume = """
        John Developer
        john@example.com
        https://github.com/johndev
        Full Stack Engineer.
        Skills: React, TypeScript, Tailwind CSS, Python, FastAPI, Git
        """
        u_resp = await client.post(
            "/api/candidate/resume/upload",
            data={"raw_text": sample_resume, "provider": "fallback"}
        )
        assert u_resp.status_code == 200
        assert len(u_resp.json()["skills"]) > 0

        sample_post = """
        Job Title: Junior React Developer
        Company: Nexus Web Solutions
        Location: Remote
        Workplace Type: Remote
        
        Requirements:
        - React and TypeScript experience
        - Familiarity with Tailwind CSS and Git
        - Willingness to learn Python and FastAPI
        """
        response = await client.post(
            "/api/jobs/extract",
            json={
                "raw_text": sample_post,
                "url": "https://nexusweb.example/careers/junior-react",
                "provider": "fallback"
            }
        )
        assert response.status_code == 201
        job = response.json()
        assert job["title"] == "Junior React Developer"
        assert job["company"] == "Nexus Web Solutions"
        assert job["match_score"] is not None
        assert job["recommendation"] in ("APPLY", "REVIEW", "SKIP")
        assert len(job["matched_skills"]) > 0


@pytest.mark.asyncio
async def test_skills_taxonomy_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/candidate/skills/taxonomy")
        assert response.status_code == 200
        skills = response.json()
        assert isinstance(skills, list)
        assert len(skills) > 0
        assert "name" in skills[0]
        assert "category" in skills[0]


@pytest.mark.asyncio
async def test_application_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create a job first
        job_resp = await client.post(
            "/api/jobs/extract",
            json={
                "raw_text": "Job Title: Backend Engineer\nCompany: Test Corp\nRequirements: Python",
                "provider": "fallback"
            }
        )
        assert job_resp.status_code == 201
        job_id = job_resp.json()["id"]

        # 2. Create application (without requiring candidate_id)
        app_resp = await client.post(
            "/api/applications",
            json={
                "job_id": job_id,
                "status": "SAVED",
                "notes": "Testing application create"
            }
        )
        assert app_resp.status_code == 201
        app_data = app_resp.json()
        assert app_data["status"] == "SAVED"
        app_id = app_data["id"]

        # 3. Update status
        status_resp = await client.post(
            f"/api/applications/{app_id}/status",
            json={
                "status": "APPLIED",
                "notes": "Applied via company site"
            }
        )
        assert status_resp.status_code == 200
        assert status_resp.json()["status"] == "APPLIED"


@pytest.mark.asyncio
async def test_analytics_dashboard_overview():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/analytics/overview")
        assert response.status_code == 200
        data = response.json()
        assert "total_applications" in data
        assert "funnel" in data
        assert len(data["funnel"]) > 0
