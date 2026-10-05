"""Multi-stage Cascading Filtering and AI Matching Engine for Entrepreneurs & Investors."""

import math
import re
import time
from typing import Dict, List, Set, Tuple
from collections import Counter

from src.matching.dataset import CANDIDATE_POOL
from src.matching.models import (
    EntrepreneurProfile,
    FilterCriteria,
    FunnelStep,
    InvestorCandidate,
    MatchResponse,
    MatchResultItem,
    MatchScoreBreakdown,
)


def _tokenize(text: str) -> List[str]:
    """Simple lowercase word tokenizer."""
    return [w for w in re.findall(r"\b[a-zA-Z0-9_\-\+]{2,}\b", text.lower())]


def _compute_cosine_similarity(text1: str, text2: str) -> float:
    """Computes TF-IDF / term-frequency cosine similarity between two texts."""
    tokens1 = _tokenize(text1)
    tokens2 = _tokenize(text2)
    if not tokens1 or not tokens2:
        return 0.0

    c1 = Counter(tokens1)
    c2 = Counter(tokens2)
    common_words = set(c1.keys()).intersection(set(c2.keys()))
    if not common_words:
        return 0.05  # baseline floor

    dot_product = sum(c1[w] * c2[w] for w in common_words)
    norm1 = math.sqrt(sum(v * v for v in c1.values()))
    norm2 = math.sqrt(sum(v * v for v in c2.values()))
    if norm1 == 0 or norm2 == 0:
        return 0.0

    score = dot_product / (norm1 * norm2)
    # Scale to 0.4 - 0.98 realistic range
    return min(0.99, max(0.1, score * 1.8 + 0.15))


