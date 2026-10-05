import React, { useState } from 'react';
import {
  Sparkles,
  Briefcase,
  DollarSign,
  Globe2,
  CheckCircle2,
  Star,
  Send,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpDown,
  Search,
  X,
  FileCheck,
} from 'lucide-react';
import { useMatch } from './MatchContext';
import { InvestorCandidate, MatchResultItem } from '../../types';

export default function MatchingResultsView() {
  const { matches, profile, funnelSteps, setActiveTab } = useMatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'overall' | 'ticket' | 'semantic'>('overall');
  const [selectedCandidate, setSelectedCandidate] = useState<MatchResultItem | null>(null);
  const [introSentId, setIntroSentId] = useState<string | null>(null);
  const [introNote, setIntroNote] = useState('');

  // Filtering & Sorting
  const filteredMatches = matches
    .filter((m) => {
      const q = searchTerm.toLowerCase();
      return (
        m.candidate.firm.toLowerCase().includes(q) ||
        m.candidate.partner_name.toLowerCase().includes(q) ||
        m.candidate.thesis.toLowerCase().includes(q) ||
        m.candidate.focus_industries.some((ind) => ind.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'ticket') {
        return b.candidate.max_check_usd - a.candidate.max_check_usd;
      }
      if (sortBy === 'semantic') {
        return b.scores.semantic_score - a.scores.semantic_score;
      }
      return b.scores.overall_score - a.scores.overall_score;
    });

  const finalCount = funnelSteps[funnelSteps.length - 1]?.candidates_after || matches.length;

  const handleSendIntro = (id: string) => {
    setIntroSentId(id);
    setTimeout(() => {
      setSelectedCandidate(null);
      setIntroNote('');
    }, 1500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI MATCHMAKING ENGINE OUTPUT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Matching Results
          </h1>
          <p className="text-sm text-[#8a8a93] mt-1 max-w-2xl">
            Ranked institutional capital partners and venture funds vetted against {profile.startup_name}&apos;s profile, stage, domain, and AI semantic thesis compatibility.
          </p>
        </div>

        {/* Funnel Telemetry Quick-Jump */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('funnel')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-2 transition-all border border-white/10"
          >
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit Funnel ({finalCount} of 1,000 Passed)</span>
          </button>
        </div>
      </div>

      {/* Target Startup Summary Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-surface to-black border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400 font-mono">
            {profile.startup_name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{profile.startup_name}</div>
            <div className="text-[#8a8a93]">
              {profile.industry} • {profile.stage} • Target Raise: ${(profile.target_funding_usd / 1e6).toFixed(1)}M
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#8a8a93]">Top Match Fit:</span>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-bold">
            {matches[0]?.scores.overall_score || 95.0}% Compatibility
          </span>
          <button
            onClick={() => setActiveTab('profile')}
            className="text-cyan-400 hover:underline ml-2"
          >
            Refine Profile
          </button>
        </div>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8a8a93] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search firm, partner, sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <ArrowUpDown className="w-4 h-4 text-[#8a8a93]" />
          <span className="text-xs text-[#8a8a93]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
          >
            <option value="overall">Overall Match Score (%)</option>
            <option value="semantic">AI Semantic Fit</option>
            <option value="ticket">Check Size Capacity</option>
          </select>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-surface/40 border border-white/10 space-y-3">
            <Filter className="w-10 h-10 text-[#8a8a93] mx-auto" />
            <h3 className="text-lg font-bold text-white">No candidates matched the current search query</h3>
            <p className="text-xs text-[#8a8a93]">
              Try adjusting your search terms or lowering the semantic threshold in the funnel settings.
            </p>
          </div>
        ) : (
          filteredMatches.map((item) => {
            const { candidate, scores, why_matched, rank } = item;

            return (
              <div
                key={candidate.id}
                className="p-6 rounded-3xl bg-surface/80 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10 space-y-5"
              >
                {/* Top Row: Rank, Firm Name, Overall Score Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-sm text-cyan-400 shrink-0">
                      #{rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          {candidate.firm}
                        </h2>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {candidate.rating}
                        </span>
                      </div>
                      <div className="text-xs text-[#8a8a93] mt-0.5">
                        Lead Partner: <strong className="text-zinc-300">{candidate.partner_name}</strong> •{' '}
                        {candidate.target_geographies.join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Overall Match Circle / Pill */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-[#8a8a93] uppercase">AI Match Score</div>
                      <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
                        {scores.overall_score}%
                      </div>
                    </div>

                    {/* All 5 filters passed badge */}
                    <div className="hidden md:flex flex-col items-end">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        PASSED 5/5 GATES
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/5">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-[10px] font-mono text-[#8a8a93]">Domain Fit</div>
                    <div className="text-xs font-bold text-cyan-400 font-mono mt-0.5">{scores.industry_score}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-[10px] font-mono text-[#8a8a93]">Stage Fit</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{scores.stage_score}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-[10px] font-mono text-[#8a8a93]">Ticket Fit</div>
                    <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">{scores.ticket_fit_score}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-[10px] font-mono text-[#8a8a93]">Geography</div>
                    <div className="text-xs font-bold text-purple-400 font-mono mt-0.5">{scores.geo_score}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-mono text-[#8a8a93]">AI Semantic Fit</div>
                    <div className="text-xs font-bold text-pink-400 font-mono mt-0.5">{scores.semantic_score}%</div>
                  </div>
                </div>

                {/* Investment Thesis & Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1.5">
                    <div className="text-[11px] font-mono text-[#8a8a93] uppercase">Fund Investment Thesis</div>
                    <p className="text-zinc-300 leading-relaxed font-sans">{candidate.thesis}</p>
                  </div>

                  <div className="space-y-2 border-l border-white/5 md:pl-4">
                    <div>
                      <div className="text-[10px] font-mono text-[#8a8a93] uppercase">Typical Check Size</div>
                      <div className="text-white font-mono font-bold mt-0.5">
                        ${(candidate.min_check_usd / 1e3).toFixed(0)}k – ${(candidate.max_check_usd / 1e6).toFixed(1)}M
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-[#8a8a93] uppercase">Notable Co-Investments</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {candidate.key_investments.map((co) => (
                          <span
                            key={co}
                            className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-zinc-300 font-mono"
                          >
                            {co}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why You Matched (AI Explanation) */}
                <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="text-cyan-300 font-semibold">AI Match Rationale: </strong>
                    <span className="text-zinc-300">{why_matched}</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {candidate.focus_industries.map((ind) => (
                      <span
                        key={ind}
                        className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-[#8a8a93]"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCandidate(item)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>View Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedCandidate(item)}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
                    >
                      <Send className="w-3.5 h-3.5 text-black" />
                      <span>Request Intro</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Partner Dossier & Intro Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-900 border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400 font-mono text-base">
                #{selectedCandidate.rank}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">{selectedCandidate.candidate.firm}</h3>
                <div className="text-xs text-[#8a8a93]">
                  Managing Partner: <strong className="text-white">{selectedCandidate.candidate.partner_name}</strong>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8a8a93]">Investment Check Scope:</span>
                <span className="font-mono text-white font-bold">
                  ${(selectedCandidate.candidate.min_check_usd / 1e3).toFixed(0)}k - $
                  {(selectedCandidate.candidate.max_check_usd / 1e6).toFixed(1)}M USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a8a93]">Estimated Dry Powder:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ${(selectedCandidate.candidate.dry_powder_usd / 1e6).toFixed(0)}M Available
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a8a93]">Active Portfolio Scale:</span>
                <span className="font-mono text-white">
                  {selectedCandidate.candidate.portfolio_count} Companies
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-[#8a8a93] uppercase block">
                Draft Direct Introduction Note to {selectedCandidate.candidate.partner_name}:
              </label>
              <textarea
                rows={3}
                value={introNote}
                onChange={(e) => setIntroNote(e.target.value)}
                placeholder={`Dear ${selectedCandidate.candidate.partner_name}, I saw your thesis on ${selectedCandidate.candidate.focus_industries[0]} and would love to share how ${profile.startup_name} is addressing this space...`}
                className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            {introSentId === selectedCandidate.candidate.id ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Introduction inquiry and pitch deck dispatched to partner inbox!</span>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendIntro(selectedCandidate.candidate.id)}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Send className="w-3.5 h-3.5 text-black" />
                  <span>Send Pitch Brief</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
