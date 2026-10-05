import React, { useState } from 'react';
import {
  UserPlus,
  LogIn,
  Building,
  Mail,
  Lock,
  User,
  CheckCircle,
  Briefcase,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useMatch } from './MatchContext';

export default function RegistrationScreen() {
  const { registerUser, user, setActiveTab } = useMatch();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'entrepreneur' | 'investor' | 'mentor'>('entrepreneur');
  
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    organizationName: user?.organization_name || '',
    phone: '',
    linkedinUrl: '',
    agreeTerms: true,
  });

  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDemoFill = (role: 'entrepreneur' | 'investor' | 'mentor') => {
    setSelectedRole(role);
    if (role === 'entrepreneur') {
      setFormData({
        fullName: 'Nishanth Raja',
        email: 'nishanth@nexusai.health',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'NexusAI Health',
        phone: '+91 98765 43210',
        linkedinUrl: 'https://linkedin.com/in/nishanthraja',
        agreeTerms: true,
      });
    } else if (role === 'investor') {
      setFormData({
        fullName: 'Roelof Botha',
        email: 'roelof@sequoiacap.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'Sequoia Capital Horizon',
        phone: '+1 650 854 3927',
        linkedinUrl: 'https://linkedin.com/in/roelofbotha',
        agreeTerms: true,
      });
    } else {
      setFormData({
        fullName: 'Dr. Vijay Pande',
        email: 'vijay@a16z.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'Andreessen Horowitz Bio+Health',
        phone: '+1 415 555 0199',
        linkedinUrl: 'https://linkedin.com/in/vijaypande',
        agreeTerms: true,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isLoginMode) {
      if (!formData.fullName || !formData.email || !formData.organizationName) {
        setErrorMsg('Please fill in all required fields.');
        return;
      }
      if (formData.password && formData.password !== formData.confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    const success = await registerUser({
      full_name: formData.fullName || 'Demo User',
      email: formData.email || 'user@example.com',
      role: selectedRole,
      organization_name: formData.organizationName || 'Tech Startup',
      linkedin_url: formData.linkedinUrl,
    });

    if (success) {
      setSubmittedMessage(
        isLoginMode
          ? `Welcome back, ${formData.fullName || 'User'}! Authenticated successfully.`
          : `Account created successfully for ${formData.fullName}! Redirecting to Dashboard...`
      );
      setTimeout(() => {
        setActiveTab(selectedRole === 'entrepreneur' ? 'profile' : 'dashboard');
      }, 1200);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AUTHENTICATION & ONBOARDING</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Registration Screen
        </h1>
        <p className="text-sm text-[#8a8a93] max-w-lg mx-auto">
          Create an institutional account or sign in to access AI-powered matchmaking, investor dossiers, and candidate filtering telemetry.
        </p>
      </div>

      {/* Demo Credentials Quick-Fill Toolbar */}
      <div className="p-4 rounded-2xl bg-surface/80 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-mono text-[#8a8a93] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          One-Click Demo Profiles:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleDemoFill('entrepreneur')}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all font-medium"
          >
            Fill Entrepreneur
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('investor')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all font-medium"
          >
            Fill Investor
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('mentor')}
            className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-all font-medium"
          >
            Fill Mentor
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="p-8 rounded-3xl bg-surface/90 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Tab Toggle: Register vs Login */}
        <div className="flex items-center justify-center mb-8">
          <div className="p-1 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(false);
                setSubmittedMessage(null);
              }}
              className={`px-6 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                !isLoginMode
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'text-[#8a8a93] hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(true);
                setSubmittedMessage(null);
              }}
              className={`px-6 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isLoginMode
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'text-[#8a8a93] hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>
        </div>

        {/* Role Selection (Only in Registration Mode) */}
        {!isLoginMode && (
          <div className="mb-6 space-y-2">
            <label className="text-xs font-mono text-[#8a8a93] uppercase tracking-wider block">
              Select Your Platform Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  role: 'entrepreneur' as const,
                  title: 'Entrepreneur / Founder',
                  desc: 'Seeking capital, smart matching & investor pipeline',
                  color: 'cyan',
                },
                {
                  role: 'investor' as const,
                  title: 'Investor / VC',
                  desc: 'Deploying capital & filtering high-dealflow pipelines',
                  color: 'emerald',
                },
                {
                  role: 'mentor' as const,
                  title: 'Mentor / Advisor',
                  desc: 'Advising early-stage ventures on scaling & GTM',
                  color: 'purple',
                },
              ].map((item) => {
                const isSelected = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-black/40 border-white/10 text-[#8a8a93] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{item.title}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-[#8a8a93] mt-1">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8a8a93] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nishanth Raja"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                  {selectedRole === 'investor' ? 'Fund / Firm Name *' : 'Startup / Company Name *'}
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#8a8a93] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder={selectedRole === 'investor' ? 'e.g. Sequoia Capital' : 'e.g. NexusAI Health'}
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Work Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8a8a93] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {!isLoginMode && (
              <div>
                <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                  LinkedIn or Website
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#8a8a93] absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8a8a93] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {!isLoginMode && (
              <div>
                <label className="text-xs font-mono text-[#8a8a93] uppercase block mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8a8a93] absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Terms checkbox */}
          {!isLoginMode && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="agree"
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                className="rounded border-white/20 bg-black text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="agree" className="text-xs text-[#8a8a93]">
                I agree to the platform Terms of Service, Confidentiality Undertaking, and AI Data Usage Policy.
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {submittedMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{submittedMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all"
            >
              <span>{isLoginMode ? 'Sign In to Dashboard' : 'Complete Registration & Continue'}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </form>

        {/* Current Session Indicator */}
        {user && (
          <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#8a8a93]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Active Session: <strong className="text-white">{user.full_name}</strong> ({user.organization_name})
              </span>
            </div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Jump to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
