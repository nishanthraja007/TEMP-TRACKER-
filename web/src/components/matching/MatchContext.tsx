import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  EntrepreneurProfile,
  InvestorCandidate,
  FunnelStep,
  MatchResultItem,
  MatchResponse,
  DashboardStats,
  UserRegistrationData,
} from '../../types';

// Default entrepreneur profile
export const INITIAL_PROFILE: EntrepreneurProfile = {
  id: 'ent-001',
  startup_name: 'NexusAI Health',
  founder_name: 'Nishanth Raja',
  email: 'nishanth@nexusai.health',
  tagline: 'Autonomous Clinical Diagnostic Assistant & Predictive Healthcare Intelligence',
  industry: 'HealthTech',
  sub_sectors: ['AI Diagnostic', 'Medical Imaging', 'Healthcare SaaS'],
  stage: 'Seed',
  target_funding_usd: 1500000,
  min_ticket_usd: 100000,
  valuation_usd: 8000000,
  location: 'Bangalore, India',
  target_geographies: ['Global', 'Asia-Pacific', 'North America'],
  team_size: 6,
  traction_mrr_usd: 24000,
  active_users: 1450,
  pitch_summary:
    'NexusAI builds cutting-edge multi-modal computer vision and transformer agents to assist radiologists and clinical teams in diagnosing pulmonary and oncology scans in under 45 seconds with 99.2% sensitivity. We have 4 hospital pilots, $24k MRR, and HIPAA compliant infrastructure deployed on AWS GovCloud.',
  tech_stack: ['PyTorch', 'FastAPI', 'React', 'Docker', 'PostgreSQL', 'CUDA'],
};

