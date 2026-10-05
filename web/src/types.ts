export type AnomalyType = 'heatwave' | 'rainfall' | 'cyclone' | 'all';

export interface EventTrackPoint {
  date: string;
  latitude: number;
  longitude: number;
  area_km2: number;
  intensity_anomaly: number;
  velocity_km_day: number;
}

export interface EventTrack {
  id: string;
  type: 'heatwave' | 'rainfall' | 'cyclone';
  start_date: string;
  end_date: string;
  duration_days: number;
  peak_intensity: number;
  max_area_km2: number;
  mean_velocity_km_day: number;
  path: [number, number][]; // [lon, lat]
  history: EventTrackPoint[];
  status: 'active' | 'dissipated';
}

export interface AnomalyCell {
  latitude: number;
  longitude: number;
  value: number;
  zscore: number;
  type: 'heatwave' | 'rainfall' | 'cyclone';
}

export interface AnomalyMapResponse {
  date: string;
  variable: string;
  grid: {
    lat_min: number;
    lat_max: number;
    lon_min: number;
    lon_max: number;
    lat_step: number;
    lon_step: number;
  };
  anomalies: AnomalyCell[];
  geojson: any;
}

export interface ForecastResponse {
  forecast_date: string;
  target_date: string;
  lead_days: number;
  metrics: {
    rmse: number;
    acc: number;
    csi: number;
    pod: number;
    far: number;
  };
  predicted_anomaly: AnomalyCell[];
  actual_anomaly: AnomalyCell[];
}

export interface ModelMetrics {
  detection: {
    baseline: { precision: number; recall: number; f1: number; iou: number; dice: number };
    iforest: { precision: number; recall: number; f1: number; iou: number; dice: number };
    autoencoder: { precision: number; recall: number; f1: number; iou: number; dice: number };
    unet: { precision: number; recall: number; f1: number; iou: number; dice: number };
  };
  tracking: {
    match_rate: number;
    mean_position_error_km: number;
    mean_duration_error_days: number;
  };
  forecasting: {
    convlstm: Record<string, { rmse: number; acc: number; csi: number; pod: number; far: number }>;
    persistence: Record<string, { rmse: number; acc: number; csi: number; pod: number; far: number }>;
    climatology: Record<string, { rmse: number; acc: number; csi: number; pod: number; far: number }>;
  };
  ablation?: AblationRow[];
}

export type MetricsResponse = ModelMetrics;

export interface AblationRow {
  method: string;
  features: string;
  precision: number;
  recall: number;
  f1: number;
  iou: number;
  dice: number;
  inference_ms: number;
}

// =====================================================================
// Entrepreneur AI Matching System Types
// =====================================================================

export interface EntrepreneurProfile {
  id: string;
  startup_name: string;
  founder_name: string;
  email: string;
  tagline: string;
  industry: string;
  sub_sectors: string[];
  stage: string;
  target_funding_usd: number;
  min_ticket_usd: number;
  valuation_usd: number;
  location: string;
  target_geographies: string[];
  team_size: number;
  traction_mrr_usd: number;
  active_users: number;
  pitch_summary: string;
  tech_stack: string[];
  created_at?: string;
}

export interface InvestorCandidate {
  id: string;
  name: string;
  firm: string;
  partner_name: string;
  avatar_url?: string;
  focus_industries: string[];
  investment_stages: string[];
  min_check_usd: number;
  max_check_usd: number;
  target_geographies: string[];
  portfolio_count: number;
  dry_powder_usd: number;
  thesis: string;
  key_investments: string[];
  lead_investor: boolean;
  rating: number;
}

export interface FunnelStep {
  step_index: number;
  filter_name: string;
  filter_key: string;
  description: string;
  candidates_before: number;
  candidates_after: number;
  dropped_count: number;
  retention_rate_pct: number;
  sample_dropped_reasons: string[];
}

export interface MatchScoreBreakdown {
  overall_score: number;
  industry_score: number;
  stage_score: number;
  ticket_fit_score: number;
  geo_score: number;
  semantic_score: number;
}

export interface MatchResultItem {
  candidate: InvestorCandidate;
  scores: MatchScoreBreakdown;
  why_matched: string;
  filter_verdicts: Record<string, boolean>;
  passed_all_filters: boolean;
  rank: number;
}

export interface MatchResponse {
  profile: EntrepreneurProfile;
  total_candidates_pool: number;
  final_matches_count: number;
  funnel_steps: FunnelStep[];
  matches: MatchResultItem[];
  execution_time_ms: number;
}

export interface UserRegistrationData {
  user_id?: string;
  full_name: string;
  email: string;
  role: 'entrepreneur' | 'investor' | 'mentor';
  organization_name: string;
  phone?: string;
  linkedin_url?: string;
  token?: string;
}

export interface DashboardStats {
  total_candidate_pool: number;
  candidates_remaining: number;
  top_match_percentage: number;
  active_inquiries_sent: number;
  average_compatibility_score: number;
  filters_configured_count: number;
  funnel_dropoff_rate: number;
  recent_matches: MatchResultItem[];
  industry_distribution: Record<string, number>;
  stage_distribution: Record<string, number>;
}

