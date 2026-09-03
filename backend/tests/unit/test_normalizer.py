import pytest
from backend.app.processing.normalizer import normalize_skill_name, get_skill_category


def test_skill_normalization_synonyms():
    assert normalize_skill_name("react.js") == "React"
    assert normalize_skill_name("reactjs") == "React"
    assert normalize_skill_name("ts") == "TypeScript"
    assert normalize_skill_name("k8s") == "Kubernetes"
    assert normalize_skill_name("postgres") == "PostgreSQL"
    assert normalize_skill_name("py") == "Python"
    assert normalize_skill_name("cicd") == "CI/CD"


def test_skill_category_mapping():
    assert get_skill_category("React") == "Frontend"
    assert get_skill_category("FastAPI") == "Backend"
    assert get_skill_category("PostgreSQL") == "Database"
    assert get_skill_category("Docker") == "DevOps"
    assert get_skill_category("AWS") == "Cloud"
    assert get_skill_category("pytest") == "Testing"
