"""Entrepreneur-Investor AI Matching Package."""

from src.matching.engine import ENGINE, MatchingEngine
from src.matching.models import (
    EntrepreneurProfile,
    FilterCriteria,
    FunnelStep,
    InvestorCandidate,
    MatchResponse,
    MatchResultItem,
    UserRegistrationRequest,
    UserRegistrationResponse,
    DashboardStatsResponse,
)
from src.matching.service import (
    get_current_profile,
    update_profile,
    run_matching,
    register_user,
    get_dashboard_stats,
    get_system_architecture,
)

__all__ = [
    "ENGINE",
    "MatchingEngine",
    "EntrepreneurProfile",
    "FilterCriteria",
    "FunnelStep",
    "InvestorCandidate",
    "MatchResponse",
    "MatchResultItem",
    "UserRegistrationRequest",
    "UserRegistrationResponse",
    "DashboardStatsResponse",
    "get_current_profile",
    "update_profile",
    "run_matching",
    "register_user",
    "get_dashboard_stats",
    "get_system_architecture",
]
