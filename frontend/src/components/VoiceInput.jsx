import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Mic, Square, Play, AlertCircle, Volume2, Settings, Download, Brain, Sparkles, Activity, ShieldCheck, ArrowRight } from 'lucide-react'

import { API_URL } from '../config'
import { languageMap } from '../services/aiService'
import { getT } from '../utils/translations'

function VoiceInput({ language = 'en', selectedPatient = null, onNavigate = () => {} }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [diagnosticMode, setDiagnosticMode] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState(null)
  const [isBotSpeaking, setIsBotSpeaking] = useState(false)
  const audioRef = useRef(null)

  const labels = {
    en: {
      title: 'Voice Assistant',
      subtitle: 'Voice-to-Text & Smart Diagnosis Speech',
      start: 'Start Listening',
      stop: 'Stop Processing',
      speaking: 'AI is listening...',
      transcript: 'System Transcript',
      play: 'AI Voice Response',
      noVoice: 'Voice Input Not Supported',
      tapToTalk: 'Tap to start speaking',
      processing: 'Synthesizing voice...',
      smartDiag: 'Smart Voice Diagnostic',
      diagDesc: 'Tell AI your problems, get instant voice diagnosis',
      diagResult: 'Agentic AI Diagnostic Analysis',
      urgency: 'Urgency Level',
      action: 'Recommended Action',
      reListen: 'Speak Again',
      aiInstructions: 'Please describe exactly what health problems or symptoms you are experiencing. I am listening.',
      finishing: 'Finalizing analysis...'
    },
    hi: {
      title: 'आवाज़ सहायक',
      subtitle: 'आवाज़-से-पाठ और स्मार्ट निदान भाषण',
      start: 'सुनना शुरू करें',
      stop: 'प्रक्रिया रोकें',
      speaking: 'AI सुन रहा है...',
      transcript: 'सिस्टम प्रतिलेख',
      play: 'AI आवाज़ प्रतिक्रिया',
      noVoice: 'आवाज़ इनपुट समर्थित नहीं है',
      tapToTalk: 'बोलने के लिए टैप करें',
      processing: 'आवाज़ तैयार की जा रही है...',
      smartDiag: 'स्मार्ट वॉयस डायग्नोस्टिक',
      diagDesc: 'AI को अपनी समस्या बताएं, तुरंत आवाज़ में निदान पाएं',
      diagResult: 'Agentic AI डायग्नोस्टिक विश्लेषण',
      urgency: 'अत्यावश्यकता स्तर',
      action: 'अनुशंसित कार्रवाई',
      reListen: 'फिर से बोलें',
      aiInstructions: 'कृपया बताएं कि आपको क्या स्वास्थ्य समस्याएं या लक्षण महसूस हो रहे हैं। मैं सुन रहा हूं।',
      finishing: 'विश्लेषण पूरा किया जा रही है...'
    }
  }

  const t = labels[language] || labels.en
  const globalT = getT(language)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const isSupported = !!SpeechRecognition

  const speakInstructions = async () => {
    setIsBotSpeaking(true)
    await speakText(t.aiInstructions)
    // Small delay before listening starts
    setTimeout(() => {
        startListening()
    }, 1000)
  }

  const startListening = () => {
    if (!isSupported) {
      setError(t.noVoice)
      return
    }

    const recognition = new SpeechRecognition()
    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'pa': 'pa-IN'
    }
    recognition.lang = langMap[language] || 'en-US'
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event) => {
      const current = event.resultIndex
      const result = event.results[current]
      const transcriptText = result[0].transcript
      setTranscript(transcriptText)
    }

    recognition.onerror = (event) => {
      setError(event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (diagnosticMode && transcript.trim()) {
          handleSmartAnalysis()
      }
    }

    recognition.start()
  }

  const stopListening = () => {
    setIsListening(false)
  }

  const speakText = async (text) => {
    if (!text) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('text', text)
      formData.append('language', language)

      const response = await axios.post(`${API_URL}/api/voice/synthesize`, formData, {
        responseType: 'blob'
      })
      
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      
      const audio = new Audio(url)
      audioRef.current = audio
      setIsBotSpeaking(true)
      
      return new Promise((resolve) => {
          audio.onended = () => {
              setLoading(false)
              setIsBotSpeaking(false)
              resolve()
          }
          audio.play().catch(e => {
              console.error("Audio play failed:", e)
              setLoading(false)
              setIsBotSpeaking(false)
              resolve()
          })
      })
    } catch (error) {
      console.error('TTS error:', error)
      setLoading(false)
      setIsBotSpeaking(false)
    }
  }

  const handleSmartAnalysis = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    try {
      // Step 1: Extract symptoms using LLM
      const extractPrompt = `Patient transcript: "${transcript}". 
      Return ONLY a JSON object mapping these exact keys to true/false: fever, cough, breathing, chest_pain, weakness, vomiting, diarrhea, headache, unconscious, bleeding, swelling, back_pain.
      No other text. Output Example: {"fever": true, "cough": false, ...}`
      
      const aiResponse = await axios.post(`${API_URL}/api/ai/chat`, {
        message: extractPrompt,
        language: 'en' // Keep prompt processing in en for reliability
      })
      
      let symptoms = {}
      try {
          const content = aiResponse.data.response
          const jsonStr = content.match(/\{.*\}/s)?.[0] || content
          symptoms = JSON.parse(jsonStr)
      } catch (e) {
          console.error("JSON parse error:", e)
      }
      
      // Step 2: Use ASHA analyzer with extracted symptoms
      const analysisResponse = await axios.post(`${API_URL}/api/asha/analyze`, {
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
          family_history_heart: 0,
          language: languageMap[language] || 'english'
        },
        symptoms: symptoms
      })
      
      if (analysisResponse.data.success) {
        setDiagnosticResult(analysisResponse.data)
        // Step 3: Speak out the results
        let message = ''
        if (analysisResponse.data.ai_insights) {
            message = analysisResponse.data.ai_insights
        } else {
            const urgencyText = analysisResponse.data.urgency_text
            message = `${globalT.yourHealthLevel} ${urgencyText}. ${analysisResponse.data.actions[0]}.`
        }
        
        await speakText(message)
      }
    } catch (err) {
      console.error("Smart Analysis Error:", err)
      setError("AI analysis failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in zoom-in duration-700 pb-20">
      {/* Header */}
      <div className="bg-[white] text-[slate-900] rounded-[3rem] p-12 shadow-2xl relative overflow-hidden flex items-center justify-between border border-[slate-200] group">
        <div className="relative z-10">
          <div className="flex items-center space-x-1 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Agentic AI Voice OS</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter mb-2 italic lowercase text-[slate-900]">agentic.voice</h2>
          <p className="text-[slate-700] font-bold opacity-80">{t.subtitle}</p>
        </div>
        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 group-hover:rotate-12 transition-transform duration-500">
           <Mic className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Interaction Core */}
        <div className="lg:col-span-12 xl:col-span-7 bg-[slate-50] rounded-[4rem] shadow-2xl p-12 border border-[slate-200] relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center space-y-10">
          
          <div className="text-center space-y-4 max-w-md">
             <h3 className="text-3xl font-black text-[slate-900] tracking-tighter italic">{diagnosticMode ? t.smartDiag : t.title}</h3>
             <p className="text-[slate-500] font-bold leading-relaxed">{diagnosticMode ? t.diagDesc : t.tapToTalk}</p>
          </div>

          <div className="relative">
             {isListening && (
                <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-25 scale-150"></div>
             )}
             {isBotSpeaking && (
                <>
                  <div className="absolute inset-0 bg-[blue-600] rounded-full animate-pulse opacity-20 scale-125"></div>
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center justify-center space-x-1 h-8 w-full max-w-[100px]">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-1.5 bg-[blue-600] rounded-full animate-audio-wave shadow-[0_0_10px_blue-50] h-full" style={{ animationDelay: `${i * 0.15}s` }}></div>
                    ))}
                  </div>
                </>
             )}
             
             <button
               disabled={isBotSpeaking || loading}
               onClick={isListening ? stopListening : (diagnosticMode ? speakInstructions : startListening)}
               className={`relative w-40 h-40 rounded-[3rem] flex items-center justify-center transition-all duration-700 shadow-3xl group ${
                 isListening 
                   ? 'bg-[rose-600] rotate-90 scale-110 shadow-rose-200/50' 
                   : diagnosticMode 
                     ? 'bg-[white] text-[slate-900] border border-[slate-200] hover:scale-110 shadow-slate-200/50 dark:shadow-[slate-200]'
                     : 'bg-[blue-600] text-white hover:scale-110 shadow-blue-100/50 dark:shadow-blue-900/50'
               }`}
             >
                {loading ? (
                  <Activity className="w-12 h-12 text-white animate-spin" />
                ) : isListening ? (
                  <Square className="w-10 h-10 fill-current" />
                ) : diagnosticMode ? (
                  <Brain className="w-12 h-12" />
                ) : (
                  <Mic className="w-14 h-14" />
                )}
             </button>
          </div>

          {!diagnosticMode ? (
             <button 
                onClick={() => setDiagnosticMode(true)}
                className="flex items-center space-x-4 px-10 py-6 bg-[white] hover:bg-[slate-50] border border-transparent hover:border-[slate-200] rounded-[2rem] transition-all group shadow-sm hover:shadow-xl active:scale-95"
             >
                <Sparkles className="w-6 h-6 text-[blue-600] group-hover:rotate-12 transition-transform" />
                <span className="font-black text-[slate-900] tracking-tight">{t.smartDiag}</span>
                <ArrowRight className="w-4 h-4 text-[slate-500] group-hover:translate-x-1 transition-transform" />
             </button>
          ) : (
             <button 
                onClick={() => {setDiagnosticMode(false); setDiagnosticResult(null); setTranscript('');}}
                className="text-[10px] font-black text-[slate-500] uppercase tracking-widest hover:text-[rose-600] transition-colors"
             >
                 Agentic AI Exit Protocol
             </button>
          )}

          {error && (
            <div className="w-full max-w-sm bg-rose-50 border border-rose-100 text-rose-500 p-4 rounded-2xl flex items-center justify-center space-x-3 text-sm font-black italic">
               <AlertCircle className="w-4 h-4" />
               <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Vector Feed */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-10">
          <div className="bg-[white] rounded-[3.5rem] p-10 h-full shadow-2xl border border-[slate-200] flex flex-col min-h-[500px]">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center space-x-3 px-5 py-2 bg-[blue-50] border border-[blue-600]/20 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-[emerald-600] animate-pulse"></div>
                  <span className="text-[10px] font-black text-[blue-600] uppercase tracking-widest">{t.transcript}</span>
               </div>
               <div className="space-x-1">
                  {[1,2,3].map(i => <div key={i} className="inline-block w-1.5 h-1.5 rounded-full bg-[slate-500]"></div>)}
               </div>
             </div>

             <div className="flex-1 bg-[slate-50] rounded-[2.5rem] border border-[slate-200] p-8 overflow-y-auto mb-8 transition-all hover:border-[slate-200] group">
                {transcript ? (
                  <p className="text-xl font-bold text-[slate-900] leading-relaxed italic tracking-tight">"{transcript}"</p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                     <Settings className="w-12 h-12 text-[slate-500] mb-4 animate-spin-slow" />
                     <p className="font-black text-xs uppercase tracking-widest text-[slate-500]">Awaiting Agentic AI Link...</p>
                  </div>
                )}
             </div>

             {diagnosticResult ? (
                <div className="bg-[slate-50] rounded-[2.5rem] p-8 shadow-3xl animate-in slide-in-from-bottom-5 duration-700 border border-[slate-200]">
                   <div className="flex items-center space-x-4 mb-6">
                      <div className={`p-4 rounded-2xl ${diagnosticResult.urgency === 'RED' ? 'bg-[rose-50]' : 'bg-[emerald-50]'}`}>
                         <ShieldCheck className={`w-8 h-8 ${diagnosticResult.urgency === 'RED' ? 'text-[rose-600]' : 'text-[emerald-600]'}`} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-[slate-500] uppercase tracking-widest mb-1">{t.diagResult}</p>
                         <h4 className="text-2xl font-black text-[slate-900] tracking-tighter italic">{diagnosticResult.urgency_text}</h4>
                      </div>
                   </div>
                   <div className="space-y-4">
                      {diagnosticResult.actions?.slice(0, 2).map((action, i) => (
                        <div key={i} className="flex items-start space-x-3 p-4 bg-[white] rounded-2xl border border-[slate-200] italic">
                           <Activity className="w-4 h-4 text-[blue-600] mt-0.5 flex-shrink-0" />
                           <span className="text-xs font-bold text-[slate-700]">{action}</span>
                        </div>
                      ))}
                   </div>
                   <button 
                    onClick={() => setDiagnosticResult(null)}
                    className="w-full mt-6 py-4 bg-[white] text-[slate-900] border border-[slate-200] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all"
                   >
                     {t.reListen}
                   </button>
                </div>
             ) : (
                <button
                  disabled={!transcript || loading}
                  onClick={() => diagnosticMode ? handleSmartAnalysis() : speakText(transcript)}
                  className="w-full bg-[slate-50] text-[blue-600] py-6 rounded-3xl font-black flex items-center justify-center space-x-3 shadow-2xl hover:bg-[white] transition-all border-4 border-[slate-200] active:scale-95 disabled:opacity-50"
                >
                   {loading ? (
                     <Activity className="w-6 h-6 animate-spin" />
                   ) : (
                     <>
                        {diagnosticMode ? <Brain className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                        <span className="uppercase tracking-widest text-xs italic">{diagnosticMode ? t.diagResult : t.play}</span>
                     </>
                   )}
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceInput
