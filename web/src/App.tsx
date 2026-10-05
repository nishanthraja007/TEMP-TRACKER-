import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StorySections from './components/StorySections';
import WeatherDashboard from './components/Dashboard';
import ForecastView from './components/ForecastView';
import MetricsView from './components/MetricsView';
import WeatherArchitectureView from './components/ArchitectureView';
import AboutView from './components/AboutView';
import Footer from './components/Footer';

// Entrepreneur Matching Components
import { MatchProvider, useMatch } from './components/matching/MatchContext';
import DashboardView from './components/matching/DashboardView';
import EntrepreneurProfileForm from './components/matching/EntrepreneurProfileForm';
import CandidatesRemainingView from './components/matching/CandidatesRemainingView';
import MatchingResultsView from './components/matching/MatchingResultsView';
import RegistrationScreen from './components/matching/RegistrationScreen';
import SystemArchitectureView from './components/matching/SystemArchitectureView';

import { EventTrack } from './types';

function AppContent() {
  const [appMode, setAppMode] = useState<'matching' | 'weather'>('matching');
  const { activeTab, setActiveTab } = useMatch();
  const [tracks, setTracks] = useState<EventTrack[]>([]);

  // Smooth scrolling with Lenis
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Fetch Tracks from API on Mount (for weather mode)
  useEffect(() => {
    fetch('/api/tracks')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
        } else {
          setTracks([
            {
              id: 'TRK-HE-0001',
              type: 'heatwave',
              start_date: '2022-01-31',
              end_date: '2022-02-04',
              duration_days: 5,
              peak_intensity: 7.18,
              max_area_km2: 205330.0,
              mean_velocity_km_day: 129.9,
              status: 'dissipated',
              path: [[75.25, 21.26], [75.44, 22.31], [75.99, 22.35], [76.47, 22.8], [78.2, 22.37]],
              history: [],
            },
          ]);
        }
      })
      .catch((err) => console.log('Tracks fetch error', err));
  }, []);

  const handleOpenWeatherDashboard = () => {
    setActiveTab('weather-dashboard');
    const el = document.getElementById('weather-dashboard');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col selection:bg-cyan-500/30 selection:text-cyan-300">
      <Navbar
        appMode={appMode}
        setAppMode={setAppMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 w-full">
        {appMode === 'matching' ? (
          <div className="space-y-4">
            {/* Quick 6-Module Tabs Bar */}
            <div className="w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-8 py-2.5">
              <div className="max-w-7xl mx-auto flex items-center justify-between text-xs overflow-x-auto scrollbar-none gap-2">
                <span className="font-mono text-[#8a8a93] uppercase tracking-wider shrink-0 hidden sm:inline">
                  Quick Jump:
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                      activeTab === 'dashboard' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-[#8a8a93] hover:text-white'
                    }`}
                  >
                    1. Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                      activeTab === 'profile' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-[#8a8a93] hover:text-white'
                    }`}
                  >
                    2. Entrepreneur Profile Form
                  </button>
                  <button
                    onClick={() => setActiveTab('funnel')}
                    className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                      activeTab === 'funnel' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-[#8a8a93] hover:text-white'
                    }`}
                  >
                    3. Candidates Remaining After Each Filter
                  </button>
                  <button
                    onClick={() => setActiveTab('matching')}
                    className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                      activeTab === 'matching' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-[#8a8a93] hover:text-white'
                    }`}
                  >
                    4. Matching Results
                  </button>
                  <button
                    onClick={() => setActiveTab('register')}
                    className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                      activeTab === 'register' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-[#8a8a93] hover:text-white'
                    }`}
                  >
                    5. Registration Screen
                  </button>
                  <button
                    onClick={() => setActiveTab('architecture')}
                    className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                      activeTab === 'architecture' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-[#8a8a93] hover:text-white'
                    }`}
                  >
                    6. System Architecture
                  </button>
                </div>
              </div>
            </div>

            {/* Render Selected View */}
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'profile' && <EntrepreneurProfileForm />}
            {activeTab === 'funnel' && <CandidatesRemainingView />}
            {activeTab === 'matching' && <MatchingResultsView />}
            {activeTab === 'register' && <RegistrationScreen />}
            {activeTab === 'architecture' && <SystemArchitectureView />}
          </div>
        ) : (
          <div>
            <Hero tracks={tracks} onOpenDashboard={handleOpenWeatherDashboard} />
            <StorySections />
            <WeatherDashboard tracks={tracks} />
            <ForecastView />
            <MetricsView />
            <WeatherArchitectureView />
            <AboutView />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <MatchProvider>
      <AppContent />
    </MatchProvider>
  );
}
