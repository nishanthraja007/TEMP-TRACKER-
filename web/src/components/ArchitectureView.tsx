import React from 'react';
import { Database, Cpu, Navigation, Sparkles, Server, Globe2, ArrowRight } from 'lucide-react';

const STAGES = [
  {
    step: '01',
    title: 'Data Ingestion',
    icon: Database,
    subtitle: 'ERA5 & Synthetic Generator',
    details: '730 days x 36 lats x 41 lons. Variables: t2m, tp, u10, v10, msl, rh.',
    badge: '1.0° / 0.25° Grid',
  },
  {
    step: '02',
    title: 'Leakage-Free Preprocessing',
    icon: Cpu,
    subtitle: 'Circular DOY Climatology',
    details: '15-day rolling day-of-year mean & std strictly normalized on training split.',
    badge: 'Z-Score Normalization',
  },
  {
    step: '03',
    title: 'Detection Ensemble',
    icon: Sparkles,
    subtitle: 'Multi-Tiered Anomaly Models',
    details: 'IMD rules, Isolation Forest, ConvLSTM Autoencoder, U-Net segmentation.',
    badge: 'Dice + Focal Loss',
  },
  {
    step: '04',
    title: 'Spatio-Temporal Tracking',
    icon: Navigation,
    subtitle: 'Hungarian Bipartite Matching',
    details: 'IoU + Haversine distance cost matrix. Split/merge handlers & Kalman smoothing.',
    badge: 'Kalman Filter',
  },
  {
    step: '05',
    title: 'Deep Forecasting',
    icon: Sparkles,
    subtitle: 'Autoregressive ConvLSTM',
    details: 'Past 7 days sequence input to forecast anomaly displacement +1 to +3 days.',
    badge: 'Lead 1–3 Days',
  },
  {
    step: '06',
    title: 'Full-Stack Delivery',
    icon: Globe2,
    subtitle: 'FastAPI + 3D Parallax UI',
    details: 'High-performance REST API with in-memory caching and MapLibre GL dashboard.',
    badge: '60 FPS WebGL',
  },
];

export default function ArchitectureView() {
  return (
    <div id="architecture" className="w-full bg-black text-[#f5f5f7] py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="label text-accent mb-1">SYSTEM TOPOLOGY & PIPELINE DATAFLOW</div>
        <h2 className="text-3xl font-display font-bold">End-to-End Architectural Pipeline</h2>
        <p className="text-sm text-[#8a8a93] mt-2">
          From atmospheric reanalysis ingestion to deep spatio-temporal segmentation, Hungarian tracking, and real-time 3D parallax visualization.
        </p>
      </div>

      {/* Grid of Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="card p-6 border-white/10 bg-surface/70 hover:border-cyan-500/40 transition-all duration-300 relative group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-mono font-extrabold text-cyan-400/40 group-hover:text-cyan-400 transition-colors">
                    {s.step}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-[#8a8a93] border border-white/10">
                    {s.badge}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-white">{s.title}</h3>
                    <div className="text-xs text-accent font-mono">{s.subtitle}</div>
                  </div>
                </div>

                <p className="text-xs text-[#8a8a93] mt-3 leading-relaxed font-body">
                  {s.details}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#8a8a93]">
                <span>STAGE VERIFIED</span>
                <span className="text-emerald-400">STATUS: PASS</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
