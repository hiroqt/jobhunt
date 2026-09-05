import pytest
from backend.app.ai.providers.fallback import FallbackHeuristicProvider


@pytest.mark.asyncio
async def test_fallback_job_extraction():
    sample_text = """
    Job Title: Junior Frontend Developer
    Company: Acme Tech
    Location: Remote
    Experience: 1-2 years of experience
    
    Responsibilities:
    - Build user interfaces using React, Next.js, and Tailwind CSS
    - Collaborate with backend engineers on REST API integration
    - Write unit tests using Jest
    """
    
    provider = FallbackHeuristicProvider()
    job = await provider.extract_job_information(raw_text=sample_text, source_url="https://example.com/job/123")
    
    assert job.title == "Junior Frontend Developer"
    assert job.company == "Acme Tech"
    assert job.workplace_type == "Remote"
    assert any(s.name == "React" for s in job.skills)
    assert any(s.name == "Next.js" for s in job.skills)


@pytest.mark.asyncio
async def test_fallback_interview_prep():
    provider = FallbackHeuristicProvider()
    prep = await provider.generate_interview_prep(
        job_title="Junior Software Engineer",
        company="Acme Corp",
        job_description="React and Python development"
    )
    
    assert len(prep.top_technical_questions) >= 2
    assert len(prep.top_behavioral_questions) >= 2
    assert len(prep.questions_to_ask_interviewer) >= 2


@pytest.mark.asyncio
async def test_fallback_job_extraction_philippine_salary():
    sample_text = """
    Job Title: Full Stack Developer
    Company: Manila Cloud Solutions
    Location: Taguig, Philippines
    Salary: ₱60,000 - ₱90,000 per month
    Experience: 2 years of experience
    
    Responsibilities:
    - Build scalable React web applications and FastAPI services
    - Deploy containerized applications using Docker
    """
    provider = FallbackHeuristicProvider()
    job = await provider.extract_job_information(raw_text=sample_text, source_url="https://jobstreet.com.ph/job/98765")
    
    assert job.title == "Full Stack Developer"
    assert job.company == "Manila Cloud Solutions"
    assert job.currency == "PHP"
    assert job.salary_min == 60000
    assert job.salary_max == 90000

