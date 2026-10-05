import React from 'react';
import { BookOpen, ExternalLink, ShieldCheck, FileText, Code2, CheckCircle2 } from 'lucide-react';

export default function AboutView() {
  return (
    <div id="about" className="w-full bg-[#050505] text-[#f5f5f7] py-12 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/5">
      <div className="mb-8">
        <div className="label text-accent mb-1">METHODOLOGY & SCIENTIFIC SOURCES</div>
        <h2 className="text-3xl font-display font-bold">About the Project & Citations</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Methodology Card */}
        <div className="card p-6 border-white/10 bg-surface">
          <div className="flex items-center gap-2 mb-3 text-cyan-400">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-lg font-display font-semibold text-white">Detection & Tracking Methodology</h3>
          </div>
          <p className="text-xs text-[#8a8a93] leading-relaxed mb-4">
            Extreme atmospheric anomalies are defined as rare spatial excursions from the local climatological normal.
            We compute a 15-day circular rolling day-of-year climatology solely on historical training splits to prevent lookahead data leakage.
            Anomalous cells are clustered into discrete spatial entities per timestep using 2D connected components, and then linked temporally
            via Hungarian bipartite matching using a cost matrix balancing spatial IoU and Haversine distance.
          </p>
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-cyan-200">
            Split & Merge detection guarantees tracking integrity during cyclone bifurcations and frontal merges.
          </div>
        </div>

        {/* Data Sources Card */}
        <div className="card p-6 border-white/10 bg-surface">
          <div className="flex items-center gap-2 mb-3 text-emerald-400">
            <FileText className="w-5 h-5" />
            <h3 className="text-lg font-display font-semibold text-white">Datasets & Ground Truth Benchmarks</h3>
          </div>
          <ul className="space-y-3 text-xs text-[#8a8a93]">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-mono font-bold">•</span>
              <div>
                <strong className="text-white">ERA5 Reanalysis (Copernicus CDS):</strong> ECMWF atmospheric reanalysis on a 0.25° grid (1980–2023).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-mono font-bold">•</span>
              <div>
                <strong className="text-white">IMD Heatwave & Heavy Rainfall Rules:</strong> Official meteorological criteria (Temp &gt;= 40°C in plains, departure &gt;= 4.5°C; daily precipitation &gt;= 64.5 mm).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-mono font-bold">•</span>
              <div>
                <strong className="text-white">Synthetic Weather Engine:</strong> Physically-informed generator modeling solar seasonal cycles, monsoon troughs, orographic coastal rainfall, and injected moving Gaussian anomalies with known ground truth labels.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Citations and CLI Guide */}
      <div className="card p-6 border-white/10 bg-surface flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-display font-bold text-white mb-1">Production-Ready Autonomous CLI</h4>
          <p className="text-xs text-[#8a8a93]">
            Run all pipeline stages via <code className="text-accent bg-black/50 px-1.5 py-0.5 rounded font-mono">make all</code> or <code className="text-accent bg-black/50 px-1.5 py-0.5 rounded font-mono">python run.py all</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% CPU Compatible
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            No Credentials Required
          </span>
        </div>
      </div>
    </div>
  );
}
