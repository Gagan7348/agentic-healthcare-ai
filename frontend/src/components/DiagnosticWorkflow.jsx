import { useState } from 'react'
import axios from 'axios'
import { Activity, Heart, Stethoscope, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, ShieldCheck, Zap, ArrowRight } from 'lucide-react'

import { API_URL } from '../config'

function DiagnosticWorkflow({ language = 'en', selectedPatient = null, onNavigate = () => {} }) {
  const [step, setStep] = useState(1)
  const [selections, setSelections] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  const steps = [
// ... (rest of steps)
    {
      id: 1,
      title: language === 'hi' ? 'प्राथमिक लक्षण' : 'Core Symptoms',
      desc: 'Identify physiological anomalies',
      options: [
        { id: 'fever', label: 'Fever / बुखार', icon: Activity },
        { id: 'cough', label: 'Cough / खांसी', icon: Activity },
        { id: 'weakness', label: 'Weakness / कमजोरी', icon: Activity },
        { id: 'pain', label: 'Body Pain / बदन दर्द', icon: Activity }
      ]
    },
    {
      id: 2,
      title: language === 'hi' ? 'महत्वपूर्ण संकेत' : 'Vital Indicators',
      desc: 'Specific diagnostic markers',
      options: [
        { id: 'breathing', label: 'Shortness of Breath / सांस लेने में तकलीफ', icon: Heart },
        { id: 'chest_pain', label: 'Chest Pain / सीने में दर्द', icon: Heart },
        { id: 'headache', label: 'Severe Headache / तेज़ सिरदर्द', icon: Activity },
        { id: 'dizziness', label: 'Dizziness / चक्कर आना', icon: Activity }
      ]
    },
    {
      id: 3,
      title: language === 'hi' ? 'न्यूरल विश्लेषण' : 'Neural Core Synthesis',
      desc: 'Final risk assessment layer',
      options: [
        { id: 'vision', label: 'Blurred Vision / धुंधली दृष्टि', icon: Activity },
        { id: 'numbness', label: 'Numbness / सुन्नपन', icon: Activity },
        { id: 'confusion', label: 'Confusion / भ्रम', icon: Activity },
        { id: 'thirst', label: 'Extreme Thirst / अधिक प्यास', icon: Activity }
      ]
    }
  ]

  const toggleOption = (optId) => {
    setSelections(prev => ({
      ...prev,
      [optId]: !prev[optId]
    }))
  }

  const nextStep = () => {
    if (step === 3) {
      handleAnalyze()
    } else {
      setStep(s => Math.min(s + 1, 4))
    }
  }
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${API_URL}/api/asha/analyze`, {
        patient: {
          age: selectedPatient?.age || 45,
          gender: selectedPatient?.gender === 1 ? 'Female' : 'Male',
          glucose: selectedPatient?.glucose || 100,
          hba1c: selectedPatient?.hba1c || 5.4,
          bp: selectedPatient?.bp_systolic || 120,
          bmi: selectedPatient?.bmi || 25,
          cholesterol: 200,
          creatinine: 1.0,
          smoking: 0,
          family_history_diabetes: 0,
          family_history_heart: 0,
          language: language === 'hi' ? 'hindi' : language === 'en' ? 'english' : language
        },
        symptoms: {
          fever: !!selections.fever,
          cough: !!selections.cough,
          chest_pain: !!selections.chest_pain,
          breathing: !!selections.breathing,
          weakness: !!selections.weakness,
          vomiting: false,
          diarrhea: false,
          headache: !!selections.headache,
          unconscious: false,
          bleeding: false,
          swelling: false,
          back_pain: false
        }
      })
      if (response.data.success) {
        setResult(response.data)
        setStep(4)
      } else {
        throw new Error(response.data.error || "Synthesis Failed")
      }
    } catch (err) {
      console.error("Workflow error:", err)
      setError(language === 'hi' ? 'विश्लेषण विफल रहा।' : 'Synthesis protocol failure.')
    } finally {
      setLoading(false)
    }
  }

  const currentStepData = steps.find(s => s.id === step)
  const isUrgent = result?.urgency === 'RED' || selections.chest_pain || selections.breathing

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-1000">
      {/* HUD Progress Bridge */}
      <div className="flex items-center justify-between mb-20 relative px-10">
         <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-white/5 -translate-y-1/2 -z-10"></div>
         <div className="absolute top-1/2 left-10 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 -translate-y-1/2 -z-10 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${((step - 1) / 2) * 80}%` }}></div>
         
         {[1, 2, 3].map((s) => (
           <div key={s} className="flex flex-col items-center">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 relative group ${
               step === s ? 'bg-indigo-600 border-indigo-400 text-white scale-110 shadow-[0_0_30px_rgba(99,102,241,0.4)]' :
               step > s ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' :
               'bg-white/5 border-white/10 text-slate-600'
             }`}>
               {step > s ? <CheckCircle className="w-6 h-6 animate-in zoom-in" /> : <span className="font-black text-lg italic-mono">{s}</span>}
               {step === s && <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>}
             </div>
             <p className={`mt-6 text-[9px] font-black uppercase tracking-[0.3em] ${step === s ? 'text-indigo-400 text-glow' : 'text-slate-600'}`}>
               {steps[s-1].title}
             </p>
           </div>
         ))}
      </div>

      {step <= 3 ? (
        <div className="bg-white/70 dark:bg-[#0f172a]/60 backdrop-blur-sm rounded-[3rem] border border-[var(--border-light)] dark:border-white/5 overflow-hidden group shadow-3xl relative">
           <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
           <div className="p-12 border-b border-[var(--border-light)] dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between relative z-10">
              <div>
                 <h2 className="text-4xl font-black text-[var(--text-primary)] dark:text-white tracking-tighter mb-2 italic-mono uppercase text-glow-cyan">{currentStepData.title}</h2>
                 <p className="text-[var(--text-muted)] dark:text-slate-500 font-bold tracking-[0.2em] italic-mono text-[10px] uppercase opacity-60">{currentStepData.desc}</p>
              </div>
              <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                 <Stethoscope className="w-9 h-9" />
              </div>
           </div>

           <div className="p-12 grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
              {currentStepData.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className={`p-10 rounded-[2.5rem] border-2 transition-all flex items-center space-x-8 relative group overflow-hidden hud-border ${
                    selections[opt.id] 
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.15)]' 
                      : 'bg-white border-[var(--border-light)] dark:bg-white/5 dark:border-white/5 hover:border-indigo-200 dark:hover:border-white/10 shadow-sm'
                  }`}
                >
                  <div className={`p-5 rounded-2xl transition-all duration-500 ${selections[opt.id] ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-slate-500 group-hover:text-indigo-400'}`}>
                    <opt.icon className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                     <span className={`font-black text-lg tracking-tight block transition-colors ${selections[opt.id] ? 'text-white text-glow' : 'text-slate-400'}`}>{opt.label.split(' / ')[0]}</span>
                     <span className={`font-bold text-[10px] uppercase tracking-widest block opacity-50 ${selections[opt.id] ? 'text-indigo-300' : 'text-slate-600'}`}>{opt.label.split(' / ')[1]}</span>
                  </div>
                  {selections[opt.id] && (
                    <div className="absolute right-8 bg-indigo-500 text-white p-1.5 rounded-full animate-in zoom-in">
                       <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              ))}
           </div>

           <div className="p-12 bg-white/5 border-t border-white/5 flex items-center justify-between relative z-10">
              <button 
                onClick={prevStep}
                disabled={step === 1}
                className="flex items-center space-x-3 px-8 py-5 text-slate-600 font-black text-[10px] uppercase tracking-[0.4em] hover:text-indigo-400 disabled:opacity-0 transition-all border border-transparent hover:border-white/5 rounded-2xl"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Neural Backtrack</span>
              </button>
              <button 
                onClick={nextStep}
                className="flex items-center space-x-4 px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all group/btn"
              >
                <span>{loading ? 'Synthesizing...' : (step === 3 ? 'Execute Synthesis' : 'Next Sequence')}</span>
                {loading ? <Zap className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />}
              </button>
           </div>
        </div>
      ) : (
        <div className="bg-[#0f172a]/60 backdrop-blur-sm rounded-[4rem] p-20 border border-white/10 shadow-3xl text-white relative overflow-hidden animate-in zoom-in duration-1000">
           <div className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none"></div>
           <div className="relative z-10 text-center">
              <div className="relative group mb-10">
                 <img src="/diagnostic_visual.png" alt="Diagnostic Scan" className="w-full h-48 object-cover rounded-[2rem] opacity-60 group-hover:opacity-80 transition-opacity border border-white/10" />
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-[2.5rem] flex items-center justify-center relative group ${isUrgent ? 'bg-rose-600/20 border border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.3)]' : 'bg-emerald-600/20 border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.3)]'}`}>
                    {isUrgent ? <AlertCircle className="w-14 h-14 text-rose-400 animate-pulse" /> : <ShieldCheck className="w-14 h-14 text-emerald-400" />}
                    <div className={`absolute inset-0 blur-3xl opacity-30 ${isUrgent ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                 </div>
              </div>
              <h2 className="text-6xl font-black tracking-tighter mb-4 italic-mono uppercase text-glow">Synthesis Complete</h2>
              <div className="flex items-center justify-center space-x-4 mb-16">
                 <div className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.4em] border-2 shadow-2xl ${isUrgent ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
                    {isUrgent ? 'PROTOCOL: IMMEDIATE EMERGENCY PHC' : 'PROTOCOL: MANAGED CARE SYNTHESIS'}
                 </div>
              </div>

              <div className="max-w-3xl mx-auto space-y-12">
                 <div className="p-12 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden hud-border">
                    <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em] mb-8 relative z-10">Core Findings Telemetry</p>
                    <p className="text-2xl text-slate-200 font-bold leading-relaxed mb-10 italic-mono relative z-10">
                       {result?.urgency_text || (isUrgent ? 'CRITICAL SYSTEM ANOMALY: Immediate PHC evacuation recommended.' : 'SYSTEM STABLE: Standard managed care protocols initialized.')}
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 relative z-10">
                       {result?.actions?.map((action, i) => (
                         <div key={i} className="px-8 py-4 bg-white/5 border border-indigo-500/20 rounded-2xl text-[10px] font-black text-indigo-300 uppercase tracking-widest italic-mono">
                           {action}
                         </div>
                       ))}
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rotate-45 translate-x-16 -translate-y-16"></div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                     <button 
                       onClick={() => {
                         console.log("CONSULTING AI -> Diagnostic Synthesis")
                         onNavigate('chat', {
                           type: 'Diagnostic Workflow',
                           urgency: result?.urgency || 'RED',
                           findings: result?.urgency_text || 'Diagnostic findings for specialist review.',
                           actions: result?.actions || []
                         })
                       }}
                       className={`py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)] active:scale-95 flex items-center justify-center space-x-4 ${isUrgent ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}>
                         <span>{isUrgent ? 'Connect to Specialist' : 'Consult AI Expert'}</span>
                         <Zap className="w-5 h-5 animate-pulse" />
                     </button>
                     <button 
                       onClick={() => onNavigate('predict')}
                       className="py-8 bg-white/5 border border-white/10 text-slate-400 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.4em] hover:text-white hover:bg-white/10 transition-all flex items-center justify-center space-x-3"
                     >
                        <ArrowRight className="w-5 h-5" />
                        <span>Generate Full Matrix</span>
                     </button>
                    <button 
                      onClick={() => {setStep(1); setSelections({}); setResult(null);}} 
                      className="py-8 bg-white/5 border border-white/10 text-slate-500 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.4em] hover:text-white hover:bg-white/10 transition-all"
                    >
                       Re-Execute Diagnostic Routine
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="absolute top-0 right-0 w-128 h-128 bg-indigo-500/5 rounded-full blur-[150px]"></div>
           <div className="absolute bottom-0 left-0 w-128 h-128 bg-cyan-500/5 rounded-full blur-[150px]"></div>
        </div>
      )}
    </div>
  )
}

export default DiagnosticWorkflow
