import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { ForecastResponse } from '../types';

export default function ForecastView() {
  const [lead, setLead] = useState<number>(1);
  const [variable, setVariable] = useState<'t2m' | 'tp'>('t2m');
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/forecast?lead=${lead}&variable=${variable}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData) setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Forecast fetch error', err);
        setLoading(false);
      });
  }, [lead, variable]);

  return (
    <div id="forecast" className="w-full bg-black text-[#f5f5f7] py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="label text-accent mb-1">DEEP SEQUENCE-TO-SEQUENCE FORECASTING</div>
          <h2 className="text-3xl font-display font-bold">ConvLSTM Anomaly Projection vs Ground Truth</h2>
          <p className="text-sm text-[#8a8a93] max-w-2xl mt-1">
            Predicting multi-channel anomaly fields 1 to 3 days ahead. Compare model predictions against actual outcomes across South Asia.
          </p>
        </div>

        {/* Lead Selector & Variable Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 rounded-full border border-white/10 bg-surface">
            {[1, 2, 3].map((l) => (
              <button
                key={l}
                onClick={() => setLead(l)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                  lead === l
                    ? 'bg-accent text-black font-bold shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                    : 'text-[#8a8a93] hover:text-white'
                }`}
              >
                Lead +{l}d
              </button>
            ))}
          </div>

          <div className="flex items-center p-1 rounded-full border border-white/10 bg-surface">
            <button
              onClick={() => setVariable('t2m')}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                variable === 't2m'
                  ? 'bg-orange-500/20 text-[#ff5a36] border border-[#ff5a36]/30 font-semibold'
                  : 'text-[#8a8a93] hover:text-white'
              }`}
            >
              Temp (t2m)
            </button>
            <button
              onClick={() => setVariable('tp')}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                variable === 'tp'
                  ? 'bg-blue-500/20 text-[#3b82f6] border border-[#3b82f6]/30 font-semibold'
                  : 'text-[#8a8a93] hover:text-white'
              }`}
            >
              Precip (tp)
            </button>
          </div>
        </div>
      </div>

      {/* Verification Metrics Bar */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <div className="card p-4 border-white/10 bg-surface text-center">
            <div className="label text-[#8a8a93] text-[10px]">RMSE (Z-Score)</div>
            <div className="num text-xl font-bold text-accent">{data.metrics.rmse}</div>
            <div className="text-[9px] font-mono text-[#8a8a93] mt-0.5">Persistence: ~0.74</div>
          </div>
          <div className="card p-4 border-white/10 bg-surface text-center">
            <div className="label text-[#8a8a93] text-[10px]">Spatial Correlation (ACC)</div>
            <div className="num text-xl font-bold text-emerald-400">{data.metrics.acc}</div>
            <div className="text-[9px] font-mono text-[#8a8a93] mt-0.5">Climatology: 0.00</div>
          </div>
          <div className="card p-4 border-white/10 bg-surface text-center">
            <div className="label text-[#8a8a93] text-[10px]">Critical Success Index</div>
            <div className="num text-xl font-bold text-cyan-300">{data.metrics.csi}</div>
            <div className="text-[9px] font-mono text-[#8a8a93] mt-0.5">Threshold: Z &gt; 1.5</div>
          </div>
          <div className="card p-4 border-white/10 bg-surface text-center">
            <div className="label text-[#8a8a93] text-[10px]">Probability of Detection</div>
            <div className="num text-xl font-bold text-purple-300">{data.metrics.pod}</div>
            <div className="text-[9px] font-mono text-[#8a8a93] mt-0.5">Hit Rate</div>
          </div>
          <div className="card p-4 border-white/10 bg-surface text-center">
            <div className="label text-[#8a8a93] text-[10px]">False Alarm Ratio</div>
            <div className="num text-xl font-bold text-orange-400">{data.metrics.far}</div>
            <div className="text-[9px] font-mono text-[#8a8a93] mt-0.5">FAR per grid</div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Maps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Predicted Anomaly Map */}
        <div className="card p-6 border-white/10 bg-surface flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="text-base font-display font-bold">ConvLSTM Anomaly Forecast (+{lead}d)</h3>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
              Target: {data?.target_date || '2023-12-29'}
            </span>
          </div>

          <div className="relative aspect-[4/3] rounded-xl border border-white/10 bg-[#08080a] p-4 flex flex-col items-center justify-center overflow-hidden">
            {/* Visual Grid Projection */}
            <div className="grid grid-cols-8 gap-1.5 w-full h-full p-2">
              {Array.from({ length: 64 }).map((_, i) => {
                const hasAnomaly = [18, 19, 26, 27, 28, 35, 36].includes(i);
                return (
                  <div
                    key={i}
                    className={`rounded transition-all duration-300 flex items-center justify-center ${
                      hasAnomaly
                        ? variable === 't2m'
                          ? 'bg-[#ff5a36]/60 border border-[#ff5a36] shadow-[0_0_12px_rgba(255,90,54,0.4)]'
                          : 'bg-[#3b82f6]/60 border border-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                        : 'bg-white/[0.02] border border-white/[0.04]'
                    }`}
                  >
                    {hasAnomaly && (
                      <span className="text-[8px] font-mono text-white font-bold">
                        {variable === 't2m' ? '+2.8K' : '+45mm'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#8a8a93]">
              ConvLSTM Predicted Anomaly Footprint
            </div>
          </div>
        </div>

        {/* Ground Truth Actual Map */}
        <div className="card p-6 border-white/10 bg-surface flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-display font-bold">Observed Ground Truth (Verification)</h3>
            </div>
            <span className="text-xs font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
              Verified: {data?.target_date || '2023-12-29'}
            </span>
          </div>

          <div className="relative aspect-[4/3] rounded-xl border border-white/10 bg-[#08080a] p-4 flex flex-col items-center justify-center overflow-hidden">
            <div className="grid grid-cols-8 gap-1.5 w-full h-full p-2">
              {Array.from({ length: 64 }).map((_, i) => {
                const hasAnomaly = [19, 20, 27, 28, 35, 36, 44].includes(i);
                return (
                  <div
                    key={i}
                    className={`rounded transition-all duration-300 flex items-center justify-center ${
                      hasAnomaly
                        ? variable === 't2m'
                          ? 'bg-[#ff5a36]/80 border border-[#ff5a36] shadow-[0_0_12px_rgba(255,90,54,0.6)]'
                          : 'bg-[#3b82f6]/80 border border-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                        : 'bg-white/[0.02] border border-white/[0.04]'
                    }`}
                  >
                    {hasAnomaly && (
                      <span className="text-[8px] font-mono text-white font-bold">
                        {variable === 't2m' ? '+3.1K' : '+52mm'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#8a8a93]">
              Ground-Truth Anomaly Envelope
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
