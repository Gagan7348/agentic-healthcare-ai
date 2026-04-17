import { useState, useEffect } from 'react'
import axios from 'axios'
import { Clipboard, ShieldCheck, Zap, Heart, Calendar, Clock, AlertTriangle, ChevronRight, Activity, Beaker, Apple, Dumbbell, UserCheck, Microscope, Volume2, Pause, MessageSquare } from 'lucide-react'

import { API_URL } from '../config'
import aiService, { languageMap } from '../services/aiService'
import { getT } from '../utils/translations'

function TreatmentPlan({ language = 'en', selectedPatient = null, onSelectedPatient = null, onNavigate = () => {} }) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState({
    age: selectedPatient?.age || 52,
    gender: selectedPatient?.gender === 1 ? 'Female' : 'Male',
    glucose: selectedPatient?.glucose || 145,
    bp: selectedPatient?.bp_systolic || 135,
    cholesterol: selectedPatient?.cholesterol || 210,
    bmi: selectedPatient?.bmi || 28.5,
    language: languageMap[language] || 'english'
  })

  useEffect(() => {
    if (selectedPatient) {
      setPatientData(prev => ({ ...prev, ...selectedPatient }))
    }
  }, [selectedPatient])
  const [audioLoading, setAudioLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioInstance, setAudioInstance] = useState(null)

  useEffect(() => {
    return () => {
      if (audioInstance) audioInstance.pause()
    }
  }, [audioInstance])

  // Support for additional languages
  const getLanguageName = (code) => {
    const langs = {
      'en': 'English',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'bn': 'Bengali',
      'mr': 'Marathi',
      'gu': 'Gujarati'
    }
    return langs[code] || code
  }

  const generatePlan = async () => {
    try {
      setLoading(true)
      // Direct-to-Gemini Synthesis (Via Netlify Frontend Brain)
      const response = await aiService.generateTreatmentPlan(
          patientData,
          language
      );
      
      if (response.success) {
          setPlan(response.response)
      } else {
          throw new Error(response.error || "Neural Link Failure")
      }
    } catch (error) {
      console.error("Plan generation error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayAudio = async () => {
    if (!plan) return

    if (isPlaying && audioInstance) {
      audioInstance.pause()
      setIsPlaying(false)
      return
    }

    setAudioLoading(true)
    
    try {
      const cleanText = plan.replace(/[#*]/g, '').substring(0, 4000)
      
      const formData = new FormData()
      formData.append('text', cleanText)
      formData.append('language', language)

      const response = await axios.post(`${API_URL}/api/voice/synthesize`, formData, {
        responseType: 'blob'
      })
      
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      setAudioInstance(audio)
      
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
      audio.onpause = () => setIsPlaying(false)
      
      audio.play()
    } catch (err) {
      console.error('Audio synthesis error:', err)
    } finally {
      setAudioLoading(false)
    }
  }

  const globalT = getT(language);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Configuration Hub */}
      <div className="main-card overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center space-x-3">
              <Clipboard className="w-6 h-6 text-blue-600" />
              <span>{globalT.personalizedTreatmentPlan}</span>
            </h2>
            <p className="text-slate-500 font-semibold text-sm mt-1">AI-Synthesized Clinical Directive</p>
          </div>
          <button 
            onClick={generatePlan}
            disabled={loading}
            className="btn-primary px-8 py-3 flex items-center space-x-2"
          >
            {loading ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{loading ? globalT.synthesizing : globalT.composePlan}</span>
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Clinical Language</label>
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="font-semibold text-blue-600 uppercase pt-0.5">{getLanguageName(language)}</span>
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { label: 'Glucose', val: patientData.glucose, unit: 'mg/dL', key: 'glucose', min: 40, max: 400 },
              { label: 'Blood Pressure', val: patientData.bp, unit: 'mmHg', key: 'bp', min: 60, max: 220 },
              { label: 'Cholesterol', val: patientData.cholesterol, unit: 'mg/dL', key: 'cholesterol', min: 100, max: 400 },
              { label: 'BMI', val: patientData.bmi, unit: '', key: 'bmi', min: 10, max: 50, step: 0.1 }
            ].map((stat, i) => (
              <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl group hover:border-blue-300 transition-all shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase">{stat.label}</p>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-bold text-blue-600 leading-none">{stat.val}</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">{stat.unit}</span>
                  </div>
                </div>
                <input 
                  type="range"
                  min={stat.min}
                  max={stat.max}
                  step={stat.step || 1}
                  value={stat.val || stat.min}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPatientData(prev => {
                      const updated = { ...prev, [stat.key]: val };
                      if (onSelectedPatient) onSelectedPatient(updated);
                      return updated;
                    });
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {plan ? (
        <div className="main-card p-10 animate-in fade-in duration-500">
           <div className="relative z-10">
              <div className="flex items-center space-x-6 mb-8 border-b border-slate-200 pb-6">
                 <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Microscope className="w-8 h-8 text-blue-600" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">AI Treatment Assessment</h3>
                    <div className="flex items-center space-x-2 mt-1 text-emerald-600">
                       <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Verified Medical Protocol</span>
                     </div>
                  </div>
                  <div className="flex-1 flex justify-end">
                    <button
                      onClick={handlePlayAudio}
                      disabled={audioLoading}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg border transition-all ${
                        isPlaying 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {audioLoading ? (
                        <Activity className="w-5 h-5 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {audioLoading ? '...' : isPlaying ? globalT.pauseAudio : globalT.listen}
                      </span>
                    </button>
                  </div>
               </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 <div className="lg:col-span-8 space-y-6">
                    <div className="prose max-w-none">
                       {plan.split('\n').map((line, i) => {
                         if (line.startsWith('**') || line.startsWith('#')) {
                           return <h4 key={i} className="text-slate-800 font-bold text-xl tracking-tight mt-8 mb-4">{line.replace(/\*|#/g, '')}</h4>
                         }
                         if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                           return (
                             <div key={i} className="flex items-start space-x-3 mb-3 group">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 flex-shrink-0"></div>
                               <p className="text-slate-600 leading-relaxed font-medium">{line.replace(/^- |\* /g, '')}</p>
                             </div>
                           )
                         }
                         return line.trim() ? <p key={i} className="text-slate-600 leading-relaxed font-medium mb-4">{line}</p> : null
                       })}
                    </div>
                 </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Plan Core Pillars</p>
                       {[
                         { icon: Apple, label: 'Diet Matrix', desc: 'Metabolic Optimization', color: 'bg-emerald-500 text-white' },
                         { icon: Dumbbell, label: 'Kinetic Plan', desc: 'Daily Cardiovascular Load', color: 'bg-blue-500 text-white' },
                         { icon: Clock, label: 'Chronology', desc: '14-Day Cycle Execution', color: 'bg-rose-500 text-white' },
                         { icon: UserCheck, label: 'Family Support', desc: 'Support Ecosystem Link', color: 'bg-amber-500 text-white' }
                       ].map((pillar, i) => (
                         <div key={i} className="flex items-center space-x-4">
                            <div className={`${pillar.color} p-3 rounded-xl`}>
                               <pillar.icon className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="font-bold text-sm text-[var(--text-primary)]">{pillar.label}</p>
                               <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">{pillar.desc}</p>
                            </div>
                         </div>
                       ))}
                       
                       <div className="pt-6 border-t border-slate-200">
                          <button 
                            onClick={() => onNavigate('chat', {
                              type: 'Treatment Plan',
                              plan: plan,
                              vitals: patientData
                            })}
                            className="btn-primary w-full py-3 text-sm flex items-center justify-center space-x-2 mb-6"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{globalT.consultDoctor}</span>
                          </button>

                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                             <div className="flex items-center space-x-2 mb-2 text-amber-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase">{globalT.importantNotice}</span>
                             </div>
                             <p className="text-xs font-medium text-amber-800 leading-relaxed">
                               This document is an AI suggestion. Final clinical decisions must be authorized by a registered medical officer.
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="main-card py-24 flex flex-col items-center justify-center text-center">
           <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6">
              <Microscope className="w-10 h-10 text-slate-400" />
           </div>
           <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight mb-2">{globalT.analysisPending}</h3>
           <p className="text-sm font-medium text-[var(--text-muted)] max-w-sm">
             Input clinical data and execute the composer to generate a personalized Agentic AI health directive.
           </p>
        </div>
      )}
    </div>
  )
}

export default TreatmentPlan
