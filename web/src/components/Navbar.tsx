import React from 'react';
import {
  Sparkles,
  Wind,
  Layers,
  Activity,
  UserPlus,
  Filter,
  FileText,
  Terminal,
  Compass,
} from 'lucide-react';

interface NavbarProps {
  appMode: 'matching' | 'weather';
  setAppMode: (mode: 'matching' | 'weather') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ appMode, setAppMode, activeTab, setActiveTab }: NavbarProps) {
  const matchingNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'profile', label: 'Entrepreneur Profile', icon: FileText },
    { id: 'funnel', label: 'Candidates Remaining', icon: Filter },
    { id: 'matching', label: 'Matching Results', icon: Sparkles },
    { id: 'register', label: 'Registration Screen', icon: UserPlus },
    { id: 'architecture', label: 'System Architecture', icon: Terminal },
  ];

  const weatherNavItems = [
    { id: 'hero', label: 'Overview', icon: Wind },
    { id: 'weather-dashboard', label: 'Live Map', icon: Activity },
    { id: 'forecast', label: 'Forecasting', icon: Sparkles },
    { id: 'metrics', label: 'Evaluation', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setActiveTab(appMode === 'matching' ? 'dashboard' : 'hero')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(34,211,238,0.5)] group-hover:scale-105 transition-transform">
              {appMode === 'matching' ? (
                <Sparkles className="w-4 h-4 text-black" />
              ) : (
                <Wind className="w-4 h-4 text-black" />
              )}
            </div>
            <div>
              <div className="font-display font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                {appMode === 'matching' ? 'VENTURE-MATCH AI' : 'ATMO-TRACK'}
                <span className="text-cyan-400 text-xs font-mono font-normal">v2.4</span>
              </div>
              <div className="text-[10px] font-mono text-[#8a8a93] tracking-widest uppercase">
                {appMode === 'matching' ? 'Entrepreneur Matching Engine' : 'Weather Anomaly AI'}
              </div>
            </div>
          </div>

          {/* Mode Switcher Pill */}
          <div className="hidden lg:flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono">
            <button
              onClick={() => {
                setAppMode('matching');
                setActiveTab('dashboard');
              }}
              className={`px-3 py-1 rounded-xl transition-all ${
                appMode === 'matching'
                  ? 'bg-cyan-500 text-black font-bold shadow-md'
                  : 'text-[#8a8a93] hover:text-white'
              }`}
            >
              Entrepreneur AI Match
            </button>
            <button
              onClick={() => {
                setAppMode('weather');
                setActiveTab('hero');
              }}
              className={`px-3 py-1 rounded-xl transition-all ${
                appMode === 'weather'
                  ? 'bg-cyan-500 text-black font-bold shadow-md'
                  : 'text-[#8a8a93] hover:text-white'
              }`}
            >
              Weather Tracking
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full border border-white/10 bg-surface">
          {(appMode === 'matching' ? matchingNavItems : weatherNavItems).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  const el = document.getElementById(item.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-inner text-cyan-300'
                    : 'text-[#8a8a93] hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold">ENGINE ONLINE</span>
          </div>

          {/* Mobile Switcher */}
          <button
            onClick={() => {
              const newMode = appMode === 'matching' ? 'weather' : 'matching';
              setAppMode(newMode);
              setActiveTab(newMode === 'matching' ? 'dashboard' : 'hero');
            }}
            className="lg:hidden px-2.5 py-1 rounded-lg bg-white/10 text-white text-[11px] font-mono"
          >
            Switch Project
          </button>
        </div>
      </div>
    </header>
  );
}
