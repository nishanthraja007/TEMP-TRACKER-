import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-black border-t border-white/5 py-8 text-center text-xs font-mono text-[#8a8a93]">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          AI-Driven Spatio-Temporal Tracking of Extreme Weather Anomalies
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cyan-400">Zero-Credential CPU Pipeline</span>
          <span>•</span>
          <span>South Asia Domain (5–40°N, 60–100°E)</span>
        </div>
      </div>
    </footer>
  );
}
