import React from 'react';
import {
  Activity,
  FileText,
  Filter,
  Sparkles,
  UserPlus,
  Terminal,
  Layers,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { MatchProvider, useMatch } from './MatchContext';
import DashboardView from './DashboardView';
import EntrepreneurProfileForm from './EntrepreneurProfileForm';
import CandidatesRemainingView from './CandidatesRemainingView';
import MatchingResultsView from './MatchingResultsView';
import RegistrationScreen from './RegistrationScreen';
import SystemArchitectureView from './SystemArchitectureView';

function MatchingHubContent() {
  const { activeTab, setActiveTab, funnelSteps, matches, profile, user } = useMatch();

  const remainingCount = funnelSteps[funnelSteps.length - 1]?.candidates_after || matches.length || 12;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Activity,
      badge: null,
    },
    {
      id: 'profile',
      label: 'Entrepreneur Profile Form',
      icon: FileText,
      badge: 'Active',
    },
    {
      id: 'funnel',
      label: 'Candidates Remaining After Each Filter',
      icon: Filter,
      badge: `${remainingCount} Left`,
    },
    {
      id: 'matching',
      label: 'Matching Results',
      icon: Sparkles,
      badge: `${matches.length > 0 ? matches.length : 15} Matches`,
    },
    {
      id: 'register',
      label: 'Registration Screen',
      icon: UserPlus,
      badge: user ? 'Logged In' : 'Sign Up',
    },
    {
      id: 'architecture',
      label: 'System Architecture',
      icon: Terminal,
      badge: 'v2.4',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-[#f5f5f7] pt-4 pb-20">
      {/* Top Floating Project Sub-Nav Bar */}
      <div className="sticky top-16 z-30 w-full border-b border-white/10 bg-black/85 backdrop-blur-xl py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Platform Identity */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-black font-bold shadow-md shadow-cyan-500/20">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-white tracking-tight">
                  ENTREPRENEUR MATCH AI
                </span>
                <span className="text-[10px] text-cyan-400 font-mono ml-2">6 CORE MODULES</span>
              </div>
            </div>

            {user && (
              <span className="md:hidden text-[11px] font-mono text-zinc-400">
                {user.full_name.split(' ')[0]}
              </span>
            )}
          </div>

          {/* 6 Tabs Pill Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/25'
                      : 'text-[#8a8a93] hover:text-white hover:bg-white/5 border border-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-cyan-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                        isActive
                          ? 'bg-black/20 text-black'
                          : 'bg-white/10 text-cyan-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main View Router */}
      <main className="w-full">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'profile' && <EntrepreneurProfileForm />}
        {activeTab === 'funnel' && <CandidatesRemainingView />}
        {activeTab === 'matching' && <MatchingResultsView />}
        {activeTab === 'register' && <RegistrationScreen />}
        {activeTab === 'architecture' && <SystemArchitectureView />}
      </main>
    </div>
  );
}

export default function MatchingHub() {
  return (
    <MatchProvider>
      <MatchingHubContent />
    </MatchProvider>
  );
}
