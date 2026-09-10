import pytest
from backend.app.processing.content_extractor import extract_contact_email
from backend.app.ai.providers.fallback import FallbackHeuristicProvider


def test_extract_contact_email_from_text():
    raw_text = """
    Senior Python Engineer
    Acme Innovations is looking for a passionate Senior Python Engineer.
    Please send your CV and portfolio to careers@acme.com for consideration.
    """
    email = extract_contact_email(text=raw_text, company="Acme Innovations")
    assert email == "careers@acme.com"


def test_extract_contact_email_from_html_mailto():
    html = """
    <div>
        <h1>Full Stack Developer</h1>
        <p>Join our agile engineering team.</p>
        <a href="mailto:recruiting@startup.io?subject=Application">Apply Now</a>
    </div>
    """
    email = extract_contact_email(html=html, text=None, company="Startup")
    assert email == "recruiting@startup.io"


def test_extract_contact_email_filters_blacklist():
    raw_text = """
    Software Engineer at TechCorp.
    Notifications sent by donotreply@linkedin.com. Contact support@indeed.com for help.
    For direct job applications, please reach out to hiring@techcorp.io.
    """
    email = extract_contact_email(text=raw_text, company="TechCorp")
    assert email == "hiring@techcorp.io"


def test_extract_contact_email_prioritizes_hr_prefixes():
    raw_text = """
    Company: NexaSoft
    General inquiries: contact@nexasoft.com
    Submit your resume to jobs@nexasoft.com
    """
    email = extract_contact_email(text=raw_text, company="NexaSoft")
    assert email == "jobs@nexasoft.com"


def test_extract_contact_email_none_when_no_email():
    raw_text = """
    DevOps Engineer at CloudScale.
    Please submit your application via our online career portal link below.
    https://boards.greenhouse.io/cloudscale/jobs/12345
    """
    email = extract_contact_email(text=raw_text, company="CloudScale")
    assert email is None


@pytest.mark.asyncio
async def test_fallback_provider_extracts_contact_email():
    raw_text = """
    Frontend Engineer
    Company: Veloce Systems
    Location: Remote
    Requirements: React, TypeScript, Tailwind CSS.
    Send your cover letter to talent@veloce.io
    """
    provider = FallbackHeuristicProvider()
    job_create = await provider.extract_job_information(raw_text=raw_text)
    assert job_create.title == "Frontend Engineer"
    assert job_create.company == "Veloce Systems"
    assert job_create.contact_email == "talent@veloce.io"
