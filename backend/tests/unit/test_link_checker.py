import pytest
from backend.app.processing.link_checker import generate_search_fallback_url, verify_job_url_liveness


def test_generate_search_fallback_url_with_1week_filters():
    # LinkedIn: must include f_TPR=r604800 for 1-week span and encoded title
    li_url = generate_search_fallback_url("Frontend Engineer", "Stripe", "Remote", "linkedin")
    assert "linkedin.com/jobs/search" in li_url
    assert "Frontend" in li_url and "Engineer" in li_url
    assert "f_TPR=r604800" in li_url

    # Indeed: must include fromage=7 for 1-week span and exact title
    ind_url = generate_search_fallback_url("React Developer", "Stripe", "Remote", "indeed")
    assert "indeed.com/jobs" in ind_url
    assert "React" in ind_url and "Developer" in ind_url
    assert "fromage=7" in ind_url

    # JobStreet: must include createdAt=7d for 1-week span
    js_url = generate_search_fallback_url("Full Stack Developer", "Canva", "Philippines", "jobstreet")
    assert "jobstreet.com.ph/jobs" in js_url
    assert "Full+Stack" in js_url or "Full%20Stack" in js_url
    assert "createdAt=7d" in js_url

    # RemoteOK: must search for exact title
    rok_url = generate_search_fallback_url("TypeScript Engineer", "Automattic", "Remote", "remoteok")
    assert "remoteok.com/?search=" in rok_url
    assert "TypeScript" in rok_url

    # Google Public: must include tbs=qdr:w for 1-week span
    goog_url = generate_search_fallback_url("Python Engineer", "Supabase", "Remote", "public")
    assert "google.com/search" in goog_url
    assert "tbs=qdr%3Aw" in goog_url or "tbs=qdr:w" in goog_url


@pytest.mark.asyncio
async def test_verify_job_url_liveness_search_query():
    url = "https://www.indeed.com/jobs?q=React+Developer&l=Remote&fromage=7"
    res = await verify_job_url_liveness(url, "React Developer", "Stripe", "Remote", "indeed")
    assert res["is_active"] is True
    assert res["link_status"] == "ACTIVE"
    assert res["link_type"] == "SEARCH_QUERY"
    assert res["status_code"] == 200
    assert "React Developer" in res["message"]


@pytest.mark.asyncio
async def test_verify_job_url_liveness_none_url():
    res = await verify_job_url_liveness(None, "Software Engineer", "Acme", "Remote", "linkedin")
    assert res["is_active"] is True
    assert res["link_status"] == "SEARCH_QUERY"
    assert "linkedin.com/jobs/search" in res["search_url"]
    assert "f_TPR=r604800" in res["search_url"]
