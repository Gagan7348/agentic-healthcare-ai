import { useState, useEffect } from 'react'
import { Brain, Activity, Zap, ShieldCheck, ChevronRight, MessageSquare, Cpu, Box, Globe, Loader2, Sparkles } from 'lucide-react'

function AgenticConsensus({ data, onBack, onNavigate = () => {} }) {
  const [activeStep, setActiveStep] = useState(-1)
  const [showFinal, setShowFinal] = useState(false)

  useEffect(() => {
    // Sequential animation for agents
    const sequence = async () => {
      for (let i = 0; i < data.agents.length; i++) {
        await new Promise(r => setTimeout(r, 1500))
        setActiveStep(i)
      }
      await new Promise(r => setTimeout(r, 1500))
      setShowFinal(true)
    }
    sequence()
  }, [data])

  const getAgentIcon = (name) => {
    switch(name) {
      case 'Dr. Cortex': return <Brain className="w-8 h-8 text-indigo-400" />
      case 'Dr. Vitalis': return <Activity className="w-8 h-8 text-emerald-400" />
      case 'Dr. Synapse': return <Zap className="w-8 h-8 text-amber-400" />
      default: return <Cpu className="w-8 h-8 text-slate-400" />
    }
  }

  const getAgentTheme = (name) => {
    switch(name) {
      case 'Dr. Cortex': return 'border-blue-200 bg-blue-50'
      case 'Dr. Vitalis': return 'border-emerald-200 bg-emerald-50'
      case 'Dr. Synapse': return 'border-amber-200 bg-amber-50'
      default: return 'border-slate-200 bg-slate-50'
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      {/* Tactical Header */}
      <div className="main-card p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-blue-100 rounded-2xl">
              <Box className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">AI Consensus Panel</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                  Diagnostic Link Active
                </span>
                <span className="text-xs font-medium text-slate-500">Standard Clinical Protocol</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="btn-secondary px-6 py-2"
          >
            Close Panel
          </button>
        </div>
      </div>

      {/* Agents Panel */}
      <div className="grid lg:grid-cols-3 gap-8">
        {data.agents.map((agent, i) => (
          <div 
            key={i}
            className={`p-6 rounded-2xl border transition-all duration-700 ${
              i <= activeStep 
                ? `${getAgentTheme(agent.name)} opacity-100 scale-100 translate-y-0 shadow-sm` 
                : 'bg-slate-50 border-slate-200 opacity-50 scale-95 translate-y-4'
            }`}
          >
            <div className="flex items-center space-x-4 mb-6">
               <div className={`p-3 rounded-xl bg-white border border-slate-200 shadow-sm`}>
                  {getAgentIcon(agent.name)}
               </div>
               <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{agent.name}</h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase">{agent.role}</p>
               </div>
            </div>
            
            <div className="space-y-4">
               {activeStep === i - 1 && (
                 <div className="flex items-center space-x-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-semibold uppercase tracking-wider animate-pulse">Analyzing Case...</span>
                 </div>
               )}
               {i <= activeStep ? (
                 <p className="text-sm font-medium text-slate-700 leading-relaxed border-l-2 border-blue-500 pl-3">
                   {agent.message}
                 </p>
               ) : (
                 <div className="h-16 flex items-center justify-center">
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                       <div className="w-full h-full bg-blue-100 animate-pulse"></div>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="mt-8 flex justify-end">
               <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                 i <= activeStep ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-transparent border-white/10 text-white/10'
               }`}>
                  <MessageSquare className="w-4 h-4" />
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Final Consensus Protocol */}
      <div className={`transition-all duration-1000 transform ${showFinal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 scale-95'}`}>
         <div className="main-card overflow-hidden">
            <div className="grid md:grid-cols-12">
               <div className="md:col-span-4 bg-emerald-50 border-r border-emerald-100 p-8 flex flex-col justify-center">
                  <div className="p-4 bg-white rounded-xl border border-emerald-200 inline-block mb-6 shadow-sm w-fit">
                     <ShieldCheck className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-900 mb-2">Final Consensus</h3>
                  <p className="text-emerald-700 text-xs font-semibold uppercase">Collaborative Assessment</p>
               </div>
               <div className="md:col-span-8 p-8 space-y-6">
                  <div className="flex items-center space-x-2">
                     <Sparkles className="w-4 h-4 text-emerald-600" />
                     <span className="text-xs font-semibold text-slate-500 uppercase">Synthesized Recommendation</span>
                  </div>
                  <p className="text-base font-medium text-[var(--text-primary)] leading-relaxed">
                     "{data.consensus}"
                  </p>
                  <div className="pt-6 flex items-center justify-between border-t border-slate-200 mt-6">
                     <div className="flex items-center">
                        <div className="flex -space-x-2 mr-4">
                           {[1,2,3].map(n => (
                             <div key={n} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                AI{n}
                             </div>
                           ))}
                        </div>
                        <span className="text-xs font-bold text-emerald-600 uppercase">Analysis Complete</span>
                     </div>
                     <button 
                        onClick={() => onNavigate('plan', { type: 'Consensus Protocol', consensus: data.consensus, agents: data.agents })}
                        className="btn-primary flex items-center space-x-2 px-6 py-2 text-sm"
                     >
                        <span>Create Plan</span>
                        <ChevronRight className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

export default AgenticConsensus
