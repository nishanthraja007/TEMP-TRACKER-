import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Database,
  Monitor,
  Terminal,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  GitBranch,
  Filter,
  Users,
  Code2,
} from 'lucide-react';
import { useMatch } from './MatchContext';

interface NodeDetail {
  title: string;
  tier: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  algorithm: string;
  latency: string;
}

const ARCHITECTURE_NODES: Record<string, NodeDetail> = {
  client_profile: {
    title: 'Entrepreneur Profile Form',
    tier: 'Tier 1: Presentation (Frontend)',
    purpose: 'Collects startup domain, stage, ticket size, valuation, and executive pitch summary.',
    inputs: ['Founder inputs', 'Pitch narrative', 'Traction KPIs'],
    outputs: ['JSON EntrepreneurProfile model payload'],
    algorithm: 'React Hook Form with client-side Pydantic schema validation.',
    latency: '< 5ms',
  },
  client_funnel: {
    title: 'Candidates Remaining After Each Filter',
    tier: 'Tier 1: Presentation (Frontend)',
    purpose: 'Visualizes candidate retention and drop-off counts through 5 sequential filtering stages.',
    inputs: ['FunnelStep[] telemetry array from API'],
    outputs: ['Waterfall chart, retention bars, drop reasons'],
    algorithm: 'Recharts Responsive SVG rendering with dynamic threshold reactivity.',
    latency: '< 16ms (60 FPS)',
  },
  api_gateway: {
    title: 'FastAPI REST Orchestrator',
    tier: 'Tier 2: API & Gateway',
    purpose: 'High-performance ASGI endpoints routing auth, profile persistence, and matching execution.',
    inputs: ['HTTP POST /api/matching/run', 'Profile updates', 'Registration'],
    outputs: ['MatchResponse with ranked results & funnel telemetry'],
    algorithm: 'Asynchronous event loop with Pydantic v2 serialization.',
    latency: '3.2ms execution',
  },
  filter_pipeline: {
    title: '5-Stage Cascade Filtering Engine',
    tier: 'Tier 3: AI & Filtering Engine',
    purpose: 'Applies sequential boolean gates (Domain, Stage, Ticket Size, Geography) tracking remaining pool.',
    inputs: ['1,000 Candidate Pool', 'FilterCriteria bounds'],
    outputs: ['Filtered shortlist + Funnel retention telemetry'],
    algorithm: 'Vectorized set intersection and range boundary checks.',
    latency: '4.8ms',
  },
  semantic_ai: {
    title: 'AI Semantic Vectorizer & Scorer',
    tier: 'Tier 3: AI & Filtering Engine',
    purpose: 'Calculates cosine similarity between startup pitch narrative and 1,000 VC investment theses.',
    inputs: ['Startup pitch text', 'Investor thesis corpus'],
    outputs: ['Semantic score (0-100%) and composite match breakdown'],
    algorithm: 'TF-IDF term-frequency dot product with multi-attribute weighted combination.',
    latency: '6.4ms',
  },
  data_store: {
    title: 'Candidate Pool & Profile Database',
    tier: 'Tier 4: Data & Persistence',
    purpose: 'Indexes 1,000+ venture funds, angel syndicates, and entrepreneur submissions.',
    inputs: ['Investor profiles, AUM, ticket bounds, portfolio history'],
    outputs: ['Deterministic candidate objects'],
    algorithm: 'In-Memory Indexed Datasets & JSON Document Store.',
    latency: '< 1ms',
  },
};

