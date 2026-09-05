import pytest
from datetime import datetime, timezone, timedelta

from backend.app.verification.types import (
    JobTrustScore,
    FreshnessClassification,
    FieldCertainty,
    JobFieldEvidence
)
from backend.app.verification.identity import (
    calculate_source_authority,
    evaluate_freshness_confidence,
    evaluate_content_completeness,
    calculate_job_trust_score
)
from backend.app.matching.rules import evaluate_decision_rules
from backend.app.matching.scorer import calculate_match_scores
from backend.app.models.candidate import CandidateProfile, CandidateSkill
from backend.app.models.job import Job, JobSkill
from backend.app.models.skill import Skill
from backend.app.processing.url_validator import resolve_redirect_chain_async, validate_and_canonicalize_url


def test_calculate_source_authority():
    assert calculate_source_authority("greenhouse") >= 0.95
    assert calculate_source_authority("careers.google.com") >= 0.95
    assert calculate_source_authority("linkedin") >= 0.85
    assert calculate_source_authority("remoteok") >= 0.75
    assert calculate_source_authority("random-blog") == 0.70


def test_evaluate_freshness_confidence():
    now = datetime.now(timezone.utc)
    
    # Fresh < 7 days
    conf, cat = evaluate_freshness_confidence(now - timedelta(days=3), now=now)
    assert conf == 1.0
    assert cat == FreshnessClassification.FRESH

    # Recent 7 - 14 days
    conf, cat = evaluate_freshness_confidence(now - timedelta(days=10), now=now)
    assert conf == 0.80
    assert cat == FreshnessClassification.RECENT

    # Stale 14 - 30 days
    conf, cat = evaluate_freshness_confidence(now - timedelta(days=20), now=now)
    assert conf == 0.50
    assert cat == FreshnessClassification.STALE

    # Missing timestamp -> UNKNOWN (do not discard)
    conf, cat = evaluate_freshness_confidence(None, now=now)
    assert conf == 0.60
    assert cat == FreshnessClassification.UNKNOWN


def test_calculate_job_trust_score():
    now = datetime.now(timezone.utc)
    trust = calculate_job_trust_score(
        source="Greenhouse",
        identity_confidence=0.95,
        content_confidence=0.90,
        posted_at=now - timedelta(days=2),
        is_active=True,
        status_code=200
    )
    assert trust.overall_trust_score >= 0.85
    assert trust.trust_grade == "HIGH_TRUST"

    # Dead link check
    dead_trust = calculate_job_trust_score(
        source="LinkedIn",
        identity_confidence=0.80,
        content_confidence=0.70,
        posted_at=now - timedelta(days=20),
        is_active=False,
        status_code=404
    )
    assert dead_trust.availability_confidence == 0.0
    assert dead_trust.freshness_classification == FreshnessClassification.EXPIRED
    assert dead_trust.trust_grade in ("PROVISIONAL", "SUSPICIOUS")


def test_hard_requirement_eligibility_gate_rule():
    # If critical requirement failed, decision rules cap recommendation to REVIEW or SKIP
    rec, summary = evaluate_decision_rules(
        overall_score=88,
        missing_critical_skills=["Kubernetes"],
        experience_gap=0,
        critical_constraint_failed=True,
        hard_requirement_reason="Missing critical skill 'Kubernetes'"
    )
    assert rec == "REVIEW"
    assert "Failed critical constraint" in summary
    assert "Kubernetes" in summary

    # Large experience gap failure
    rec_skip, summary_skip = evaluate_decision_rules(
        overall_score=50,
        missing_critical_skills=["Kubernetes", "AWS", "Docker"],
        experience_gap=4,
        critical_constraint_failed=True,
        hard_requirement_reason="Excessive experience gap (4 years delta)"
    )
    assert rec_skip == "SKIP"
    assert "Failed critical constraint" in summary_skip


def test_match_scorer_4tier_skills():
    cand = CandidateProfile(
        id="cand-1",
        full_name="Senior Python Dev",
        target_roles=["Backend Engineer"],
        years_of_experience=5,
        workplace_types=["Remote"]
    )
    python_skill = Skill(id="sk-1", name="Python")
    cand_skills = [
        CandidateSkill(candidate_id="cand-1", skill_id="sk-1", skill=python_skill, years_experience=5, proficiency_level="Expert")
    ]

    job = Job(
        id="job-1",
        title="Backend Engineer",
        company="Tech Corp",
        workplace_type="Remote",
        min_years_experience=3
    )
    
    k8s_skill = Skill(id="sk-2", name="Kubernetes")
    job_skills = [
        JobSkill(job_id="job-1", skill_id="sk-1", skill=python_skill, is_required=True, tier="CRITICAL", importance_weight=5),
        JobSkill(job_id="job-1", skill_id="sk-2", skill=k8s_skill, is_required=True, tier="CRITICAL", importance_weight=5)
    ]

    score, breakdown, details, matched, missing_crit, missing_pref = calculate_match_scores(
        candidate=cand,
        job=job,
        job_skills=job_skills,
        candidate_skills=cand_skills
    )

    # Missing critical k8s skill should trip the eligibility gate
    assert breakdown.critical_constraint_failed is True
    assert breakdown.eligibility_status == "FAILED_CRITICAL_CONSTRAINT"
    assert "Kubernetes" in (breakdown.hard_requirement_reason or "")
    assert "Python" in matched
    assert "Kubernetes" in missing_crit


@pytest.mark.asyncio
async def test_redirect_chain_resolver():
    url = "https://www.google.com"
    final_url, chain, primary_app = await resolve_redirect_chain_async(url, max_hops=3)
    assert final_url.startswith("https://")
    assert len(chain) >= 1
