import React from 'react';
import {
  Users,
  Sparkles,
  TrendingUp,
  Filter,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Building,
  Activity,
  Layers,
  FileText,
  Send,
  Star,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useMatch } from './MatchContext';

export default function DashboardView() {
  const { stats, profile, matches, funnelSteps, setActiveTab } = useMatch();

  const totalPool = stats?.total_candidate_pool || 1000;
  const remaining = stats?.candidates_remaining || funnelSteps[funnelSteps.length - 1]?.candidates_after || 12;
  const topScore = stats?.top_match_percentage || (matches[0]?.scores.overall_score ?? 96.4);
  const activeInquiries = stats?.active_inquiries_sent || 4;

  // Chart distribution data
  const sectorData = [
    { name: 'HealthTech', count: 387, color: '#06b6d4' },
    { name: 'AI/ML', count: 412, color: '#3b82f6' },
    { name: 'FinTech', count: 280, color: '#10b981' },
    { name: 'SaaS', count: 360, color: '#8b5cf6' },
    { name: 'CleanTech', count: 140, color: '#f59e0b' },
    { name: 'DeepTech', count: 190, color: '#ec4899' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>EXECUTIVE INTELLIGENCE COCKPIT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#8a8a93] mt-1 max-w-2xl">
            Real-time telemetry, candidate retention funnel analytics, and algorithmic matchmaking metrics for {profile.startup_name}.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Profile Form</span>
          </button>
          <button
            onClick={() => setActiveTab('funnel')}
            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Candidates Funnel</span>
          </button>
          <button
            onClick={() => setActiveTab('matching')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:opacity-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Match Results</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-6 rounded-3xl bg-surface/80 border border-white/10 hover:border-white/20 transition-all backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-blue-400" />
          </div>
          <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Total Candidate Pool
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 font-mono">
            {totalPool.toLocaleString()}
          </div>
          <div className="text-xs text-[#8a8a93] mt-2 flex items-center gap-1">
            <span className="text-blue-400 font-semibold">100%</span>
            <span>indexed institutional funds</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-6 rounded-3xl bg-surface/80 border border-cyan-500/30 hover:border-cyan-500/50 transition-all backdrop-blur-md relative overflow-hidden group shadow-[0_0_25px_rgba(6,182,212,0.06)]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Filter className="w-16 h-16 text-cyan-400" />
          </div>
          <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Remaining Candidates
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-2 font-mono">
            {remaining}
          </div>
          <div className="text-xs text-[#8a8a93] mt-2 flex items-center gap-1">
            <span className="text-cyan-300 font-semibold">{((remaining / totalPool) * 100).toFixed(1)}%</span>
            <span>survived all 5 filtering gates</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-6 rounded-3xl bg-surface/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-all backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Top Match Compatibility
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
            {topScore}%
          </div>
          <div className="text-xs text-[#8a8a93] mt-2 flex items-center gap-1">
            <span className="text-emerald-300 font-semibold">Tier-1 VC</span>
            <span>synergy on {profile.industry}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-6 rounded-3xl bg-surface/80 border border-purple-500/20 hover:border-purple-500/40 transition-all backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Send className="w-16 h-16 text-purple-400" />
          </div>
          <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-purple-400" />
            Active Introductions
          </div>
          <div className="text-3xl font-extrabold text-purple-400 mt-2 font-mono">
            {activeInquiries} Dispatched
          </div>
          <div className="text-xs text-[#8a8a93] mt-2 flex items-center gap-1">
            <span className="text-purple-300 font-semibold">100%</span>
            <span>partner delivery response rate</span>
          </div>
        </div>
      </div>

      {/* Row 2: Active Profile Snapshot + Funnel Telemetry Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Profile Snapshot */}
        <div className="p-6 rounded-3xl bg-surface/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Active Startup Profile
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="text-xs text-cyan-400 hover:underline font-medium"
            >
              Edit Form →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-lg font-bold text-white">{profile.startup_name}</div>
              <div className="text-[#8a8a93] text-[11px] mt-0.5">{profile.tagline}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-mono text-[#8a8a93]">Domain</div>
                <div className="text-sm font-bold text-white mt-0.5">{profile.industry}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-mono text-[#8a8a93]">Stage</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">{profile.stage}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-mono text-[#8a8a93]">Target Raise</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                  ${(profile.target_funding_usd / 1e6).toFixed(1)}M
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-mono text-[#8a8a93]">Headquarters</div>
                <div className="text-sm font-bold text-white mt-0.5">{profile.location}</div>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[10px] font-mono text-[#8a8a93] uppercase mb-1">
                Sub-Sector Keywords
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.sub_sectors.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Funnel Retention Efficiency Banner */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-surface/80 border border-white/10 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Cascade Filter Telemetry
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('funnel')}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                Inspect Full Funnel Details →
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {funnelSteps.slice(1).map((step, idx) => (
                <div
                  key={step.step_index}
                  className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1"
                >
                  <div className="text-[10px] font-mono text-[#8a8a93]">Filter {step.step_index}</div>
                  <div className="text-xs font-semibold text-zinc-300 truncate">
                    {step.filter_name.split(' ')[0]}
                  </div>
                  <div className="text-base font-bold text-cyan-400 font-mono">
                    {step.candidates_after}
                  </div>
                  <div className="text-[10px] text-red-400 font-mono">-{step.dropped_count} dropped</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <span className="text-zinc-300">
                <strong>98.8% Disqualification Efficiency:</strong> Only the most tightly aligned candidates survived all 5 gates.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('matching')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shrink-0 transition-colors shadow-md"
            >
              Browse Qualified Matches
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Top Recommended Matches Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Top 3 Recommended Matches</h2>
          </div>
          <button
            onClick={() => setActiveTab('matching')}
            className="text-xs text-cyan-400 hover:underline font-semibold"
          >
            View All ({matches.length}) Matches →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {matches.slice(0, 3).map((item) => (
            <div
              key={item.candidate.id}
              className="p-6 rounded-3xl bg-surface/80 border border-white/10 hover:border-cyan-500/40 transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold">
                    #{item.rank} Recommended
                  </span>
                  <div className="text-lg font-extrabold text-cyan-400 font-mono">
                    {item.scores.overall_score}%
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{item.candidate.firm}</h3>
                <div className="text-xs text-[#8a8a93] mt-0.5">
                  Partner: <strong className="text-zinc-300">{item.candidate.partner_name}</strong>
                </div>

                <p className="text-xs text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                  {item.candidate.thesis}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#8a8a93]">
                  ${(item.candidate.min_check_usd / 1e3).toFixed(0)}k - ${(item.candidate.max_check_usd / 1e6).toFixed(1)}M
                </span>
                <button
                  onClick={() => setActiveTab('matching')}
                  className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1"
                >
                  Inspect Match →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Industry Sector Distribution Chart */}
      <div className="p-6 rounded-3xl bg-surface/80 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Investor Candidate Pool Domain Distribution</h2>
          </div>
          <span className="text-xs font-mono text-[#8a8a93]">1,000 Candidates Indexed</span>
        </div>

        <div className="h-60 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-black/95 border border-white/20 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-bold text-white">{data.name}</div>
                        <div className="text-cyan-400 font-mono">{data.count} Registered Funds</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
