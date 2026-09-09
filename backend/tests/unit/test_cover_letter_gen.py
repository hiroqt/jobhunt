import pytest
from backend.app.ai.providers.fallback import FallbackHeuristicProvider
from backend.app.schemas.ai import CoverLetterGenResponse


@pytest.mark.asyncio
async def test_fallback_cover_letter_generation_basic():
    provider = FallbackHeuristicProvider()
    
    response = await provider.generate_cover_letter(
        job_title="Senior Full-Stack Engineer",
        company="TechCorp Global",
        job_description="We are seeking a Senior Full-Stack Engineer skilled in React, Python, FastAPI, and PostgreSQL to design microservices.",
        candidate_name="Alexander Morgan",
        candidate_summary="Senior Engineer with 6 years building distributed systems and high-throughput APIs.",
        candidate_skills=["React", "FastAPI", "Python", "PostgreSQL", "Docker"],
        resume_text="Architected distributed microservices and reduced latency by 35%.",
        tone="professional",
        length="standard"
    )

    assert isinstance(response, CoverLetterGenResponse)
    assert response.job_title == "Senior Full-Stack Engineer"
    assert response.company == "TechCorp Global"
    assert response.candidate_name == "Alexander Morgan"
    assert "TechCorp Global" in response.salutation or "TechCorp Global" in response.cover_letter
    assert "Alexander Morgan" in response.sign_off
    assert len(response.body_paragraphs) == 3
    assert response.word_count > 100
    assert any(skill in response.matched_skills_highlighted for skill in ["React", "FastAPI", "Python", "PostgreSQL"])
    assert "Alexander Morgan" in response.subject_line


@pytest.mark.asyncio
async def test_fallback_cover_letter_tones():
    provider = FallbackHeuristicProvider()
    
    # Impactful tone
    impactful_resp = await provider.generate_cover_letter(
        job_title="Lead Backend Architect",
        company="Fintech Stream",
        job_description="High-frequency transaction processing with Python and Redis.",
        candidate_name="Alex Morgan",
        candidate_summary="High-impact technical leader",
        candidate_skills=["Python", "Redis", "Kafka"],
        resume_text="Scaled transaction pipelines",
        tone="impactful",
        length="concise"
    )
    assert len(impactful_resp.body_paragraphs) == 2
    assert "track record" in impactful_resp.cover_letter.lower() or "delivering" in impactful_resp.cover_letter.lower()

    # Technical tone
    tech_resp = await provider.generate_cover_letter(
        job_title="Cloud Systems Engineer",
        company="DataFlow Lab",
        job_description="Distributed cloud systems, Kubernetes, and Golang.",
        candidate_name="Alex Morgan",
        candidate_summary="Systems builder",
        candidate_skills=["Kubernetes", "Golang", "AWS"],
        resume_text="Built Kubernetes clusters",
        tone="technical",
        length="detailed"
    )
    assert len(tech_resp.body_paragraphs) == 4
    assert "rigor" in tech_resp.cover_letter.lower() or "systems" in tech_resp.cover_letter.lower()


@pytest.mark.asyncio
async def test_fallback_cover_letter_custom_instructions():
    provider = FallbackHeuristicProvider()
    custom_note = "Highlight our zero-downtime database migration that saved $200k annually"
    
    response = await provider.generate_cover_letter(
        job_title="Staff Database Engineer",
        company="Enterprise DB Inc",
        job_description="Database reliability and PostgreSQL query tuning.",
        candidate_name="Jane Doe",
        candidate_summary="DB specialist",
        candidate_skills=["PostgreSQL", "Database Tuning"],
        resume_text="Migrated petabyte databases",
        custom_instructions=custom_note,
        hiring_manager_name="Marcus Vance"
    )

    assert "Marcus Vance" in response.salutation
    assert custom_note in response.cover_letter


@pytest.mark.asyncio
async def test_cover_letter_zero_emoji_guarantee():
    from backend.app.ai.base import strip_emojis, EMOJI_PATTERN

    # 1. Direct regex and strip_emojis verification
    dirty_text = "Hello! 🚀 We built high-throughput systems 💼 with 99.99% uptime ✨. Ready to contribute! 🎯"
    clean_text = strip_emojis(dirty_text)
    assert not EMOJI_PATTERN.search(clean_text)
    assert clean_text == "Hello! We built high-throughput systems with 99.99% uptime. Ready to contribute!"

    # 2. Generator emoji stripping when inputs contain emojis
    provider = FallbackHeuristicProvider()
    response = await provider.generate_cover_letter(
        job_title="Senior AI Engineer 🚀",
        company="NextGen AI 🤖",
        job_description="Looking for visionary engineers 🔥 to build scalable LLM pipelines ⚡.",
        candidate_name="Alex Doe ✨",
        candidate_summary="Passionate builder 💼",
        candidate_skills=["Python 🐍", "PyTorch 🧠", "FastAPI ⚡"],
        resume_text="Led AI deployments 🚀 with zero downtime.",
        custom_instructions="Feature our hackathon win 🏆 and 40% latency reduction ⏱️",
        hiring_manager_name="Dr. Taylor 🤝"
    )

    # Assert no emojis anywhere in response fields
    assert not EMOJI_PATTERN.search(response.cover_letter)
    assert not EMOJI_PATTERN.search(response.subject_line)
    assert not EMOJI_PATTERN.search(response.salutation)
    assert not EMOJI_PATTERN.search(response.sign_off)
    for paragraph in response.body_paragraphs:
        assert not EMOJI_PATTERN.search(paragraph)
    for skill in response.matched_skills_highlighted:
        assert not EMOJI_PATTERN.search(skill)
    for strength in response.key_strengths_featured:
        assert not EMOJI_PATTERN.search(strength)

