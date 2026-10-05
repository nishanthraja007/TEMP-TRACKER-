import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Globe from './Globe';
import { EventTrack } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  tracks?: EventTrack[];
  onOpenDashboard: () => void;
}

const WORDS = [
  { text: 'AI-DRIVEN', depth: 40, yPercent: -15, blur: 2 },
  { text: 'SPATIO-TEMPORAL', depth: 80, yPercent: -30, blur: 0 },
  { text: 'WEATHER TRACKING', depth: 120, yPercent: -45, blur: 1 },
];

export default function Hero({ tracks = [], onOpenDashboard }: HeroProps) {
  const root = useRef<HTMLDivElement>(null);
  const globeWrapper = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    const ctx = gsap.context(() => {
      // Animate 3D text layers
      gsap.utils.toArray<HTMLElement>('.hero-layer').forEach((el, i) => {
        const item = WORDS[i];
        gsap.to(el, {
          yPercent: item.yPercent,
          z: item.depth,
          rotateX: 6 * (i + 1),
          filter: `blur(${item.blur}px)`,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });

      // Globe parallax fade & scale
      if (globeWrapper.current) {
        gsap.to(globeWrapper.current, {
          yPercent: 20,
          scale: 0.9,
          opacity: 0.6,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-[160vh] bg-black text-[#f5f5f7]" style={{ perspective: 1200 }}>
      {/* Pinned 3D Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* Interactive 3D Globe Backdrop */}
        <div ref={globeWrapper} className="absolute inset-0 flex items-center justify-center pointer-events-auto opacity-75">
          <div className="w-[85vw] max-w-[800px] h-[85vh] max-h-[800px]">
            <Globe tracks={tracks} />
          </div>
        </div>

        {/* Ambient Glow Gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Hero 3D Typography */}
        <div className="relative z-10 text-center flex flex-col items-center pointer-events-none select-none px-4" style={{ transformStyle: 'preserve-3d' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-black/60 backdrop-blur-md mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-cyan-300 uppercase">
              South Asia Extreme Weather Anomaly Engine
            </span>
          </div>

          {WORDS.map((w, idx) => (
            <h1
              key={w.text}
              className="hero-layer font-display text-[7vw] sm:text-[6.5vw] md:text-[5.5vw] leading-[0.95] font-extrabold tracking-tight transition-transform duration-75 text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#f5f5f7] to-[#8a8a93]"
              style={{
                transform: `translateZ(${idx * 30}px)`,
                textShadow: '0 20px 40px rgba(0,0,0,0.8)',
              }}
            >
              {w.text}
            </h1>
          ))}

          <p className="mt-6 max-w-xl text-sm sm:text-base text-[#8a8a93] font-body leading-relaxed pointer-events-auto backdrop-blur-sm bg-black/40 p-2 rounded-xl">
            Detecting heatwaves, extreme monsoon precipitation, and cyclonic trajectories in gridded weather data.
            Real-time Hungarian tracking & ConvLSTM 1-3 day ahead forecasting.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
            <button
              onClick={onOpenDashboard}
              className="px-6 py-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-sm transition-all shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.7)] hover:scale-105 active:scale-95"
            >
              Open Live Dashboard
            </button>
            <a
              href="#storytelling"
              className="px-6 py-3 rounded-full border border-white/10 hover:border-white/20 bg-surface/80 hover:bg-surface2 text-[#f5f5f7] text-sm font-medium transition-all backdrop-blur-md"
            >
              Explore Storyline ↓
            </a>
          </div>
        </div>

        {/* Live Counters Bottom Strip */}
        <div className="absolute bottom-6 left-0 right-0 max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 z-20 pointer-events-auto">
          <div className="card p-3 text-center border-white/5 bg-black/40 backdrop-blur-md">
            <div className="label text-[#8a8a93] text-[10px]">Active Tracks</div>
            <div className="num text-xl font-bold text-accent">{tracks.length || 8}</div>
          </div>
          <div className="card p-3 text-center border-white/5 bg-black/40 backdrop-blur-md">
            <div className="label text-[#8a8a93] text-[10px]">Detection F1</div>
            <div className="num text-xl font-bold text-emerald-400">0.5759</div>
          </div>
          <div className="card p-3 text-center border-white/5 bg-black/40 backdrop-blur-md">
            <div className="label text-[#8a8a93] text-[10px]">Track Match Rate</div>
            <div className="num text-xl font-bold text-cyan-400">100%</div>
          </div>
          <div className="card p-3 text-center border-white/5 bg-black/40 backdrop-blur-md">
            <div className="label text-[#8a8a93] text-[10px]">Forecast Lead</div>
            <div className="num text-xl font-bold text-purple-400">1 – 3 Days</div>
          </div>
        </div>
      </div>
    </section>
  );
}