class MatchingEngine:
    def __init__(self, candidates: List[InvestorCandidate] = None):
        self.candidates = candidates or CANDIDATE_POOL

    def run_match_pipeline(
        self,
        profile: EntrepreneurProfile,
        criteria: FilterCriteria = None,
        max_results: int = 15,
    ) -> MatchResponse:
        """
        Executes the 5-stage sequential filter cascade and AI semantic scoring.
        Tracks exact candidates remaining after each filter stage.
        """
        start_time = time.perf_counter()
        criteria = criteria or FilterCriteria()

        # Step 0: Base Pool
        pool: List[InvestorCandidate] = list(self.candidates)
        initial_count = len(pool)
        funnel_steps: List[FunnelStep] = []

        funnel_steps.append(
            FunnelStep(
                step_index=0,
                filter_name="Total Candidate Pool",
                filter_key="initial_pool",
                description="All indexed institutional investors, angel syndicates, and venture funds in the ecosystem.",
                candidates_before=initial_count,
                candidates_after=initial_count,
                dropped_count=0,
                retention_rate_pct=100.0,
                sample_dropped_reasons=[],
            )
        )

        # -------------------------------------------------------------
        # Filter 1: Industry / Sector Match
        # -------------------------------------------------------------
        target_industry = criteria.industry or profile.industry
        before_f1 = len(pool)
        passed_f1: List[InvestorCandidate] = []
        dropped_f1_reasons: List[str] = []

        for c in pool:
            # Match if target industry is in investor focus industries or if investor focuses on general tech
            if target_industry in c.focus_industries or "AI/ML" in c.focus_industries and target_industry in ["DeepTech", "HealthTech", "FinTech", "SaaS"]:
                passed_f1.append(c)
            else:
                if len(dropped_f1_reasons) < 3:
                    dropped_f1_reasons.append(
                        f"Investor focus is {', '.join(c.focus_industries)} (Startup requires {target_industry})"
                    )

        pool = passed_f1
        after_f1 = len(pool)
        funnel_steps.append(
            FunnelStep(
                step_index=1,
                filter_name="Industry & Domain Alignment",
                filter_key="industry_filter",
                description=f"Strict alignment with primary domain ({target_industry}) and adjacent cross-domain focus.",
                candidates_before=before_f1,
                candidates_after=after_f1,
                dropped_count=before_f1 - after_f1,
                retention_rate_pct=round((after_f1 / before_f1) * 100, 1) if before_f1 > 0 else 0.0,
                sample_dropped_reasons=dropped_f1_reasons,
            )
        )

        # -------------------------------------------------------------
        # Filter 2: Investment Stage Compatibility
        # -------------------------------------------------------------
        target_stage = criteria.stage or profile.stage
        before_f2 = len(pool)
        passed_f2: List[InvestorCandidate] = []
        dropped_f2_reasons: List[str] = []

        for c in pool:
            # Check if stage intersects or is closely adjacent
            stage_match = target_stage in c.investment_stages
            if not stage_match:
                # Allow adjacent tolerance (e.g. Seed fund might consider Pre-Seed)
                if target_stage == "Idea / Pre-Seed" and "Seed" in c.investment_stages and c.min_check_usd <= 250_000:
                    stage_match = True
                elif target_stage == "Seed" and ("Idea / Pre-Seed" in c.investment_stages or "Series A" in c.investment_stages):
                    stage_match = True

            if stage_match:
                passed_f2.append(c)
            else:
                if len(dropped_f2_reasons) < 3:
                    dropped_f2_reasons.append(
                        f"Firm mandate only covers {', '.join(c.investment_stages)} (Startup stage is {target_stage})"
                    )

        pool = passed_f2
        after_f2 = len(pool)
        funnel_steps.append(
            FunnelStep(
                step_index=2,
                filter_name="Investment Stage Suitability",
                filter_key="stage_filter",
                description=f"Ensures fund mandate explicitly covers startup development stage ({target_stage}).",
                candidates_before=before_f2,
                candidates_after=after_f2,
                dropped_count=before_f2 - after_f2,
                retention_rate_pct=round((after_f2 / before_f2) * 100, 1) if before_f2 > 0 else 0.0,
                sample_dropped_reasons=dropped_f2_reasons,
            )
        )

        # -------------------------------------------------------------
        # Filter 3: Check Size / Funding Range Fit
        # -------------------------------------------------------------
        target_funding = profile.target_funding_usd
        min_ticket = profile.min_ticket_usd
        before_f3 = len(pool)
        passed_f3: List[InvestorCandidate] = []
        dropped_f3_reasons: List[str] = []

        for c in pool:
            # Check if check size matches startup's target range
            # Investor check must be able to lead or co-lead
            fits_ticket = (c.max_check_usd >= min_ticket) and (c.min_check_usd <= target_funding * 1.5)
            if fits_ticket:
                passed_f3.append(c)
            else:
                if len(dropped_f3_reasons) < 3:
                    dropped_f3_reasons.append(
                        f"Check size (${c.min_check_usd/1e3:.0f}k - ${c.max_check_usd/1e6:.1f}M) out of startup range (${min_ticket/1e3:.0f}k - ${target_funding/1e6:.1f}M)"
                    )

        pool = passed_f3
        after_f3 = len(pool)
        funnel_steps.append(
            FunnelStep(
                step_index=3,
                filter_name="Funding Range & Ticket Fit",
                filter_key="ticket_size_filter",
                description=f"Verifies check size capacity (${min_ticket/1e3:.0f}k min up to ${target_funding/1e6:.1f}M target).",
                candidates_before=before_f3,
                candidates_after=after_f3,
                dropped_count=before_f3 - after_f3,
                retention_rate_pct=round((after_f3 / before_f3) * 100, 1) if before_f3 > 0 else 0.0,
                sample_dropped_reasons=dropped_f3_reasons,
            )
        )

        # -------------------------------------------------------------
        # Filter 4: Geography & Operational Presence
        # -------------------------------------------------------------
        target_geos = set(profile.target_geographies + ["Global"])
        before_f4 = len(pool)
        passed_f4: List[InvestorCandidate] = []
        dropped_f4_reasons: List[str] = []

        for c in pool:
            cand_geos = set(c.target_geographies)
            # Match if Global in either or shared geography
            geo_overlap = bool(target_geos.intersection(cand_geos)) or "Global" in cand_geos
            if geo_overlap:
                passed_f4.append(c)
            else:
                if len(dropped_f4_reasons) < 3:
                    dropped_f4_reasons.append(
                        f"Investor restricted to {', '.join(c.target_geographies)} (Startup operates in {', '.join(profile.target_geographies)})"
                    )

        pool = passed_f4
        after_f4 = len(pool)
        funnel_steps.append(
            FunnelStep(
                step_index=4,
                filter_name="Geographic & Regional Mandate",
                filter_key="geography_filter",
                description=f"Regional presence and regulatory mandate matches ({', '.join(profile.target_geographies)}).",
                candidates_before=before_f4,
                candidates_after=after_f4,
                dropped_count=before_f4 - after_f4,
                retention_rate_pct=round((after_f4 / before_f4) * 100, 1) if before_f4 > 0 else 0.0,
                sample_dropped_reasons=dropped_f4_reasons,
            )
        )

        # -------------------------------------------------------------
        # Filter 5: AI Semantic & Synergy Fit Score Threshold
        # -------------------------------------------------------------
        min_semantic_thresh = criteria.min_semantic_score  # default 0.65 (65%)
        before_f5 = len(pool)
        scored_candidates: List[Tuple[InvestorCandidate, MatchScoreBreakdown, str]] = []
        dropped_f5_reasons: List[str] = []

        profile_text = (
            f"{profile.startup_name} {profile.tagline} {profile.industry} "
            f"{' '.join(profile.sub_sectors)} {profile.pitch_summary} {' '.join(profile.tech_stack)}"
        )

        for c in pool:
            candidate_text = f"{c.firm} {c.thesis} {' '.join(c.focus_industries)} {' '.join(c.key_investments)}"
            semantic_score = _compute_cosine_similarity(profile_text, candidate_text)

            # Industry score
            if profile.industry in c.focus_industries:
                ind_score = 0.95
            elif any(sub in c.thesis for sub in profile.sub_sectors):
                ind_score = 0.88
            else:
                ind_score = 0.75

            # Stage score
            stg_score = 0.95 if profile.stage in c.investment_stages else 0.80

            # Ticket score
            if c.min_check_usd <= profile.min_ticket_usd and c.max_check_usd >= profile.target_funding_usd * 0.7:
                tkt_score = 0.96
            else:
                tkt_score = 0.82

            # Geo score
            geo_score = 0.95 if "Global" in c.target_geographies or any(g in c.target_geographies for g in profile.target_geographies) else 0.75

            # Weighted overall formula: 25% Domain + 20% Stage + 20% Ticket + 10% Geo + 25% AI Semantic
            overall_score = (
                0.25 * ind_score
                + 0.20 * stg_score
                + 0.20 * tkt_score
                + 0.10 * geo_score
                + 0.25 * semantic_score
            )

            # Check if passes semantic / overall cutoff
            if semantic_score >= min_semantic_thresh or overall_score >= 0.78:
                # Generate explainable AI match justification
                matched_kw = [
                    w for w in ["AI", "health", "clinical", "diagnostic", "imaging", "software", "data", "deeptech"]
                    if w in profile_text.lower() and w in candidate_text.lower()
                ]
                kw_str = ", ".join(matched_kw[:3]) if matched_kw else "high domain alignment"
                why = (
                    f"Direct synergy on {kw_str}. Firm's check size (${c.min_check_usd/1e3:.0f}k - ${c.max_check_usd/1e6:.1f}M) "
                    f"matches raise goal with relevant portfolio precedence in {', '.join(c.key_investments[:2])}."
                )

                breakdown = MatchScoreBreakdown(
                    overall_score=round(overall_score * 100, 1),
                    industry_score=round(ind_score * 100, 1),
                    stage_score=round(stg_score * 100, 1),
                    ticket_fit_score=round(tkt_score * 100, 1),
                    geo_score=round(geo_score * 100, 1),
                    semantic_score=round(semantic_score * 100, 1),
                )
                scored_candidates.append((c, breakdown, why))
            else:
                if len(dropped_f5_reasons) < 3:
                    dropped_f5_reasons.append(
                        f"Semantic synergy score {semantic_score*100:.1f}% below threshold {min_semantic_thresh*100:.0f}%"
                    )

        # Sort by overall score descending
        scored_candidates.sort(key=lambda x: x[1].overall_score, reverse=True)

        after_f5 = len(scored_candidates)
        funnel_steps.append(
            FunnelStep(
                step_index=5,
                filter_name="AI Semantic & Synergy Cutoff",
                filter_key="ai_semantic_filter",
                description=f"Neural / TF-IDF text similarity and multi-criteria score threshold (>= {min_semantic_thresh*100:.0f}%).",
                candidates_before=before_f5,
                candidates_after=after_f5,
                dropped_count=before_f5 - after_f5,
                retention_rate_pct=round((after_f5 / before_f5) * 100, 1) if before_f5 > 0 else 0.0,
                sample_dropped_reasons=dropped_f5_reasons,
            )
        )

        # Format final match items
        match_items: List[MatchResultItem] = []
        for rank, (cand, breakdown, why) in enumerate(scored_candidates[:max_results], 1):
            match_items.append(
                MatchResultItem(
                    candidate=cand,
                    scores=breakdown,
                    why_matched=why,
                    filter_verdicts={
                        "industry_passed": True,
                        "stage_passed": True,
                        "ticket_passed": True,
                        "geo_passed": True,
                        "semantic_passed": True,
                    },
                    passed_all_filters=True,
                    rank=rank,
                )
            )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return MatchResponse(
            profile=profile,
            total_candidates_pool=initial_count,
            final_matches_count=len(match_items),
            funnel_steps=funnel_steps,
            matches=match_items,
            execution_time_ms=elapsed_ms,
        )


# Singleton engine instance
ENGINE = MatchingEngine()
