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


def test_currency_normalization_php_and_others():
    from backend.app.processing.normalizer import normalize_currency, get_currency_symbol, get_currency_flag
    assert normalize_currency("PHP") == "PHP"
    assert normalize_currency("₱") == "PHP"
    assert normalize_currency("peso") == "PHP"
    assert normalize_currency("Philippine Peso") == "PHP"
    assert normalize_currency("PH") == "PHP"
    assert normalize_currency("$") == "USD"
    assert normalize_currency("USD") == "USD"
    assert normalize_currency("S$") == "SGD"
    assert normalize_currency("€") == "EUR"
    assert normalize_currency(None) == "USD"

    assert get_currency_symbol("PHP") == "₱"
    assert get_currency_symbol("USD") == "$"
    assert get_currency_symbol("SGD") == "S$"
    assert get_currency_symbol(None) == "$"

    assert get_currency_flag("PHP") == "🇵🇭"
    assert get_currency_flag("USD") == "🇺🇸"
    assert get_currency_flag("SGD") == "🇸🇬"
    assert get_currency_flag("EUR") == "🇪🇺"
    assert get_currency_flag("GBP") == "🇬🇧"
    assert get_currency_flag(None) == "🇵🇭"


