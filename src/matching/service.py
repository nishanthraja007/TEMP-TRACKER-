"""Service layer for entrepreneur matching, registration, and system architecture."""

from typing import Dict, Any, List
import uuid

from src.matching.dataset import CANDIDATE_POOL, INDUSTRIES, STAGES
from src.matching.engine import ENGINE
from src.matching.models import (
    DashboardStatsResponse,
    EntrepreneurProfile,
    FilterCriteria,
    MatchResponse,
    UserRegistrationRequest,
    UserRegistrationResponse,
)

# In-memory stores
CURRENT_PROFILE: EntrepreneurProfile = EntrepreneurProfile()
REGISTERED_USERS: List[Dict[str, Any]] = [
    {
        "id": "USR-101",
        "full_name": "Nishanth Raja",
        "email": "nishanth@nexusai.health",
        "role": "entrepreneur",
        "organization_name": "NexusAI Health",
        "created_at": "2026-10-05T08:30:00Z",
    }
]


def register_user(req: UserRegistrationRequest) -> UserRegistrationResponse:
    """Registers a new user (Entrepreneur, Investor, or Mentor)."""
    user_id = f"USR-{str(uuid.uuid4())[:8].upper()}"
    new_user = {
        "id": user_id,
        "full_name": req.full_name,
        "email": req.email,
        "role": req.role,
        "organization_name": req.organization_name,
        "linkedin_url": req.linkedin_url,
        "created_at": "2026-10-05T10:00:00Z",
    }
    REGISTERED_USERS.append(new_user)
    
    # If user registered as entrepreneur, update current profile defaults
    global CURRENT_PROFILE
    if req.role == "entrepreneur":
        CURRENT_PROFILE.founder_name = req.full_name
        CURRENT_PROFILE.startup_name = req.organization_name
        CURRENT_PROFILE.email = req.email

    token = f"jwt_mock_token_{user_id}_{req.role}"
    return UserRegistrationResponse(
        user_id=user_id,
        full_name=req.full_name,
        email=req.email,
        role=req.role,
        organization_name=req.organization_name,
        token=token,
        message=f"Successfully registered as {req.role.capitalize()}.",
    )


def get_current_profile() -> EntrepreneurProfile:
    return CURRENT_PROFILE


def update_profile(new_profile: EntrepreneurProfile) -> EntrepreneurProfile:
    global CURRENT_PROFILE
    CURRENT_PROFILE = new_profile
    return CURRENT_PROFILE


def run_matching(criteria: FilterCriteria = None) -> MatchResponse:
    return ENGINE.run_match_pipeline(CURRENT_PROFILE, criteria)


def get_dashboard_stats() -> DashboardStatsResponse:
    match_resp = run_matching()
    
    # Distribution calculation
    ind_dist: Dict[str, int] = {ind: 0 for ind in INDUSTRIES}
    stg_dist: Dict[str, int] = {stg: 0 for stg in STAGES}

    for c in CANDIDATE_POOL:
        for ind in c.focus_industries:
            if ind in ind_dist:
                ind_dist[ind] += 1
        for stg in c.investment_stages:
            if stg in stg_dist:
                stg_dist[stg] += 1

    top_score = match_resp.matches[0].scores.overall_score if match_resp.matches else 0.0
    avg_score = (
        round(sum(m.scores.overall_score for m in match_resp.matches) / len(match_resp.matches), 1)
        if match_resp.matches
        else 0.0
    )

    last_step = match_resp.funnel_steps[-1]
    dropoff_pct = round(((1000 - last_step.candidates_after) / 1000) * 100, 1)

    return DashboardStatsResponse(
        total_candidate_pool=1000,
        candidates_remaining=last_step.candidates_after,
        top_match_percentage=top_score,
        active_inquiries_sent=4,
        average_compatibility_score=avg_score,
        filters_configured_count=5,
        funnel_dropoff_rate=dropoff_pct,
        recent_matches=match_resp.matches[:5],
        industry_distribution=ind_dist,
        stage_distribution=stg_dist,
    )


def get_system_architecture() -> Dict[str, Any]:
    """Returns technical architecture specifications and graph flow."""
    return {
        "system_name": "AI-Powered Entrepreneur-Investor Matching Platform",
        "version": "2.4.0",
        "latency_target_ms": "< 45ms",
        "candidate_pool_size": 1000,
        "tiers": [
            {
                "tier_name": "Presentation Tier (Frontend)",
                "technologies": ["React 18", "TypeScript", "TailwindCSS", "Recharts", "Lucide Icons"],
                "components": [
                    {
                        "name": "Registration Screen",
                        "purpose": "Role-based authentication & profile onboarding for Entrepreneurs, Investors, Mentors."
                    },
                    {
                        "name": "Dashboard",
                        "purpose": "Executive KPI overview, candidate pipeline retention, portfolio distribution, real-time match monitoring."
                    },
                    {
                        "name": "Entrepreneur Profile Form",
                        "purpose": "Multi-dimensional startup profile intake (Domain, Stage, Capital Required, Pitch Deck Embeddings, Tech Stack)."
                    },
                    {
                        "name": "Candidates Remaining After Each Filter",
                        "purpose": "Interactive Funnel & Waterfall telemetry visualizer tracking candidate count reductions through 5 filter checkpoints."
                    },
                    {
                        "name": "Matching Results",
                        "purpose": "Ranked investor dossiers with composite match scores, AI match rationale, and direct connection pipelines."
                    },
                    {
                        "name": "System Architecture View",
                        "purpose": "Interactive architectural blueprint of the end-to-end matching and filtering engine."
                    }
                ]
            },
            {
                "tier_name": "API & Orchestration Tier",
                "technologies": ["FastAPI", "Uvicorn ASGI", "Pydantic v2", "CORS Middleware"],
                "endpoints": [
                    "POST /api/matching/register",
                    "GET /api/matching/profile",
                    "POST /api/matching/profile",
                    "POST /api/matching/run",
                    "GET /api/matching/funnel",
                    "GET /api/matching/dashboard",
                    "GET /api/matching/architecture"
                ]
            },
            {
                "tier_name": "Filtering & AI Matching Pipeline",
                "technologies": ["NumPy", "TF-IDF Vectorizer", "Cosine Similarity Matrix", "Multi-Attribute Weighted Scoring Engine"],
                "stages": [
                    {"stage": 1, "name": "Industry Alignment Filter", "type": "Boolean / Fuzzy Taxonomy Matching"},
                    {"stage": 2, "name": "Investment Stage Filter", "type": "Fund Mandate Criteria Range Check"},
                    {"stage": 3, "name": "Check Size & Ticket Range Filter", "type": "Bounded Capital Feasibility Analysis"},
                    {"stage": 4, "name": "Geographic Mandate Filter", "type": "Jurisdictional Overlap Check"},
                    {"stage": 5, "name": "AI Semantic Synergy Fit", "type": "Vector Cosine Similarity & Composite Scoring (> 65%)"}
                ]
            },
            {
                "tier_name": "Data & Persistence Tier",
                "technologies": ["In-Memory Cache", "JSON Store", "Vector Index", "Async I/O"],
                "entities": ["Entrepreneur Profiles", "Candidate Database (1,000+ VCs & Mentors)", "Interaction Logs"]
            }
        ]
    }
