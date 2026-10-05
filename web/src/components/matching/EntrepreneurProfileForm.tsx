import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Save,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Cpu,
  Globe2,
  Building2,
  Users,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useMatch } from './MatchContext';
import { EntrepreneurProfile } from '../../types';

const SAMPLE_PRESETS: Record<string, Partial<EntrepreneurProfile>> = {
  healthtech: {
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
  },
  fintech: {
    startup_name: 'KavachPay Protocol',
    founder_name: 'Aravind Natarajan',
    email: 'aravind@kavachpay.io',
    tagline: 'Instant Cross-Border Settlement & Real-time AI Fraud Shield for Emerging Markets',
    industry: 'FinTech',
    sub_sectors: ['Cross-Border Payments', 'AI Fraud Detection', 'Neobanking'],
    stage: 'Seed',
    target_funding_usd: 2500000,
    min_ticket_usd: 250000,
    valuation_usd: 12000000,
    location: 'Singapore',
    target_geographies: ['Asia-Pacific', 'India', 'Global'],
    team_size: 9,
    traction_mrr_usd: 48000,
    active_users: 32000,
    pitch_summary:
      'KavachPay replaces legacy correspondent banking with a sub-second liquidity routing mesh backed by real-time ML fraud detection models. Currently clearing $4M GMV monthly across Southeast Asia and India with 40 bps take rate.',
    tech_stack: ['Go', 'Rust', 'Kafka', 'Redis', 'React', 'Postgres'],
  },
  cleantech: {
    startup_name: 'Solarix Energy OS',
    founder_name: 'Priya Venkatesh',
    email: 'priya@solarix.energy',
    tagline: 'Decentralized Microgrid Optimization & Battery Degradation Neural Forecasting',
    industry: 'CleanTech',
    sub_sectors: ['Renewable Grid', 'Battery Analytics', 'Carbon Tracking'],
    stage: 'Idea / Pre-Seed',
    target_funding_usd: 750000,
    min_ticket_usd: 50000,
    valuation_usd: 4500000,
    location: 'Berlin, Germany',
    target_geographies: ['Europe', 'Global'],
    team_size: 4,
    traction_mrr_usd: 8000,
    active_users: 620,
    pitch_summary:
      'Solarix utilizes recurrent spatial-temporal neural networks to forecast grid load variability and prolong utility-scale battery pack lifespans by 35%. Partnered with 2 regional German municipal utilities.',
    tech_stack: ['Python', 'TensorFlow', 'TimescaleDB', 'FastAPI', 'Tailwind'],
  },
};