// Curated sample investor candidates for fallback simulation
export const SAMPLE_CANDIDATES: InvestorCandidate[] = [
  {
    id: 'INV-1001',
    name: 'Vijay Pande (Andreessen Horowitz Bio+Health)',
    firm: 'Andreessen Horowitz Bio+Health',
    partner_name: 'Vijay Pande',
    focus_industries: ['HealthTech', 'AI/ML', 'DeepTech'],
    investment_stages: ['Seed', 'Series A', 'Series B / Growth'],
    min_check_usd: 750000,
    max_check_usd: 10000000,
    target_geographies: ['Global', 'North America'],
    portfolio_count: 52,
    dry_powder_usd: 350000000,
    thesis: 'Investing at the convergence of machine learning, biology, and clinical workflow transformation.',
    key_investments: ['Freenome', 'Insitro', 'BioAge', 'Devoted Health'],
    lead_investor: true,
    rating: 4.95,
  },
  {
    id: 'INV-1000',
    name: 'Roelof Botha (Sequoia Capital Horizon)',
    firm: 'Sequoia Capital Horizon',
    partner_name: 'Roelof Botha',
    focus_industries: ['AI/ML', 'HealthTech', 'SaaS'],
    investment_stages: ['Seed', 'Series A'],
    min_check_usd: 500000,
    max_check_usd: 5000000,
    target_geographies: ['Global', 'North America', 'Asia-Pacific'],
    portfolio_count: 68,
    dry_powder_usd: 420000000,
    thesis: 'Focusing on transformative generative AI and precision healthcare systems solving massive clinical friction.',
    key_investments: ['Apple', 'Stripe', 'Unity', 'Nuance Healthcare'],
    lead_investor: true,
    rating: 4.98,
  },
  {
    id: 'INV-1004',
    name: 'Jishnu Bhattacharjee (Nexus Venture Partners)',
    firm: 'Nexus Venture Partners',
    partner_name: 'Jishnu Bhattacharjee',
    focus_industries: ['AI/ML', 'SaaS', 'HealthTech'],
    investment_stages: ['Seed', 'Series A'],
    min_check_usd: 500000,
    max_check_usd: 4500000,
    target_geographies: ['Asia-Pacific', 'India', 'North America', 'Global'],
    portfolio_count: 46,
    dry_powder_usd: 180000000,
    thesis: 'Pioneers in US-India cross-border enterprise software and AI intelligence pipelines with strong unit economics.',
    key_investments: ['Postman', 'Hasura', 'Apollo.io', 'MinIO'],
    lead_investor: true,
    rating: 4.88,
  },
  {
    id: 'INV-1005',
    name: 'Ling Wong (Lightspeed Health & AI)',
    firm: 'Lightspeed Health & AI',
    partner_name: 'Ling Wong',
    focus_industries: ['HealthTech', 'AI/ML'],
    investment_stages: ['Seed', 'Series A'],
    min_check_usd: 600000,
    max_check_usd: 5000000,
    target_geographies: ['Global', 'North America'],
    portfolio_count: 38,
    dry_powder_usd: 240000000,
    thesis: 'Partnering with visionary founders building diagnostic platforms and AI-enabled clinical agents.',
    key_investments: ['Guardant Health', 'Personalis', 'Epic Systems', 'Zocdoc'],
    lead_investor: true,
    rating: 4.85,
  },
  {
    id: 'INV-1003',
    name: 'Vinod Khosla (Khosla Ventures Frontier)',
    firm: 'Khosla Ventures Frontier',
    partner_name: 'Vinod Khosla',
    focus_industries: ['DeepTech', 'HealthTech', 'CleanTech', 'AI/ML'],
    investment_stages: ['Idea / Pre-Seed', 'Seed', 'Series A'],
    min_check_usd: 250000,
    max_check_usd: 6000000,
    target_geographies: ['Global', 'North America', 'India'],
    portfolio_count: 75,
    dry_powder_usd: 500000000,
    thesis: 'Backing audacious technical ideas with huge potential to positively impact humanity and medicine.',
    key_investments: ['OpenAI', 'DoorDash', 'Square', 'Guardant Health'],
    lead_investor: true,
    rating: 4.92,
  },
  {
    id: 'INV-1006',
    name: 'Hemant Taneja (General Catalyst HealthCatalyst)',
    firm: 'General Catalyst HealthCatalyst',
    partner_name: 'Hemant Taneja',
    focus_industries: ['HealthTech', 'FinTech', 'SaaS'],
    investment_stages: ['Seed', 'Series A', 'Series B / Growth'],
    min_check_usd: 1000000,
    max_check_usd: 12000000,
    target_geographies: ['Global', 'North America', 'Europe'],
    portfolio_count: 55,
    dry_powder_usd: 650000000,
    thesis: 'Creating unbundled, value-based healthcare ecosystems through AI, data, and patient-first software.',
    key_investments: ['Livongo', 'Oscar Health', 'Commure', 'Stripe'],
    lead_investor: true,
    rating: 4.89,
  },
  {
    id: 'INV-1011',
    name: 'Garry Tan (Y-Combinator Alumni Angel Syndicate)',
    firm: 'Y-Combinator Alumni Angel Syndicate',
    partner_name: 'Garry Tan',
    focus_industries: ['AI/ML', 'SaaS', 'HealthTech', 'FinTech', 'CleanTech'],
    investment_stages: ['Idea / Pre-Seed', 'Seed'],
    min_check_usd: 100000,
    max_check_usd: 1500000,
    target_geographies: ['Global', 'North America', 'Asia-Pacific', 'Europe'],
    portfolio_count: 120,
    dry_powder_usd: 85000000,
    thesis: 'First-cheque community backing the top technical entrepreneurs building high-velocity MVPs.',
    key_investments: ['Airbnb', 'Dropbox', 'Coinbase', 'Ginkgo Bioworks'],
    lead_investor: true,
    rating: 4.9,
  },
];

interface MatchContextType {
  profile: EntrepreneurProfile;
  funnelSteps: FunnelStep[];
  matches: MatchResultItem[];
  stats: DashboardStats | null;
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  updateProfile: (newProf: EntrepreneurProfile) => Promise<void>;
  runMatchPipeline: (overrides?: any) => Promise<void>;
  user: UserRegistrationData | null;
  registerUser: (data: UserRegistrationData) => Promise<boolean>;
  logoutUser: () => void;
  semanticThreshold: number;
  setSemanticThreshold: (val: number) => void;
  selectedCandidate: InvestorCandidate | null;
  setSelectedCandidate: (cand: InvestorCandidate | null) => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export function MatchProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<EntrepreneurProfile>(INITIAL_PROFILE);
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [matches, setMatches] = useState<MatchResultItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [semanticThreshold, setSemanticThreshold] = useState<number>(0.65);
  const [selectedCandidate, setSelectedCandidate] = useState<InvestorCandidate | null>(null);