export default function SystemArchitectureView() {
  const [selectedNodeKey, setSelectedNodeKey] = useState<string>('filter_pipeline');
  const selectedNode = ARCHITECTURE_NODES[selectedNodeKey];
  const { setActiveTab } = useMatch();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>SYSTEM DESIGN & DATA PIPELINE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            System Architecture
          </h1>
          <p className="text-sm text-[#8a8a93] mt-1 max-w-2xl">
            End-to-end technical blueprint for the AI-Powered Entrepreneur-Investor Matching Platform, detailing data flow from registration and profile intake to multi-gate cascade filtering and vector scoring.
          </p>
        </div>

        {/* Quick Jump */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('funnel')}
            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Inspect Filter Funnel</span>
          </button>
        </div>
      </div>

      {/* Main Architectural Flow Diagram */}
      <div className="p-8 rounded-3xl bg-surface/80 border border-white/10 space-y-8 relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">4-Tier System Architectural Blueprint</h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            End-to-End Latency &lt; 20ms
          </span>
        </div>

        {/* Interactive Grid of Architectural Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Tier 1: Presentation */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>1. Presentation Tier</span>
            </div>

            <div
              onClick={() => setSelectedNodeKey('client_profile')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedNodeKey === 'client_profile'
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : 'bg-black/50 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-xs font-bold text-white">Entrepreneur Profile Form</div>
              <div className="text-[10px] text-[#8a8a93] mt-1">Startup intake, pitch text, capital targets</div>
              <span className="inline-block mt-2 text-[10px] font-mono text-cyan-400">React 18 + TS</span>
            </div>

            <div
              onClick={() => setSelectedNodeKey('client_funnel')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedNodeKey === 'client_funnel'
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : 'bg-black/50 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-xs font-bold text-white">Candidates Remaining After Each Filter</div>
              <div className="text-[10px] text-[#8a8a93] mt-1">Cascade funnel visualization & slider controls</div>
              <span className="inline-block mt-2 text-[10px] font-mono text-cyan-400">Recharts + SVG</span>
            </div>

            <div
              onClick={() => setSelectedNodeKey('client_profile')}
              className="p-4 rounded-2xl bg-black/30 border border-white/5 opacity-80"
            >
              <div className="text-xs font-bold text-zinc-300">Registration & Dashboard</div>
              <div className="text-[10px] text-[#8a8a93] mt-1">Role onboarding & executive cockpit</div>
            </div>
          </div>

          {/* Tier 2: API Gateway */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. API & Gateway Tier</span>
            </div>

            <div
              onClick={() => setSelectedNodeKey('api_gateway')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all h-[calc(100%-2rem)] flex flex-col justify-between ${
                selectedNodeKey === 'api_gateway'
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : 'bg-black/50 border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">FastAPI ASGI Gateway</div>
                <div className="text-[10px] text-[#8a8a93] mt-1">
                  Routes REST requests, deserializes Pydantic schemas, handles CORS, and invokes the matching service.
                </div>

                <div className="mt-4 space-y-1.5 font-mono text-[10px] text-zinc-400">
                  <div className="p-1 rounded bg-black/40 border border-white/5">POST /api/matching/run</div>
                  <div className="p-1 rounded bg-black/40 border border-white/5">GET /api/matching/profile</div>
                  <div className="p-1 rounded bg-black/40 border border-white/5">POST /api/matching/register</div>
                  <div className="p-1 rounded bg-black/40 border border-white/5">GET /api/matching/dashboard</div>
                </div>
              </div>

              <span className="text-[10px] font-mono text-cyan-400 mt-4 block">Uvicorn + Pydantic v2</span>
            </div>
          </div>

          {/* Tier 3: AI & Filter Pipeline */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. AI & Matching Engine</span>
            </div>

            <div
              onClick={() => setSelectedNodeKey('filter_pipeline')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedNodeKey === 'filter_pipeline'
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : 'bg-black/50 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-xs font-bold text-white">Cascade Filtering Pipeline</div>
              <div className="text-[10px] text-[#8a8a93] mt-1">
                F1: Industry Domain
                <br />
                F2: Stage Mandate
                <br />
                F3: Check Size
                <br />
                F4: Geography
              </div>
              <span className="inline-block mt-2 text-[10px] font-mono text-emerald-400">NumPy Vectorized</span>
            </div>

            <div
              onClick={() => setSelectedNodeKey('semantic_ai')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedNodeKey === 'semantic_ai'
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : 'bg-black/50 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-xs font-bold text-white">AI Semantic Synergy Scorer</div>
              <div className="text-[10px] text-[#8a8a93] mt-1">
                TF-IDF text similarity + multi-attribute weighted score (&gt; 65% cutoff)
              </div>
              <span className="inline-block mt-2 text-[10px] font-mono text-pink-400">Cosine Similarity</span>
            </div>
          </div>

          {/* Tier 4: Data & Persistence */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>4. Data & Persistence</span>
            </div>

            <div
              onClick={() => setSelectedNodeKey('data_store')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all h-[calc(100%-2rem)] flex flex-col justify-between ${
                selectedNodeKey === 'data_store'
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : 'bg-black/50 border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">Candidate Pool & Profile DB</div>
                <div className="text-[10px] text-[#8a8a93] mt-1">
                  Stores 1,000+ indexed venture funds, angel syndicates, thesis descriptions, and portfolio telemetry.
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] font-mono text-[#8a8a93] block">Pool Count:</span>
                    <strong className="text-white font-mono">1,000 Candidates</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] font-mono text-[#8a8a93] block">Sectors Covered:</span>
                    <strong className="text-white font-mono">8 Core Tech Sectors</strong>
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono text-purple-400 mt-4 block">In-Memory JSON Store</span>
            </div>
          </div>
        </div>

        {/* Selected Component Deep-Dive Card */}
        {selectedNode && (
          <div className="p-6 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  {selectedNode.tier}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">{selectedNode.title}</h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                SLA: {selectedNode.latency}
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">{selectedNode.purpose}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-3 rounded-xl bg-surface border border-white/5">
                <span className="text-[10px] font-mono text-[#8a8a93] uppercase block mb-1">
                  Inputs & Data Flow:
                </span>
                <ul className="space-y-1 text-zinc-300 list-disc list-inside text-[11px]">
                  {selectedNode.inputs.map((inp) => (
                    <li key={inp}>{inp}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-white/5">
                <span className="text-[10px] font-mono text-[#8a8a93] uppercase block mb-1">
                  Outputs & Contracts:
                </span>
                <ul className="space-y-1 text-cyan-300 list-disc list-inside text-[11px]">
                  {selectedNode.outputs.map((out) => (
                    <li key={out}>{out}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-white/5">
                <span className="text-[10px] font-mono text-[#8a8a93] uppercase block mb-1">
                  Implementation Algorithm:
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">{selectedNode.algorithm}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Pipeline Mathematical Logic Breakdown */}
      <div className="p-6 rounded-3xl bg-surface/80 border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Cascading Gate Mathematical Logic</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono text-cyan-400 font-bold">GATE 1: DOMAIN</span>
            <div className="font-mono text-zinc-300 text-[11px]">
              I_startup ∈ I_investor
            </div>
            <p className="text-[11px] text-[#8a8a93]">Strict set membership against fund investment charter.</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono text-emerald-400 font-bold">GATE 2: STAGE</span>
            <div className="font-mono text-zinc-300 text-[11px]">
              S_startup ∩ S_investor ≠ ∅
            </div>
            <p className="text-[11px] text-[#8a8a93]">Ensures stage allocation criteria overlap.</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono text-amber-400 font-bold">GATE 3: TICKET SIZE</span>
            <div className="font-mono text-zinc-300 text-[11px]">
              C_min ≤ T_req ≤ 1.5 · C_max
            </div>
            <p className="text-[11px] text-[#8a8a93]">Bound check ensuring round lead check feasibility.</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono text-purple-400 font-bold">GATE 4: GEOGRAPHY</span>
            <div className="font-mono text-zinc-300 text-[11px]">
              G_startup ∩ G_investor ≠ ∅
            </div>
            <p className="text-[11px] text-[#8a8a93]">Verifies cross-border or local legal jurisdiction.</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono text-pink-400 font-bold">GATE 5: AI SEMANTIC</span>
            <div className="font-mono text-zinc-300 text-[11px]">
              cos(v_pitch, v_thesis) ≥ θ_cutoff
            </div>
            <p className="text-[11px] text-[#8a8a93]">Vector cosine similarity against investment theses.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
