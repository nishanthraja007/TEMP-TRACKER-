import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Filter,
  Users,
  ArrowDown,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { useMatch } from './MatchContext';

export default function CandidatesRemainingView() {
  const {
    funnelSteps,
    profile,
    semanticThreshold,
    setSemanticThreshold,
    setActiveTab,
    loading,
  } = useMatch();

  // Prepare chart data
  const chartData = funnelSteps.map((s) => ({
    name: s.filter_key === 'initial_pool' ? 'Total Pool' : s.filter_name.split(' ')[0],
    fullName: s.filter_name,
    candidates: s.candidates_after,
    dropped: s.dropped_count,
    retention: s.retention_rate_pct,
  }));

  const funnelColors = [
    '#3b82f6', // Total: Blue
    '#06b6d4', // Domain: Cyan
    '#10b981', // Stage: Emerald
    '#f59e0b', // Ticket: Amber
    '#8b5cf6', // Geo: Purple
    '#ec4899', // AI Semantic: Pink
  ];

  const totalPool = funnelSteps[0]?.candidates_after || 1000;
  const finalCandidates = funnelSteps[funnelSteps.length - 1]?.candidates_after || 0;
  const overallRetention = totalPool > 0 ? ((finalCandidates / totalPool) * 100).toFixed(1) : '0';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-2">
            <Filter className="w-3.5 h-3.5" />
            <span>CASCADE FILTERING PIPELINE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Candidates Remaining After Each Filter
          </h1>
          <p className="text-sm text-[#8a8a93] mt-1 max-w-2xl">
            Real-time multi-stage funnel tracking showing candidate retention and drop-off counts as 1,000+ investors pass through algorithmic and semantic gates.
          </p>
        </div>

        {/* Action Button to Matching Results */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('matching')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-sm flex items-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>View {finalCandidates} Matching Results</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface/80 border border-white/10 backdrop-blur-md">
          <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider">Initial Candidate Pool</div>
          <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
            {totalPool.toLocaleString()}
            <span className="text-xs font-normal text-blue-400">100% pool</span>
          </div>
          <div className="text-xs text-[#8a8a93] mt-1">VC funds, syndicates & angels</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface/80 border border-white/10 backdrop-blur-md">
          <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider">Filter Checkpoints</div>
          <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
            5 Stages
            <span className="text-xs font-normal text-emerald-400">Sequential</span>
          </div>
          <div className="text-xs text-[#8a8a93] mt-1">Domain → Stage → Check → Geo → AI</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface/80 border border-white/10 backdrop-blur-md">
          <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider">Candidates Remaining</div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-1 flex items-baseline gap-2">
            {finalCandidates}
            <span className="text-xs font-normal text-cyan-300">({overallRetention}%)</span>
          </div>
          <div className="text-xs text-[#8a8a93] mt-1">Qualified high-affinity matches</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface/80 border border-white/10 backdrop-blur-md">
          <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider">Total Disqualified</div>
          <div className="text-3xl font-extrabold text-red-400 mt-1 flex items-baseline gap-2">
            {(totalPool - finalCandidates).toLocaleString()}
            <span className="text-xs font-normal text-red-300">Dropped</span>
          </div>
          <div className="text-xs text-[#8a8a93] mt-1">Exceeded risk or mandate bounds</div>
        </div>
      </div>

      {/* Interactive Threshold Slider & Controls */}
      <div className="p-6 rounded-2xl bg-surface/80 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.08)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Interactive Pipeline Simulation: AI Semantic Synergy Cutoff</span>
            </div>
            <p className="text-xs text-[#8a8a93]">
              Adjust the semantic vector similarity cutoff to see how many candidates survive Filter 5 in real time.
            </p>
          </div>

          <div className="flex items-center gap-4 min-w-[280px]">
            <span className="text-xs font-mono text-[#8a8a93]">Lenient (50%)</span>
            <input
              type="range"
              min="0.50"
              max="0.85"
              step="0.05"
              value={semanticThreshold}
              onChange={(e) => setSemanticThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {(semanticThreshold * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Current profile summary badge */}
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-3 text-xs text-[#8a8a93]">
          <span className="font-mono text-white">Target Profile:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white">
            Startup: <strong className="text-cyan-400">{profile.startup_name}</strong>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white">
            Industry: <strong className="text-cyan-400">{profile.industry}</strong>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white">
            Stage: <strong className="text-cyan-400">{profile.stage}</strong>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white">
            Target Raise: <strong className="text-cyan-400">${(profile.target_funding_usd / 1e6).toFixed(1)}M</strong>
          </span>
          <button
            onClick={() => setActiveTab('profile')}
            className="ml-auto text-cyan-400 hover:underline flex items-center gap-1 font-medium"
          >
            Edit Profile Parameters →
          </button>
        </div>
      </div>

      {/* Visual Chart: Funnel Bar Chart */}
      <div className="p-6 rounded-2xl bg-surface/80 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Candidate Retention Waterfall</h2>
          </div>
          <span className="text-xs font-mono text-[#8a8a93]">Remaining Candidates Count</span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                interval={0}
              />
              <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-black/95 border border-white/20 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-1">
                        <div className="font-bold text-white text-sm">{data.fullName}</div>
                        <div className="text-cyan-400 font-mono">
                          Remaining: <strong>{data.candidates}</strong> candidates
                        </div>
                        <div className="text-red-400 font-mono">
                          Dropped: <strong>{data.dropped}</strong> disqualified
                        </div>
                        <div className="text-emerald-400 font-mono">
                          Step Retention: <strong>{data.retention}%</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="candidates" radius={[8, 8, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={funnelColors[index % funnelColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Step-by-Step Funnel Stages Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Sequential Filter Audit Log</h2>
        </div>

        <div className="space-y-3">
          {funnelSteps.map((step, idx) => {
            const isLast = idx === funnelSteps.length - 1;
            const color = funnelColors[idx % funnelColors.length];

            return (
              <div
                key={step.step_index}
                className={`p-5 rounded-2xl border transition-all ${
                  isLast
                    ? 'bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : 'bg-surface/80 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Step Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm shrink-0"
                      style={{
                        backgroundColor: `${color}20`,
                        color: color,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      {step.step_index === 0 ? '0' : `F${step.step_index}`}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-white">{step.filter_name}</h3>
                        {isLast && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono uppercase tracking-wider font-semibold">
                            Final Shortlist
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8a8a93] mt-1">{step.description}</p>
                    </div>
                  </div>

                  {/* Right: Metrics Numbers */}
                  <div className="flex items-center gap-6 lg:justify-end shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-[#8a8a93] uppercase">Before</div>
                      <div className="text-sm font-semibold text-white font-mono">
                        {step.candidates_before}
                      </div>
                    </div>

                    <ArrowDown className="w-4 h-4 text-white/30 rotate-[-90deg] lg:rotate-0" />

                    <div className="text-right">
                      <div className="text-[10px] font-mono text-[#8a8a93] uppercase">Remaining</div>
                      <div
                        className="text-base font-extrabold font-mono"
                        style={{ color: color }}
                      >
                        {step.candidates_after}
                      </div>
                    </div>

                    <div className="text-right border-l border-white/10 pl-4 min-w-[90px]">
                      <div className="text-[10px] font-mono text-[#8a8a93] uppercase">Dropped</div>
                      <div className="text-xs font-semibold text-red-400 font-mono">
                        -{step.dropped_count}
                      </div>
                      <div className="text-[10px] text-[#8a8a93] font-mono">
                        ({step.retention_rate_pct}% kept)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar representation of candidates retained */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(2, (step.candidates_after / totalPool) * 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>

                  {/* Sample dropped reasons */}
                  {step.sample_dropped_reasons.length > 0 && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-[#8a8a93]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-zinc-400">Disqualification reason:</strong>{' '}
                        {step.sample_dropped_reasons[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