  const [user, setUser] = useState<UserRegistrationData | null>(() => {
    return {
      user_id: 'USR-DEMO-01',
      full_name: 'Nishanth Raja',
      email: 'nishanth@nexusai.health',
      role: 'entrepreneur',
      organization_name: 'NexusAI Health',
    };
  });

  // Client-side fallback simulator when API is not reached
  const simulateLocalPipeline = (currentProf: EntrepreneurProfile, threshold: number) => {
    const total = 1000;
    const f1After = 387; // Industry & Domain filter
    const f2After = 340; // Stage suitability filter
    const f3After = Math.round(f2After * 0.92); // Ticket size filter
    const f4After = Math.round(f3After * 0.72); // Geography filter
    // Slider impacts step 5 retention
    const f5RetainRatio = Math.max(0.15, Math.min(0.9, 1.25 - threshold));
    const f5After = Math.max(6, Math.round(f4After * f5RetainRatio));

    const simulatedSteps: FunnelStep[] = [
      {
        step_index: 0,
        filter_name: 'Total Candidate Pool',
        filter_key: 'initial_pool',
        description: 'All registered institutional venture capital funds, angels, and family offices in the database.',
        candidates_before: total,
        candidates_after: total,
        dropped_count: 0,
        retention_rate_pct: 100.0,
        sample_dropped_reasons: [],
      },
      {
        step_index: 1,
        filter_name: 'Industry & Domain Alignment',
        filter_key: 'industry_filter',
        description: `Strict mandate verification for ${currentProf.industry} and related cross-sector specializations.`,
        candidates_before: total,
        candidates_after: f1After,
        dropped_count: total - f1After,
        retention_rate_pct: 38.7,
        sample_dropped_reasons: [
          'Investor mandate restricted exclusively to Consumer D2C or Crypto',
          'Fund policy excludes biotechnology and clinical diagnostics',
        ],
      },
      {
        step_index: 2,
        filter_name: 'Investment Stage Suitability',
        filter_key: 'stage_filter',
        description: `Ensures fund deployment scope accommodates ${currentProf.stage} round allocation.`,
        candidates_before: f1After,
        candidates_after: f2After,
        dropped_count: f1After - f2After,
        retention_rate_pct: 87.9,
        sample_dropped_reasons: [
          'Late-stage / Growth fund requiring > $5M ARR before first deployment',
          'Pre-seed only incubator cannot deploy lead checks for Seed scale',
        ],
      },
      {
        step_index: 3,
        filter_name: 'Funding Range & Ticket Fit',
        filter_key: 'ticket_size_filter',
        description: `Verifies minimum check capacity ($${(currentProf.min_ticket_usd / 1e3).toFixed(0)}k) and target round ($${(currentProf.target_funding_usd / 1e6).toFixed(1)}M).`,
        candidates_before: f2After,
        candidates_after: f3After,
        dropped_count: f2After - f3After,
        retention_rate_pct: 92.0,
        sample_dropped_reasons: [
          'Minimum check size exceeds round allocation ($15M lead requirement)',
          'Maximum check capacity too small to lead requested round',
        ],
      },
      {
        step_index: 4,
        filter_name: 'Geographic & Regional Mandate',
        filter_key: 'geography_filter',
        description: `Validates operational jurisdiction for ${currentProf.target_geographies.join(', ')}.`,
        candidates_before: f3After,
        candidates_after: f4After,
        dropped_count: f3After - f4After,
        retention_rate_pct: 72.0,
        sample_dropped_reasons: [
          'Restricted to domestic LATAM or Nordic entities only',
          'Excludes cross-border entities without onshore US holding structure',
        ],
      },
      {
        step_index: 5,
        filter_name: 'AI Semantic & Synergy Cutoff',
        filter_key: 'ai_semantic_filter',
        description: `NLP vector cosine similarity & multi-criteria compatibility threshold (>= ${(threshold * 100).toFixed(0)}%).`,
        candidates_before: f4After,
        candidates_after: f5After,
        dropped_count: f4After - f5After,
        retention_rate_pct: Math.round((f5After / f4After) * 1000) / 10,
        sample_dropped_reasons: [
          `Composite semantic synergy score below ${(threshold * 100).toFixed(0)}% cutoff threshold`,
          'No historical portfolio synergy in clinical diagnostics or medical imaging',
        ],
      },
    ];

    setFunnelSteps(simulatedSteps);

    // Build matching results from candidates
    const simulatedMatches: MatchResultItem[] = SAMPLE_CANDIDATES.map((cand, idx) => {
      const semScore = Math.min(99, Math.round(96 - idx * 2.1 + (Math.random() * 2 - 1)));
      const overall = Math.min(99, Math.round(98 - idx * 1.8));
      return {
        candidate: cand,
        scores: {
          overall_score: overall,
          industry_score: 98,
          stage_score: 96,
          ticket_fit_score: 95,
          geo_score: 94,
          semantic_score: semScore,
        },
        why_matched: `Strong domain synergy on ${currentProf.industry}. Matching ticket range ($${(cand.min_check_usd / 1e3).toFixed(0)}k - $${(cand.max_check_usd / 1e6).toFixed(1)}M) covers your $${(currentProf.target_funding_usd / 1e6).toFixed(1)}M raise with high-impact portfolio presence in ${cand.key_investments.slice(0, 2).join(', ')}.`,
        filter_verdicts: {
          industry_passed: true,
          stage_passed: true,
          ticket_passed: true,
          geo_passed: true,
          semantic_passed: true,
        },
        passed_all_filters: true,
        rank: idx + 1,
      };
    });

    setMatches(simulatedMatches);

    setStats({
      total_candidate_pool: total,
      candidates_remaining: f5After,
      top_match_percentage: simulatedMatches[0]?.scores.overall_score || 96.5,
      active_inquiries_sent: 4,
      average_compatibility_score: 92.4,
      filters_configured_count: 5,
      funnel_dropoff_rate: Math.round(((total - f5After) / total) * 1000) / 10,
      recent_matches: simulatedMatches.slice(0, 5),
      industry_distribution: {
        HealthTech: 387,
        'AI/ML': 412,
        FinTech: 280,
        SaaS: 360,
        CleanTech: 140,
        EdTech: 95,
        DeepTech: 190,
        'E-commerce': 110,
      },
      stage_distribution: {
        'Idea / Pre-Seed': 220,
        Seed: 460,
        'Series A': 380,
        'Series B / Growth': 210,
      },
    });
  };

