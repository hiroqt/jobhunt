import pytest
from backend.app.matching.rules import evaluate_decision_rules


def test_decision_rules_apply():
    rec, summary = evaluate_decision_rules(
        overall_score=85,
        missing_critical_skills=[],
        experience_gap=0
    )
    assert rec == "APPLY"
    assert "High qualification match" in summary


def test_decision_rules_review():
    rec, summary = evaluate_decision_rules(
        overall_score=68,
        missing_critical_skills=["Docker", "Kubernetes"],
        experience_gap=1
    )
    assert rec == "REVIEW"
    assert "Moderate fit" in summary


def test_decision_rules_skip():
    rec, summary = evaluate_decision_rules(
        overall_score=45,
        missing_critical_skills=["AWS", "Docker", "Kubernetes", "GraphQL"],
        experience_gap=3
    )
    assert rec == "SKIP"
    assert "Low ATS match" in summary or "Prioritize higher-match" in summary
