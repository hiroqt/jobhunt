import pytest
from backend.app.models.job import Job
from backend.app.sources.base import NormalizedJobData
from backend.app.processing.deduplicator import (
    calculate_string_similarity,
    calculate_job_similarity,
    check_job_duplicate
)


def test_string_similarity():
    assert calculate_string_similarity("React Developer", "React Developer") == 1.0
    assert calculate_string_similarity("react developer!", "React Developer") == 1.0
    assert calculate_string_similarity("Junior React Developer", "React Developer") > 0.70
    assert calculate_string_similarity("Data Scientist", "Frontend Engineer") < 0.30


def test_exact_id_deduplication():
    norm = NormalizedJobData(
        external_id="li_12345",
        source="linkedin",
        title="Frontend Engineer",
        company="Stripe",
        url="https://linkedin.com/jobs/view/li_12345",
        canonical_url="https://linkedin.com/jobs/view/li_12345",
        workplace_type="Remote",
        employment_type="Full-time"
    )

    existing = Job(
        id="job-uuid-1",
        external_id="li_12345",
        source="linkedin",
        title="Frontend Engineer",
        company="Stripe",
        url="https://linkedin.com/jobs/view/li_12345",
        canonical_url="https://linkedin.com/jobs/view/li_12345"
    )

    conf, reason = calculate_job_similarity(norm, existing)
    assert conf == 1.0
    assert "Exact match on source" in reason

    is_dup, conf, _, matched = check_job_duplicate(norm, [existing])
    assert is_dup is True
    assert matched == existing


def test_canonical_url_deduplication():
    norm = NormalizedJobData(
        external_id="diff_id",
        source="indeed",
        title="Software Engineer",
        company="Acme Corp",
        url="https://acme.com/jobs/123?utm_source=indeed",
        canonical_url="https://acme.com/jobs/123",
        workplace_type="Remote",
        employment_type="Full-time"
    )

    existing = Job(
        id="job-uuid-2",
        external_id="other_id",
        source="linkedin",
        title="Software Engineer",
        company="Acme Corp",
        url="https://acme.com/jobs/123?utm_source=linkedin",
        canonical_url="https://acme.com/jobs/123"
    )

    conf, reason = calculate_job_similarity(norm, existing)
    assert conf >= 0.95
    assert "canonical URL" in reason


def test_fuzzy_content_similarity_deduplication():
    norm = NormalizedJobData(
        title="Junior React & TypeScript Developer",
        company="Google LLC",
        location="Remote",
        url="https://source-a.com/job1",
        canonical_url="https://source-a.com/job1",
        source="source_a"
    )

    existing = Job(
        id="job-uuid-3",
        title="Junior React / TypeScript Developer",
        company="Google LLC",
        location="Remote",
        url="https://source-b.com/job2",
        canonical_url="https://source-b.com/job2",
        source="source_b"
    )

    conf, reason = calculate_job_similarity(norm, existing)
    assert conf >= 0.85

    is_dup, _, _, _ = check_job_duplicate(norm, [existing])
    assert is_dup is True


def test_distinct_jobs_not_deduplicated():
    norm = NormalizedJobData(
        title="Backend Python Developer",
        company="Shopify",
        location="Remote",
        url="https://shopify.com/careers/backend",
        canonical_url="https://shopify.com/careers/backend",
        source="public"
    )

    existing = Job(
        id="job-uuid-4",
        title="Frontend React Engineer",
        company="Shopify",
        location="Remote",
        url="https://shopify.com/careers/frontend",
        canonical_url="https://shopify.com/careers/frontend",
        source="public"
    )

    is_dup, conf, _, _ = check_job_duplicate(norm, [existing])
    assert is_dup is False
    assert conf < 0.85