  const runMatchPipeline = async (overrides?: any) => {
    setLoading(true);
    const thresh = overrides?.min_semantic_score ?? semanticThreshold;

    try {
      const res = await fetch('/api/matching/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_semantic_score: thresh }),
      });

      if (res.ok) {
        const data: MatchResponse = await res.json();
        setFunnelSteps(data.funnel_steps);
        setMatches(data.matches);

        // Fetch dashboard stats as well
        const dashRes = await fetch('/api/matching/dashboard');
        if (dashRes.ok) {
          const dashData: DashboardStats = await dashRes.json();
          setStats(dashData);
        }
      } else {
        // Fallback simulation
        simulateLocalPipeline(profile, thresh);
      }
    } catch {
      simulateLocalPipeline(profile, thresh);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (newProf: EntrepreneurProfile) => {
    setLoading(true);
    setProfile(newProf);
    try {
      const res = await fetch('/api/matching/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProf),
      });
      if (res.ok) {
        await runMatchPipeline();
      } else {
        simulateLocalPipeline(newProf, semanticThreshold);
      }
    } catch {
      simulateLocalPipeline(newProf, semanticThreshold);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (data: UserRegistrationData): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/matching/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const respData = await res.json();
        setUser({
          ...data,
          user_id: respData.user_id,
          token: respData.token,
        });
        setLoading(false);
        return true;
      }
    } catch {
      // Fallback
    }

    // Fallback registration success
    setUser({
      ...data,
      user_id: `USR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      token: `jwt_mock_${Date.now()}`,
    });
    setLoading(false);
    return true;
  };

  const logoutUser = () => {
    setUser(null);
  };

  useEffect(() => {
    runMatchPipeline();
  }, [semanticThreshold]);

  return (
    <MatchContext.Provider
      value={{
        profile,
        funnelSteps,
        matches,
        stats,
        loading,
        activeTab,
        setActiveTab,
        updateProfile,
        runMatchPipeline,
        user,
        registerUser,
        logoutUser,
        semanticThreshold,
        setSemanticThreshold,
        selectedCandidate,
        setSelectedCandidate,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
}
