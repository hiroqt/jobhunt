import pytest
from backend.app.processing.psoc_classifier import (
    classify_psoc_major_group,
    normalize_philippine_location,
    PSOC_MAJOR_GROUPS,
    PH_REGIONS,
)


def test_psoc_major_group_classification():
    # Group 1: Managers
    res1 = classify_psoc_major_group("Engineering Manager", "Lead engineering team")
    assert res1["group_code"] == 1
    assert res1["group_name"] == "Managers"

    res_vp = classify_psoc_major_group("VP of Technology")
    assert res_vp["group_code"] == 1

    # Group 2: Professionals (Software Engineers, Analysts)
    res2 = classify_psoc_major_group("Senior Full Stack Developer", "Building React and Python APIs")
    assert res2["group_code"] == 2
    assert res2["group_name"] == "Professionals"

    res_ds = classify_psoc_major_group("Data Scientist")
    assert res_ds["group_code"] == 2

    # Group 3: Technicians & QA
    res3 = classify_psoc_major_group("QA Automation Tester")
    assert res3["group_code"] == 3
    assert res3["group_name"] == "Technicians and Associate Professionals"

    # Group 4: Clerical & Customer Support
    res4 = classify_psoc_major_group("Virtual Assistant (Executive Support)")
    assert res4["group_code"] == 4
    assert res4["group_name"] == "Clerical Support Workers"

    res_csr = classify_psoc_major_group("Customer Service Representative (CSR)")
    assert res_csr["group_code"] == 4

    # Group 5: Sales
    res5 = classify_psoc_major_group("Sales Development Representative (SDR)")
    assert res5["group_code"] == 5
    assert res5["group_name"] == "Service and Sales Workers"


def test_philippine_location_normalization():
    # NCR / Metro Manila
    bgc = normalize_philippine_location("BGC, Taguig")
    assert bgc["is_philippines"] is True
    assert bgc["region_code"] == "NCR"

    makati = normalize_philippine_location("Makati CBD, Metro Manila")
    assert makati["region_code"] == "NCR"

    # Region VII (Central Visayas - Cebu)
    cebu = normalize_philippine_location("Cebu IT Park, Lahug, Cebu City")
    assert cebu["is_philippines"] is True
    assert cebu["region_code"] == "Region VII"

    # Region III (Central Luzon - Clark)
    clark = normalize_philippine_location("Clark Freeport Zone, Pampanga")
    assert clark["region_code"] == "Region III"

    # Region XI (Davao)
    davao = normalize_philippine_location("Davao City, Philippines")
    assert davao["region_code"] == "Region XI"

    # Region IV-A (CALABARZON - Laguna)
    laguna = normalize_philippine_location("Santa Rosa, Laguna")
    assert laguna["region_code"] == "Region IV-A"

    # Region VI (Western Visayas - Iloilo)
    iloilo = normalize_philippine_location("Iloilo Business Park, Mandurriao, Iloilo City")
    assert iloilo["region_code"] == "Region VI"
