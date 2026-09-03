import pytest
from backend.app.processing.url_validator import validate_and_canonicalize_url


def test_url_canonicalization_cleans_tracking_params():
    raw_url = "https://www.linkedin.com/jobs/view/123456789/?utm_source=share&utm_medium=member_desktop&refId=abc&trackingId=xyz"
    is_valid, clean_url, err = validate_and_canonicalize_url(raw_url)
    
    assert is_valid is True
    assert err is None
    assert "utm_source" not in clean_url
    assert "trackingId" not in clean_url
    assert "https://www.linkedin.com/jobs/view/123456789" in clean_url


def test_url_validation_adds_https_if_missing():
    raw_url = "greenhouse.io/company/jobs/998877"
    is_valid, clean_url, err = validate_and_canonicalize_url(raw_url)
    
    assert is_valid is True
    assert clean_url.startswith("https://greenhouse.io/company/jobs/998877")


def test_url_validation_invalid_strings():
    is_valid, _, err = validate_and_canonicalize_url("")
    assert is_valid is False
    assert err is not None
