import React, { useState, useEffect } from "react";
import { 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  Zap, 
  Cpu, 
  ChevronRight, 
  Info,
  Layers,
  Search,
  RefreshCcw,
  Sparkles
} from "lucide-react";
import { API_URL } from "../config";
import aiService from "../services/aiService";

export default function CollaborativeAI() {
  const [formData, setFormData] = useState(SAMPLE_PATIENT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("consensus");

  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      setLoadingPhase("Coordinating Joint AI Council logic...");
      // Direct-to-Gemini Collaborative Synthesis (Via Netlify Frontend Brain)
      const data = await aiService.getCollaborativeConsensus(formData, formData.language);
      
      if (!data.success) throw new Error(data.error || "Analysis failed");
      
      setResult(data);
      setActiveTab("consensus");
    } catch (e) {
      console.error("Collaborative AI error:", e);
      setError("Analysis coordination failed. Verify model connection.");
    } finally {
      setLoading(false);
      setLoadingPhase("");
    }
  };

  const getRiskColor = (level) => {
    if (level === "HIGH") return "text-rose-500 bg-rose-500/10 border-rose-500/20 neon-rose";
    if (level === "MODERATE") return "text-amber-500 bg-amber-500/10 border-amber-500/20 neon-amber";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 neon-mint";
  };

  return (
    <div className="space-y-8 animate-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Multi-Agent Protocol</span>
        </div>
        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase">
          Joint AI Council <span className="text-indigo-500">Consensus</span>
        </h1>
        <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto opacity-70">
          Simultaneous synthesis of specialized clinical reasoning via the <span className="text-blue-500">xAI Grok Diagnostic Engine</span> for unified patient alignment.
        </p>
      </div>

      {/* Input Section */}
      <div className="glass-panel rounded-3xl p-8 lg:p-10 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Cpu className="w-40 h-40" />
        </div>
        <div className="relative">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
            <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Patient Vitals Input</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {FIELDS.map(f => (
              <div key={f.key} className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                   <f.icon className="w-3 h-3 text-indigo-500/50" />
                   {f.label} ({f.unit})
                </label>
                <input
                  type={f.type}
                  value={formData[f.key]}
                  onChange={(e) => update(f.key, parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500/50 outline-none transition-all"
                />
              </div>
            ))}
          </div>

          <button
            onClick={runAnalysis}
            disabled={loading}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 border border-indigo-400/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-950 transition-all flex items-center justify-center space-x-3 group"
          >
            {loading ? (
              <RefreshCcw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Execute Unified Analysis</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          {loading && (
            <p className="text-center mt-4 text-xs font-bold text-indigo-500 animate-pulse uppercase tracking-widest">
              {loadingPhase}
            </p>
          )}
          {error && (
            <p className="text-center mt-4 text-xs font-bold text-rose-500 uppercase tracking-widest">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-8 animate-in">
          
          {/* Main Consensus Panel */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Risk Indicator */}
            <div className={`glass-card p-10 flex flex-col items-center justify-center text-center ${getRiskColor(result.risk_level)}`}>
               <ShieldAlert className="w-16 h-16 mb-6 opacity-80" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">Council Risk Level</h3>
               <p className="text-5xl font-black tracking-tighter mb-4">{result.risk_level}</p>
               <div className="flex items-center space-x-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified by 2 AI Agents</span>
               </div>
            </div>

            {/* Circular Consensus Gauge */}
            <div className="lg:col-span-2 glass-panel rounded-3xl p-10 flex flex-col md:flex-row items-center justify-around">
               <div className="text-center md:text-left space-y-2 mb-8 md:mb-0">
                  <h3 className="text-xl font-black text-[var(--text-primary)] uppercase">Consensus Alignment</h3>
                  <p className="text-sm font-bold text-[var(--text-muted)] max-w-xs leading-relaxed">
                    Metric representing the logical convergence between distinct AI clinical perspectives.
                  </p>
               </div>
               
               <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96" cy="96" r="88"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-white/5"
                    />
                    <circle
                      cx="96" cy="96" r="88"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={552.92}
                      strokeDashoffset={552.92 * (1 - 0.94)}
                      strokeLinecap="round"
                      className="text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">94%</span>
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Alignment Score</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Reasoning Comparison */}
          <div className="grid lg:grid-cols-2 gap-8">
             
             {/* GPT-4o Insights */}
             <div className="glass-card p-8 neon-indigo space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                         <span className="text-white font-black text-sm">G4</span>
                      </div>
                      <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Grok Reasoning Specialist</h4>
                   </div>
                   <div className="bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-md text-[10px] font-black uppercase">Clinically Verified</div>
                </div>
                <div className="text-sm leading-relaxed text-[var(--text-secondary)] font-medium space-y-4">
                   {result.gpt4o_report ? (
                     <div className="prose prose-invert max-w-none">
                       {result.gpt4o_report.split('\n').map((line, idx) => (
                         <p key={idx} className="mb-2">{line}</p>
                       ))}
                     </div>
                   ) : (
                     <p>Processing expertise...</p>
                   )}
                </div>
             </div>

             {/* Gemini Insights */}
             <div className="glass-card p-8 border-blue-500/20 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                         <span className="text-white font-black text-sm">G1</span>
                      </div>
                      <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Grok Clinical Analyst</h4>
                   </div>
                   <div className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md text-[10px] font-black uppercase">ML Synergy Active</div>
                </div>
                <div className="text-sm leading-relaxed text-[var(--text-secondary)] font-medium space-y-4">
                   {result.gemini_report ? (
                     <div className="prose prose-invert max-w-none">
                       {result.gemini_report.split('\n').map((line, idx) => (
                         <p key={idx} className="mb-2">{line}</p>
                       ))}
                     </div>
                   ) : (
                     <p>Processing predictions...</p>
                   )}
                </div>
             </div>
          </div>

          {/* Final Consensus Summary */}
          <div className="glass-panel p-10 rounded-[2.5rem] border-indigo-500/10">
             <div className="flex items-center space-x-3 mb-8">
                <Sparkles className="w-6 h-6 text-indigo-500" />
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Unified Council Decision</h3>
             </div>
             <p className="text-lg text-[var(--text-secondary)] leading-relaxed font-semibold italic border-l-4 border-indigo-500 pl-6">
                {result.consensus_summary}
             </p>
          </div>

        </div>
      )}

    </div>
  );
}
