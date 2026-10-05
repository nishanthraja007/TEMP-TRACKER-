"""Data models for Entrepreneur-Investor AI Matching System."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class EntrepreneurProfile(BaseModel):
    id: str = "ent-001"
    startup_name: str = "NexusAI Health"
    founder_name: str = "Nishanth Raja"
    email: str = "nishanth@nexusai.health"
    tagline: str = "Autonomous Clinical Diagnostic Assistant & Predictive Healthcare Intelligence"
    industry: str = "HealthTech"  # HealthTech, AI/ML, FinTech, SaaS, CleanTech, EdTech, DeepTech, E-commerce
    sub_sectors: List[str] = ["AI Diagnostic", "Medical Imaging", "Healthcare SaaS"]
    stage: str = "Seed"  # Idea / Pre-Seed, Seed, Series A, Series B / Growth
    target_funding_usd: float = 1_500_000.0
    min_ticket_usd: float = 100_000.0
    valuation_usd: float = 8_000_000.0
    location: str = "Bangalore, India"
    target_geographies: List[str] = ["Global", "Asia-Pacific", "North America"]
    team_size: int = 6
    traction_mrr_usd: float = 24_000.0
    active_users: int = 1450
    pitch_summary: str = (
        "NexusAI builds cutting-edge multi-modal computer vision and transformer agents "
        "to assist radiologists and clinical teams in diagnosing pulmonary and oncology scans "
        "in under 45 seconds with 99.2% sensitivity. We have 4 hospital pilots, $24k MRR, "
        "and HIPAA compliant infrastructure deployed on AWS GovCloud."
    )
    tech_stack: List[str] = ["PyTorch", "FastAPI", "React", "Docker", "PostgreSQL", "CUDA"]
    created_at: str = "2026-10-05T10:00:00Z"


class InvestorCandidate(BaseModel):
    id: str
    name: str
    firm: str
    partner_name: str
    avatar_url: Optional[str] = None
    focus_industries: List[str]
    investment_stages: List[str]
    min_check_usd: float
    max_check_usd: float
    target_geographies: List[str]
    portfolio_count: int
    dry_powder_usd: float
    thesis: str
    key_investments: List[str]
    lead_investor: bool = True
    rating: float = 4.8


class FilterCriteria(BaseModel):
    industry: Optional[str] = None
    stage: Optional[str] = None
    min_funding_usd: Optional[float] = None
    max_funding_usd: Optional[float] = None
    geography: Optional[str] = None
    min_semantic_score: float = 0.65  # 0.0 to 1.0


class FunnelStep(BaseModel):
    step_index: int
    filter_name: str
    filter_key: str
    description: str
    candidates_before: int
    candidates_after: int
    dropped_count: int
    retention_rate_pct: float
    sample_dropped_reasons: List[str] = []


class MatchScoreBreakdown(BaseModel):
    overall_score: float
    industry_score: float
    stage_score: float
    ticket_fit_score: float
    geo_score: float
    semantic_score: float


class MatchResultItem(BaseModel):
    candidate: InvestorCandidate
    scores: MatchScoreBreakdown
    why_matched: str
    filter_verdicts: Dict[str, bool]
    passed_all_filters: bool
    rank: int


class MatchResponse(BaseModel):
    profile: EntrepreneurProfile
    total_candidates_pool: int
    final_matches_count: int
    funnel_steps: List[FunnelStep]
    matches: List[MatchResultItem]
    execution_time_ms: float


class UserRegistrationRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "entrepreneur"  # entrepreneur, investor, mentor
    organization_name: str
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    agree_terms: bool = True


class UserRegistrationResponse(BaseModel):
    user_id: str
    full_name: str
    email: str
    role: str
    organization_name: str
    token: str
    message: str


class DashboardStatsResponse(BaseModel):
    total_candidate_pool: int
    candidates_remaining: int
    top_match_percentage: float
    active_inquiries_sent: int
    average_compatibility_score: float
    filters_configured_count: int
    funnel_dropoff_rate: float
    recent_matches: List[MatchResultItem]
    industry_distribution: Dict[str, int]
    stage_distribution: Dict[str, int]
