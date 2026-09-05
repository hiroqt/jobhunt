import pytest
import httpx
from datetime import datetime, timezone
from sqlalchemy import select

from backend.app.main import app
from backend.app.db.session_manager import session_manager
from backend.app.models.job import Job
from backend.app.models.candidate import CandidateProfile


@pytest.mark.asyncio
async def test_e2e_location_and_taxonomy_filtering():
    session_id = "e2e_location_test_session"
    headers = {
        "Content-Type": "application/json",
        "X-Session-ID": session_id,
    }

    # Purge existing test session if any
    await session_manager.purge_session(session_id)

    # 1. Seed candidate & realistic jobs directly into the ephemeral session database
    session_maker, _ = await session_manager.get_or_create_session(session_id)
    async with session_maker() as db:
        # Create candidate profile
        candidate = CandidateProfile(
            full_name="Maria Santos",
            email="maria.santos@tech.ph",
            target_roles=["Senior Full Stack Engineer"],
            preferred_locations=["Philippines", "Metro Manila", "Cebu", "Remote"],
            years_of_experience=4,
        )
        db.add(candidate)
        await db.flush()

        # Seed diverse Philippine Regional Hubs & Global Remote Jobs
        seed_jobs = [
            # NCR / Metro Manila hubs
            Job(
                title="Senior Laravel & React Developer",
                company="Globe Telecom Tech Hub",
                location="Bonifacio Global City, Taguig",
                workplace_type="Hybrid",
                source="jobstreet",
                currency="PHP",
                salary_min=90000,
                salary_max=140000,
                match_score=92,
                recommendation="APPLY",
                summary="Full stack PHP Laravel and React developer in Taguig BGC.",
                raw_description="Architect web apps with Laravel, React, and TypeScript in Bonifacio Global City.",
            ),
            Job(
                title="Fintech Backend Golang Developer",
                company="Maya Philippines",
                location="Makati City, Metro Manila",
                workplace_type="Hybrid",
                source="kalibrr",
                currency="PHP",
                salary_min=100000,
                salary_max=160000,
                match_score=88,
                recommendation="APPLY",
                summary="Build high-throughput microservices using Go and PostgreSQL.",
                raw_description="Makati-based banking app development.",
            ),
            Job(
                title="Frontend Vue / TypeScript Specialist",
                company="Ortigas Media Solutions",
                location="Ortigas Center, Pasig City",
                workplace_type="Onsite",
                source="bossjob",
                currency="PHP",
                salary_min=70000,
                salary_max=110000,
                match_score=78,
                recommendation="REVIEW",
                summary="Develop responsive frontends in Ortigas Pasig.",
                raw_description="Vue.js components and modern styling.",
            ),
            Job(
                title="Senior Mobile React Native Developer",
                company="Cyberpark Innovations",
                location="Eastwood, Quezon City",
                workplace_type="Hybrid",
                source="linkedin",
                currency="PHP",
                salary_min=85000,
                salary_max=130000,
                match_score=85,
                recommendation="APPLY",
                summary="Mobile iOS and Android apps with React Native.",
                raw_description="Quezon City software engineering team.",
            ),

            # Central Visayas (Region VII / Cebu)
            Job(
                title="Cloud Infrastructure & DevOps Engineer",
                company="Cebu IT Park Global Inc",
                location="Cebu IT Park, Cebu City",
                workplace_type="Onsite",
                source="kalibrr",
                currency="PHP",
                salary_min=80000,
                salary_max=130000,
                match_score=82,
                recommendation="APPLY",
                summary="Manage AWS Kubernetes clusters in Cebu City.",
                raw_description="DevOps automation and CI/CD pipelines.",
            ),
            Job(
                title="Full Stack PHP / Node Developer",
                company="Visayas Digital Hub",
                location="Mandaue City, Central Visayas",
                workplace_type="Hybrid",
                source="jobstreet",
                currency="PHP",
                salary_min=60000,
                salary_max=95000,
                match_score=75,
                recommendation="REVIEW",
                summary="Full stack web developer based in Mandaue.",
                raw_description="Central Visayas technology team.",
            ),

            # Central Luzon (Region III / Clark / Pampanga)
            Job(
                title="Senior Python Data Engineer",
                company="Clark Freeport Tech Solutions",
                location="Clark Freeport Zone, Pampanga",
                workplace_type="Hybrid",
                source="jobstreet",
                currency="PHP",
                salary_min=95000,
                salary_max=150000,
                match_score=90,
                recommendation="APPLY",
                summary="Python data pipelines in Clark Pampanga.",
                raw_description="Pampanga technology park.",
            ),
            Job(
                title="QA Automation Engineer",
                company="Angeles Software Systems",
                location="Angeles City, Region III",
                workplace_type="Onsite",
                source="bossjob",
                currency="PHP",
                salary_min=50000,
                salary_max=80000,
                match_score=70,
                recommendation="REVIEW",
                summary="Playwright and Selenium test automation in Angeles.",
                raw_description="Quality assurance testing.",
            ),

            # CALABARZON (Region IV-A / Laguna / Cavite)
            Job(
                title="Embedded Systems Engineer",
                company="Laguna Technopark Manufacturing",
                location="Santa Rosa, Laguna",
                workplace_type="Onsite",
                source="philjobnet",
                currency="PHP",
                salary_min=55000,
                salary_max=90000,
                match_score=68,
                recommendation="REVIEW",
                summary="Industrial IoT in Santa Rosa Laguna.",
                raw_description="Firmware and C++ development.",
            ),
            Job(
                title="Technical Support Specialist",
                company="Cavite BPO Center",
                location="Imus, Cavite",
                workplace_type="Onsite",
                source="philjobnet",
                currency="PHP",
                salary_min=35000,
                salary_max=50000,
                match_score=55,
                recommendation="SKIP",
                summary="Tier 2 IT support in Cavite.",
                raw_description="Customer and tech support tickets.",
            ),

            # Mindanao / Davao (Region XI)
            Job(
                title="Full Stack Web Developer",
                company="Davao Digital Innovations",
                location="Davao City, Davao del Sur",
                workplace_type="Hybrid",
                source="kalibrr",
                currency="PHP",
                salary_min=65000,
                salary_max=105000,
                match_score=80,
                recommendation="APPLY",
                summary="Web apps developer in Davao City.",
                raw_description="Mindanao software team.",
            ),

            # Western Visayas / Iloilo (Region VI)
            Job(
                title="Software Quality Assurance Analyst",
                company="Iloilo Tech Valley",
                location="Iloilo City, Western Visayas",
                workplace_type="Hybrid",
                source="onlinejobs",
                currency="PHP",
                salary_min=50000,
                salary_max=80000,
                match_score=72,
                recommendation="REVIEW",
                summary="Software testing in Iloilo.",
                raw_description="Manual and automated QA in Western Visayas.",
            ),

            # Remote Roles (PH & Global)
            Job(
                title="Executive Virtual Assistant & Admin Support",
                company="Remote Growth Partners",
                location="Remote (Philippines)",
                workplace_type="Remote",
                source="onlinejobs",
                currency="PHP",
                salary_min=40000,
                salary_max=65000,
                match_score=60,
                recommendation="REVIEW",
                summary="Virtual assistant for executive scheduling and operations.",
                raw_description="VA role supporting US clients remotely.",
            ),
            Job(
                title="Staff Platform Engineer (Distributed Systems)",
                company="Acme Global Distributed",
                location="Worldwide Remote",
                workplace_type="Remote",
                source="remoteok",
                currency="USD",
                salary_min=140000,
                salary_max=200000,
                match_score=94,
                recommendation="APPLY",
                summary="Distributed systems engineering anywhere in the world.",
                raw_description="Kubernetes, Rust, and Go infrastructure.",
            ),

            # Foreign US Onsite (Must NOT match PH filter)
            Job(
                title="Silicon Valley Hardware Engineer",
                company="Bay Area Microelectronics",
                location="San Francisco, CA, United States",
                workplace_type="Onsite",
                source="indeed",
                currency="USD",
                salary_min=150000,
                salary_max=220000,
                match_score=40,
                recommendation="SKIP",
                summary="Hardware design onsite in San Francisco.",
                raw_description="Silicon valley hardware lab.",
            ),
        ]

        db.add_all(seed_jobs)
        await db.commit()

    # 2. Test FastApi endpoints via ASGITransport
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Check all jobs loaded
        r = await client.get("/api/jobs", headers=headers)
        assert r.status_code == 200
        all_jobs = r.json()
        assert len(all_jobs) == 15

        # 1. Test Philippines Only filter (ph_only=true)
        r = await client.get("/api/jobs?ph_only=true", headers=headers)
        assert r.status_code == 200
        ph_jobs = r.json()
        assert len(ph_jobs) == 13  # 13 PH jobs, excluding the San Francisco job and the purely foreign RemoteOK USD role
        for j in ph_jobs:
            assert "san francisco" not in (j.get("location") or "").lower()

        # 2. Test Metro Manila / NCR Sub-district Resolution (BGC, Taguig, Makati, Pasig, QC)
        r = await client.get("/api/jobs?location=NCR", headers=headers)
        assert r.status_code == 200
        ncr_jobs = r.json()
        assert len(ncr_jobs) == 4
        ncr_titles = [j["title"] for j in ncr_jobs]
        assert "Senior Laravel & React Developer" in ncr_titles
        assert "Fintech Backend Golang Developer" in ncr_titles
        assert "Frontend Vue / TypeScript Specialist" in ncr_titles
        assert "Senior Mobile React Native Developer" in ncr_titles

        # 3. Test Central Visayas / Cebu Resolution (Cebu IT Park, Mandaue)
        r = await client.get("/api/jobs?location=Cebu", headers=headers)
        assert r.status_code == 200
        cebu_jobs = r.json()
        assert len(cebu_jobs) == 2
        cebu_titles = [j["title"] for j in cebu_jobs]
        assert "Cloud Infrastructure & DevOps Engineer" in cebu_titles
        assert "Full Stack PHP / Node Developer" in cebu_titles

        # 4. Test Central Luzon / Clark / Pampanga Resolution (Clark, Angeles)
        r = await client.get("/api/jobs?location=Clark", headers=headers)
        assert r.status_code == 200
        clark_jobs = r.json()
        assert len(clark_jobs) == 2
        clark_titles = [j["title"] for j in clark_jobs]
        assert "Senior Python Data Engineer" in clark_titles
        assert "QA Automation Engineer" in clark_titles

        # 5. Test CALABARZON (Laguna, Cavite)
        r = await client.get("/api/jobs?location=CALABARZON", headers=headers)
        assert r.status_code == 200
        calabarzon_jobs = r.json()
        assert len(calabarzon_jobs) == 2
        calabarzon_titles = [j["title"] for j in calabarzon_jobs]
        assert "Embedded Systems Engineer" in calabarzon_titles
        assert "Technical Support Specialist" in calabarzon_titles

        # 6. Test Mindanao (Davao)
        r = await client.get("/api/jobs?location=Davao", headers=headers)
        assert r.status_code == 200
        davao_jobs = r.json()
        assert len(davao_jobs) == 1
        assert davao_jobs[0]["title"] == "Full Stack Web Developer"

        # 7. Test Western Visayas (Iloilo)
        r = await client.get("/api/jobs?location=Iloilo", headers=headers)
        assert r.status_code == 200
        iloilo_jobs = r.json()
        assert len(iloilo_jobs) == 1
        assert iloilo_jobs[0]["title"] == "Software Quality Assurance Analyst"

        # 8. Test Worldwide Remote (Remote workplace_type or location)
        r = await client.get("/api/jobs?location=Remote", headers=headers)
        assert r.status_code == 200
        remote_jobs = r.json()
        assert len(remote_jobs) == 2
        remote_titles = [j["title"] for j in remote_jobs]
        assert "Executive Virtual Assistant & Admin Support" in remote_titles
        assert "Staff Platform Engineer (Distributed Systems)" in remote_titles

        # 9. Test PSOC Group 4 (Clerical Support & Virtual Assistants)
        r = await client.get("/api/jobs?psoc_group=4", headers=headers)
        assert r.status_code == 200
        va_jobs = r.json()
        va_titles = [j["title"] for j in va_jobs]
        assert "Executive Virtual Assistant & Admin Support" in va_titles

        # 10. Test PSOC Group 3 (Technicians & QA)
        r = await client.get("/api/jobs?psoc_group=3", headers=headers)
        assert r.status_code == 200
        qa_jobs = r.json()
        qa_titles = [j["title"] for j in qa_jobs]
        assert "QA Automation Engineer" in qa_titles

        # 11. Test Combined Filters: ph_only=true + location=NCR + recommendation=APPLY
        r = await client.get("/api/jobs?ph_only=true&location=NCR&recommendation=APPLY", headers=headers)
        assert r.status_code == 200
        combined_jobs = r.json()
        assert len(combined_jobs) == 3
        for j in combined_jobs:
            assert j["recommendation"] == "APPLY"

        print("=== ALL E2E LOCATION AND TAXONOMY FILTERING TESTS PASSED ===")
