"""Integration tests for Matching FastAPI endpoints calling routes directly."""

from src.api.main import (
    api_register_user,
    api_get_profile,
    api_update_profile,
    api_run_matching,
    api_get_matching_dashboard,
    api_get_architecture,
)
from src.matching.models import UserRegistrationRequest, FilterCriteria


def test_matching_endpoints_direct():
    # 1. System Architecture
    arch = api_get_architecture()
    assert "tiers" in arch
    assert arch["candidate_pool_size"] == 1000

    # 2. Get active profile
    prof = api_get_profile()
    assert prof.startup_name != ""

    # 3. Update profile
    prof.target_funding_usd = 1_800_000
    updated = api_update_profile(prof)
    assert updated.target_funding_usd == 1_800_000

    # 4. User Registration
    reg_req = UserRegistrationRequest(
        full_name="Nishanth Raja",
        email="nishanth@test.com",
        password="Password123!",
        role="entrepreneur",
        organization_name="NexusAI Innovations",
        agree_terms=True,
    )
    reg_res = api_register_user(reg_req)
    assert reg_res.role == "entrepreneur"
    assert "token" in reg_res.token

    # 5. Matching Run (funnel & candidates remaining)
    crit = FilterCriteria(min_semantic_score=0.60)
    match_res = api_run_matching(crit)
    assert match_res.total_candidates_pool == 1000
    assert len(match_res.funnel_steps) == 6
    assert match_res.funnel_steps[0].filter_name == "Total Candidate Pool"
    assert match_res.funnel_steps[1].filter_name == "Industry & Domain Alignment"
    assert len(match_res.matches) > 0

    # 6. Dashboard Stats
    dash = api_get_matching_dashboard()
    assert dash.total_candidate_pool == 1000
    assert dash.candidates_remaining > 0
