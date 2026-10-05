import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Database, Zap, Navigation, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STORIES = [
  {
    id: 'data',
    badge: 'STAGE 01',
    title: 'Multi-Variate Atmospheric Ingestion',
    icon: Database,
    description:
      'Continuous assimilation of ERA5 atmospheric reanalysis across South Asia (5°-40°N, 60°-100°E) across 6 interconnected variables: 2m Temperature, Precipitation, 10m U/V Wind Vectors, Mean Sea Level Pressure, and Relative Humidity.',
    highlight: 'Leakage-Free 15-day Circular Climatology & Z-Scores',
    graphicType: 'grid',
  },
  {
    id: 'detection',
    badge: 'STAGE 02',
    title: 'Extreme Anomaly Extraction',
    icon: Zap,
    description:
      'Multi-tiered anomaly detection contrasting IMD Heatwave thresholds, Isolation Forests on multi-variable gradient fields, ConvLSTM reconstruction error, and deep U-Net semantic segmentation trained with compound Dice + Focal loss.',
    highlight: 'F1 Score improved from 0.0146 (baseline) to 0.5759 (multi-variable ML)',
    graphicType: 'cells',
  },
  {
    id: 'tracking',
    badge: 'STAGE 03',
    title: 'Spatio-Temporal Hungarian Tracking',
    icon: Navigation,
    description:
      'Connected anomaly components are matched across temporal slices using Hungarian bipartite optimization with spatial IoU and Haversine distance penalties. Explicit topological handlers manage event births, deaths, splits, and merges.',
    highlight: 'Kalman filtering smooths 2D trajectory & predicts propagation velocity',
    graphicType: 'track',
  },
  {
    id: 'forecast',
    badge: 'STAGE 04',
    title: 'ConvLSTM Deep Forecasting',
    icon: Sparkles,
    description:
      'Autoregressive recurrent convolutional network predicts anomaly displacement and intensity maps up to 3 days ahead, consistently outperforming Persistence and Climatology baselines across lead times.',
    highlight: 'Day-1 RMSE 0.5571 vs Persistence 0.7057 (21% error reduction)',
    graphicType: 'forecast',
  },
];

export default function StorySections() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.story-pin-card');
      
      cards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: 'top top',
          pin: true,
          pinSpacing: false,
          snap: 1 / (cards.length - 1),
        });

        // Fade in graphics
        gsap.fromTo(
          card.querySelector('.graphic-box'),
          { scale: 0.85, opacity: 0.3 },
          {
            scale: 1,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top center',
              end: 'bottom center',
              scrub: true,
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div id="storytelling" ref={containerRef} className="relative bg-black text-[#f5f5f7]">
      {STORIES.map((story, idx) => {
        const Icon = story.icon;
        return (
          <section
            key={story.id}
            className="story-pin-card h-screen w-full flex items-center justify-center p-6 border-b border-white/5 bg-black"
          >
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Story Narrative Card */}
              <div className="lg:col-span-6 card p-8 sm:p-10 border-white/10 bg-surface/70 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {story.badge}
                  </span>
                  <span className="text-[11px] font-mono text-[#8a8a93]">PHASE {idx + 1} OF 4</span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#f5f5f7]">
                    {story.title}
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-[#8a8a93] leading-relaxed mb-6 font-body">
                  {story.description}
                </p>

                <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <div className="text-xs sm:text-sm font-mono text-cyan-200">
                    {story.highlight}
                  </div>
                </div>
              </div>

              {/* Interactive Visual Representation */}
              <div className="lg:col-span-6 flex items-center justify-center">
                <div className="graphic-box w-full aspect-square max-w-[460px] card p-6 border-white/10 bg-surface2/60 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
                  
                  {/* Background Grid Pattern */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:16px_16px]" />

                  <div className="relative z-10 flex justify-between items-center text-xs font-mono text-[#8a8a93]">
                    <span>STAGE VISUALIZATION</span>
                    <span className="text-cyan-400">ACTIVE COMPUTATION</span>
                  </div>

                  {/* Stage-specific Visual Canvas */}
                  <div className="relative z-10 my-auto flex items-center justify-center">
                    {story.graphicType === 'grid' && (
                      <div className="grid grid-cols-6 gap-2 w-64 h-64 p-4 rounded-xl border border-white/10 bg-black/40">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div
                            key={i}
                            className="rounded-sm border border-cyan-500/20 bg-cyan-500/10 animate-pulse"
                            style={{ animationDelay: `${(i % 6) * 150}ms` }}
                          />
                        ))}
                      </div>
                    )}

                    {story.graphicType === 'cells' && (
                      <div className="relative w-64 h-64 rounded-xl border border-white/10 bg-black/40 p-4 grid grid-cols-5 gap-2">
                        {Array.from({ length: 25 }).map((_, i) => {
                          const isAnom = [6, 7, 11, 12, 13, 17].includes(i);
                          return (
                            <div
                              key={i}
                              className={`rounded transition-all duration-500 ${
                                isAnom
                                  ? 'bg-[#ff5a36] shadow-[0_0_15px_#ff5a36] border border-orange-400'
                                  : 'bg-white/5 border border-white/5'
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}

                    {story.graphicType === 'track' && (
                      <div className="relative w-64 h-64 rounded-xl border border-white/10 bg-black/40 p-4 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                          <defs>
                            <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#22d3ee" />
                              <stop offset="100%" stopColor="#ff5a36" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 30,150 Q 80,120 110,80 T 170,30"
                            fill="none"
                            stroke="url(#trackGrad)"
                            strokeWidth="3"
                            strokeDasharray="6 4"
                          />
                          <circle cx="30" cy="150" r="5" fill="#22d3ee" />
                          <circle cx="110" cy="80" r="6" fill="#f59e0b" />
                          <circle cx="170" cy="30" r="7" fill="#ff5a36" className="animate-ping opacity-75" />
                          <circle cx="170" cy="30" r="5" fill="#ff5a36" />
                        </svg>
                      </div>
                    )}

                    {story.graphicType === 'forecast' && (
                      <div className="flex gap-3 items-center justify-center">
                        {['Day +1', 'Day +2', 'Day +3'].map((lbl, idx) => (
                          <div key={lbl} className="card p-3 border-white/10 bg-black/60 text-center w-20">
                            <div className="text-[10px] font-mono text-cyan-300">{lbl}</div>
                            <div className="w-12 h-12 mx-auto my-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                              <span className="text-xs font-mono font-bold text-white">{(0.55 - idx * 0.01).toFixed(2)}</span>
                            </div>
                            <div className="text-[8px] font-mono text-[#8a8a93]">RMSE (z)</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 flex justify-between items-center text-[10px] font-mono text-[#8a8a93] pt-4 border-t border-white/5">
                    <span>STATUS: CONVERGED</span>
                    <span className="text-emerald-400">LATENCY: &lt; 30MS</span>
                  </div>
                </div>
              </div>

            </div>
          </section>
        );
      })}
    </div>
  );
}