export default function EntrepreneurProfileForm() {
  const { profile, updateProfile, setActiveTab, loading } = useMatch();
  const [formData, setFormData] = useState<EntrepreneurProfile>(profile);
  const [tagInput, setTagInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handlePresetSelect = (presetKey: string) => {
    const preset = SAMPLE_PRESETS[presetKey];
    if (preset) {
      setFormData({
        ...formData,
        ...preset,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      // Seamlessly navigate to candidates remaining after filter
      setActiveTab('funnel');
    }, 1000);
  };

  const handleAddSubSector = () => {
    if (tagInput.trim() && !formData.sub_sectors.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        sub_sectors: [...formData.sub_sectors, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveSubSector = (tag: string) => {
    setFormData({
      ...formData,
      sub_sectors: formData.sub_sectors.filter((t) => t !== tag),
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>STARTUP INTAKE & EMBEDDINGS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Entrepreneur Profile Form
          </h1>
          <p className="text-sm text-[#8a8a93] mt-1 max-w-2xl">
            Input comprehensive startup parameters, funding milestones, and executive pitch summary to power the multi-stage filter cascade and vector similarity engine.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#8a8a93] hidden sm:inline">Presets:</span>
          <button
            type="button"
            onClick={() => handlePresetSelect('healthtech')}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
          >
            HealthTech AI
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('fintech')}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
          >
            FinTech Mesh
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('cleantech')}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold transition-all"
          >
            CleanTech OS
          </button>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Startup Identity */}
        <div className="p-6 rounded-3xl bg-surface/80 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs font-mono">
              1. Startup Identity & Leadership
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Startup Name *
              </label>
              <input
                type="text"
                required
                value={formData.startup_name}
                onChange={(e) => setFormData({ ...formData, startup_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Lead Founder Name *
              </label>
              <input
                type="text"
                required
                value={formData.founder_name}
                onChange={(e) => setFormData({ ...formData, founder_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Founder Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
              One-Line Elevator Tagline *
            </label>
            <input
              type="text"
              required
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Headquarters / Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Team Size (FTEs) *
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.team_size}
                onChange={(e) => setFormData({ ...formData, team_size: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Industry Domain & Stage */}
        <div className="p-6 rounded-3xl bg-surface/80 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs font-mono">
              2. Domain, Mandate & Investment Stage
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Primary Industry Sector (Filter 1 Gate) *
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors font-medium"
              >
                {[
                  'HealthTech',
                  'AI/ML',
                  'FinTech',
                  'SaaS',
                  'CleanTech',
                  'EdTech',
                  'DeepTech',
                  'E-commerce',
                ].map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Current Funding Stage (Filter 2 Gate) *
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors font-medium"
              >
                {['Idea / Pre-Seed', 'Seed', 'Series A', 'Series B / Growth'].map((stg) => (
                  <option key={stg} value={stg}>
                    {stg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-sectors Tag Pills */}
          <div>
            <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
              Sub-Sectors & Specializations (For AI Keyword Fit)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Add sub-sector (e.g. Medical Imaging, Cross-Border Rails)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubSector();
                  }
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleAddSubSector}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                Add Tag
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.sub_sectors.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-1.5"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveSubSector(tag)}
                    className="hover:text-red-400 text-xs font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Funding & Financial Targets */}
        <div className="p-6 rounded-3xl bg-surface/80 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs font-mono">
              3. Funding Requirements & Capital Gates (Filter 3 Gate)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Target Raise Amount ($ USD) *
              </label>
              <div className="relative">
                <span className="text-[#8a8a93] absolute left-3.5 top-2.5 font-mono text-sm">$</span>
                <input
                  type="number"
                  step="50000"
                  required
                  value={formData.target_funding_usd}
                  onChange={(e) =>
                    setFormData({ ...formData, target_funding_usd: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono font-medium"
                />
              </div>
              <span className="text-[10px] text-cyan-400 font-mono mt-1 block">
                = ${(formData.target_funding_usd / 1e6).toFixed(2)} Million
              </span>
            </div>

            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Minimum Check Size ($ USD) *
              </label>
              <div className="relative">
                <span className="text-[#8a8a93] absolute left-3.5 top-2.5 font-mono text-sm">$</span>
                <input
                  type="number"
                  step="25000"
                  required
                  value={formData.min_ticket_usd}
                  onChange={(e) =>
                    setFormData({ ...formData, min_ticket_usd: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono font-medium"
                />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                = ${(formData.min_ticket_usd / 1e3).toFixed(0)}k Minimum Lead
              </span>
            </div>

            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Valuation Expectation ($ USD)
              </label>
              <div className="relative">
                <span className="text-[#8a8a93] absolute left-3.5 top-2.5 font-mono text-sm">$</span>
                <input
                  type="number"
                  step="100000"
                  value={formData.valuation_usd}
                  onChange={(e) =>
                    setFormData({ ...formData, valuation_usd: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono font-medium"
                />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                = ${(formData.valuation_usd / 1e6).toFixed(2)} Million Cap
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Monthly Recurring Revenue (MRR in USD)
              </label>
              <input
                type="number"
                value={formData.traction_mrr_usd}
                onChange={(e) =>
                  setFormData({ ...formData, traction_mrr_usd: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Active Users / Client Deployments
              </label>
              <input
                type="number"
                value={formData.active_users}
                onChange={(e) =>
                  setFormData({ ...formData, active_users: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Pitch Deck Summary & AI Vector Embeddings */}
        <div className="p-6 rounded-3xl bg-surface/80 border border-cyan-500/20 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs font-mono">
                4. Pitch Narrative & AI Semantic Embeddings (Filter 5 Gate)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">TF-IDF Vectorized</span>
          </div>

          <div>
            <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
              Comprehensive Pitch & Value Proposition Summary *
            </label>
            <textarea
              required
              rows={4}
              value={formData.pitch_summary}
              onChange={(e) => setFormData({ ...formData, pitch_summary: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors leading-relaxed font-sans"
              placeholder="Describe your technological innovation, clinical/market validation, competitive moat, and target customers..."
            />
            <p className="text-[11px] text-[#8a8a93] mt-2">
              💡 <strong>AI Matching Note:</strong> This summary text is parsed by our natural language scoring service and vector matched against the investment theses of 1,000 indexed venture firms to compute semantic similarity scores.
            </p>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="text-xs text-[#8a8a93]">
            {savedSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Profile updated! Recalculating candidate funnel...
              </span>
            ) : (
              <span>Clicking save will instantly run all 5 filtering gates.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-black" />
            <span>Save & Run AI Matchmaker</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </form>
    </div>
  );
}
