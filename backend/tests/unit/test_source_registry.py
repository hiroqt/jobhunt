import pytest
from backend.app.sources.registry import source_registry


def test_registry_contains_default_sources():
    sources = source_registry.get_source_names()
    assert "linkedin" in sources
    assert "indeed" in sources
    assert "jobstreet" in sources
    assert "remoteok" in sources
    assert "public" in sources


def test_get_adapter_by_case_insensitive_name():
    adapter_upper = source_registry.get_adapter("LINKEDIN")
    adapter_lower = source_registry.get_adapter("linkedin")
    assert adapter_upper is not None
    assert adapter_upper == adapter_lower
    assert adapter_upper.get_source_name() == "linkedin"


@pytest.mark.asyncio
async def test_registry_health_checks():
    health_results = await source_registry.check_all_health()
    assert len(health_results) >= 5
    for h in health_results:
        assert h.status in ("HEALTHY", "DEGRADED", "UNAVAILABLE")
        assert h.source_name in source_registry.get_source_names()
