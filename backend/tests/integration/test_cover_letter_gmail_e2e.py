import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.db.session import init_db


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()


@pytest.mark.asyncio
async def test_cover_letter_and_company_email_e2e_pipeline():
    session_id = "test_gmail_e2e_session"
    headers = {"X-Session-ID": session_id}
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Populate Candidate Profile with name and skills
        candidate_res = await client.patch(
            "/api/candidate",
            headers=headers,
            json={
                "full_name": "Alex Mercer",
                "email": "alex.mercer@test.com",
                "target_roles": ["Full Stack Engineer"],
            }
        )
        assert candidate_res.status_code == 200
        assert candidate_res.json()["full_name"] == "Alex Mercer"

        # 2. Extract job posting that contains a contact email
        sample_job_post = """
        Full Stack Engineer
        Company: NovaScale Technologies
        Location: Remote
        Workplace Type: Remote
        Employment Type: Full-time

        About Us:
        NovaScale Technologies builds high-throughput cloud analytics.

        Key Responsibilities:
        - Develop scalable web applications using React and Python.
        - Build reliable REST APIs and GraphQL microservices.
        - Deploy infrastructure using Docker and cloud services.

        Requirements:
        - 2+ years of experience with Python, FastAPI, and React.
        - Strong background in SQL and database design.

        How to Apply:
        Please send your resume and custom cover letter to careers@novascale.io.
        Our recruitment team reviews submissions on a rolling basis.
        """

        extract_res = await client.post(
            "/api/jobs/extract",
            headers=headers,
            json={
                "raw_text": sample_job_post,
                "provider": "fallback",
            }
        )
        assert extract_res.status_code == 201, extract_res.text
        job_data = extract_res.json()
        assert job_data["title"] == "Full Stack Engineer"
        assert job_data["company"] == "NovaScale Technologies"
        assert job_data["contact_email"] == "careers@novascale.io"
        job_id = job_data["id"]

        # 3. Generate role-tailored Cover Letter for this job
        cl_res = await client.post(
            "/api/ai/cover-letter",
            headers=headers,
            json={
                "job_id": job_id,
                "job_title": job_data["title"],
                "company": job_data["company"],
                "job_description": sample_job_post,
                "tone": "professional",
                "length": "standard",
                "provider": "fallback",
            }
        )
        assert cl_res.status_code == 200, cl_res.text
        cl_data = cl_res.json()
        assert "NovaScale Technologies" in cl_data["company"]
        assert "Full Stack Engineer" in cl_data["subject_line"]
        assert "Alex Mercer" in cl_data["subject_line"] or "Alex Mercer" in cl_data["sign_off"]
        assert len(cl_data["cover_letter"]) > 100

        # 4. Create an Application for this Job (Kanban pipeline)
        app_res = await client.post(
            "/api/applications",
            headers=headers,
            json={
                "job_id": job_id,
                "status": "SAVED",
                "recruiter_email": job_data["contact_email"],
                "custom_cover_letter": cl_data["cover_letter"],
            }
        )
        assert app_res.status_code == 201, app_res.text
        app_data = app_res.json()
        assert app_data["job_id"] == job_id
        assert app_data["recruiter_email"] == "careers@novascale.io"
        assert app_data["custom_cover_letter"] == cl_data["cover_letter"]

        # 5. Fetch application list and verify persistence and relations
        list_apps_res = await client.get(
            f"/api/applications?jobId={job_id}",
            headers=headers
        )
        assert list_apps_res.status_code == 200
        apps_list = list_apps_res.json()
        assert len(apps_list) >= 1
        assert apps_list[0]["recruiter_email"] == "careers@novascale.io"
        assert apps_list[0]["custom_cover_letter"] == cl_data["cover_letter"]
