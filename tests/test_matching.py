"""Unit tests for the Entrepreneur AI Matching System."""

import pytest
from src.matching import (
    ENGINE,
    EntrepreneurProfile,
    FilterCriteria,
    get_dashboard_stats,
    get_system_architecture,
    register_user,
    UserRegistrationRequest,
    run_matching,
)


def test_matching_pipeline_funnel_counts():
    """Verify that candidates decrease monotonically down the filter funnel."""
    profile = EntrepreneurProfile(
        startup_name="BioRobotics AI",
        industry="HealthTech",
        stage="Seed",
        target_funding_usd=2_000_000,
        min_ticket_usd=200_000,
        target_geographies=["North America", "Global"],
    )
    criteria = FilterCriteria(min_semantic_score=0.70)
    response = ENGINE.run_match_pipeline(profile, criteria)

    assert response.total_candidates_pool == 1000
    assert len(response.funnel_steps) == 6

    # Verify monotonic reduction in candidates after each filter
    previous_count = response.total_candidates_pool
    for step in response.funnel_steps:
        assert step.candidates_before == previous_count or step.step_index == 0
        assert step.candidates_after <= step.candidates_before
        assert step.dropped_count == (step.candidates_before - step.candidates_after)
        previous_count = step.candidates_after

    assert len(response.matches) > 0
    top = response.matches[0]
    assert top.scores.overall_score >= 70.0
    assert top.passed_all_filters is True


def test_user_registration():
    """Test user registration for entrepreneurs and investors."""
    req = UserRegistrationRequest(
        full_name="Sarah Connor",
        email="sarah@skynet-defense.com",
        password="SuperSecretPassword123!",
        role="entrepreneur",
        organization_name="Skynet Defense",
        agree_terms=True,
    )
    res = register_user(req)
    assert res.user_id.startswith("USR-")
    assert res.role == "entrepreneur"
    assert "token" in res.token


def test_dashboard_stats():
    """Test dashboard metrics calculation."""
    stats = get_dashboard_stats()
    assert stats.total_candidate_pool == 1000
    assert stats.candidates_remaining > 0
    assert stats.top_match_percentage > 0.0
    assert len(stats.industry_distribution) > 0
    assert len(stats.stage_distribution) > 0


def test_system_architecture_spec():
    """Test system architecture tier specification."""
    arch = get_system_architecture()
    assert arch["candidate_pool_size"] == 1000
    assert len(arch["tiers"]) == 4
    tier_names = [t["tier_name"] for t in arch["tiers"]]
    assert any("Presentation" in n for n in tier_names)
    assert any("API" in n for n in tier_names)
    assert any("Filtering" in n for n in tier_names)
    assert any("Data" in n for n in tier_names)
