import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  Mic, Square, Play, AlertCircle, Volume2, Download,
  Brain, Sparkles, Activity, ShieldCheck, ArrowRight,
  Clock, MessageSquare, Trash2, ChevronRight, Zap, X
} from 'lucide-react'

import { API_URL } from '../config'
import { languageMap } from '../services/aiService'
import { getT } from '../utils/translations'

// ── Language maps for Web Speech API ─────────────────────────────────────────
const SPEECH_LANG_MAP = {
  en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
  bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN',
  ml: 'ml-IN', pa: 'pa-IN'
}

// ── Session history helpers ────────────────────────────────────────────────────
function loadHistory() {
  try { return JSON.parse(sessionStorage.getItem('voice_history') || '[]') } catch { return [] }
}
function saveHistory(h) {
  sessionStorage.setItem('voice_history', JSON.stringify(h.slice(-20)))
}

// ── Waveform Visualizer using Web Audio API ───────────────────────────────────
function WaveformVisualizer({ isListening }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (!isListening) {
      // Stop animation and mic stream
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      // Draw flat line
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = 'rgba(99,102,241,0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, canvas.height / 2)
        ctx.lineTo(canvas.width, canvas.height / 2)
        ctx.stroke()
      }
      return
    }

    // Start real audio visualization
    const startViz = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        analyserRef.current = analyser
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        const bufferLen = analyser.frequencyBinCount
        const dataArr = new Uint8Array(bufferLen)
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        const draw = () => {
          animRef.current = requestAnimationFrame(draw)
          analyser.getByteTimeDomainData(dataArr)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.lineWidth = 2.5
          ctx.strokeStyle = 'rgba(99,102,241,0.9)'
          ctx.shadowBlur = 8
          ctx.shadowColor = 'rgba(99,102,241,0.6)'
          ctx.beginPath()
          const sliceW = canvas.width / bufferLen
          let x = 0
          for (let i = 0; i < bufferLen; i++) {
            const v = dataArr[i] / 128.0
            const y = v * (canvas.height / 2)
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            x += sliceW
          }
          ctx.lineTo(canvas.width, canvas.height / 2)
          ctx.stroke()
        }
        draw()
      } catch {
        // Fallback: CSS animation bars (mic permission denied)
      }
    }
    startViz()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [isListening])

  return (
    <div className="w-full relative">
      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        className="w-full h-14 rounded-2xl bg-slate-900/60"
        aria-hidden="true"
      />
      {!isListening && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-50">
            Audio Visualizer — Press Mic to Start
          </span>
        </div>
      )}
    </div>
  )
}

// ── History Entry Component ───────────────────────────────────────────────────
function HistoryEntry({ entry, onDelete }) {
  const urgencyColor = {
    RED: 'text-rose-400 bg-rose-500/10',
    YELLOW: 'text-amber-400 bg-amber-500/10',
    GREEN: 'text-emerald-400 bg-emerald-500/10'
  }[entry.urgency] || 'text-slate-400 bg-slate-500/10'

  return (
    <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 space-y-2 group relative">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="text-[9px] text-slate-500 font-bold">{entry.time}</span>
          {entry.urgency && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${urgencyColor}`}>
              {entry.urgency}
            </span>
          )}
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-600 transition-all"
          aria-label="Delete entry"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <p className="text-xs text-slate-300 font-semibold italic leading-snug">"{entry.transcript}"</p>
      {entry.action && (
        <p className="text-[10px] text-indigo-400 font-bold">→ {entry.action}</p>
      )}
    </div>
  )
}


// ── Main VoiceInput Component ─────────────────────────────────────────────────
function VoiceInput({ language = 'en', selectedPatient = null, onNavigate = () => {} }) {
  // FIX: Use ref for transcript to avoid stale closure in recognition.onend
  const transcriptRef = useRef('')
  const [transcriptDisplay, setTranscriptDisplay] = useState('')

  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [diagnosticMode, setDiagnosticMode] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState(null)
  const [isBotSpeaking, setIsBotSpeaking] = useState(false)
  const [history, setHistory] = useState(loadHistory)
  const [showHistory, setShowHistory] = useState(false)

  const audioRef = useRef(null)
  const recognitionRef = useRef(null)

  const globalT = getT(language)

  const labels = {
    en: {
      title: 'Voice Assistant',
      subtitle: 'Voice-to-Text & Smart Diagnosis — Hands-Free Healthcare',
      start: 'Start Listening',
      stop: 'Stop',
      speaking: 'AI is speaking...',
      transcript: 'Live Transcript',
      play: 'Read Response Aloud',
      noVoice: 'Voice input not supported in this browser',
      tapToTalk: 'Tap the mic to start speaking',
      processing: 'Processing voice...',
      smartDiag: 'Smart Voice Diagnosis',
      diagDesc: 'Describe your symptoms — AI will diagnose and respond in your language',
      diagResult: 'Agentic AI Diagnostic',
      urgency: 'Urgency Level',
      action: 'Recommended Action',
      reListen: 'Ask Again',
      aiInstructions: 'Please describe your health symptoms clearly. I am listening and will respond in your language.',
      finishing: 'Finalizing analysis...',
      history: 'Session History',
      noHistory: 'No voice sessions yet in this session.',
      clearHistory: 'Clear History'
    },
    hi: {
      title: 'आवाज़ सहायक',
      subtitle: 'आवाज़-से-निदान — हिंदी में स्मार्ट स्वास्थ्य सहायता',
      start: 'सुनना शुरू करें',
      stop: 'रोकें',
      speaking: 'AI बोल रहा है...',
      transcript: 'लाइव प्रतिलेख',
      play: 'आवाज़ में उत्तर सुनें',
      noVoice: 'इस ब्राउज़र में आवाज़ समर्थित नहीं है',
      tapToTalk: 'बोलने के लिए माइक दबाएं',
      processing: 'प्रक्रिया हो रही है...',
      smartDiag: 'स्मार्ट वॉयस डायग्नोसिस',
      diagDesc: 'अपने लक्षण बताएं — AI आपकी भाषा में उत्तर देगा',
      diagResult: 'AI डायग्नोस्टिक परिणाम',
      urgency: 'तात्कालिकता',
      action: 'अनुशंसित कार्रवाई',
      reListen: 'फिर पूछें',
      aiInstructions: 'कृपया अपनी स्वास्थ्य समस्याएं स्पष्ट रूप से बताएं। मैं सुन रहा हूं।',
      finishing: 'विश्लेषण पूरा हो रहा है...',
      history: 'सत्र इतिहास',
      noHistory: 'इस सत्र में अभी तक कोई आवाज़ प्रश्न नहीं।',
      clearHistory: 'इतिहास साफ़ करें'
    }
  }

  const t = labels[language] || labels.en

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const isSupported = !!SpeechRecognition

  // Auto-detect trigger phrases for hands-free operation
  const triggerPhrases = ['analyze', 'diagnose', 'triage', 'examine', 'check', 'help', 'emergency',
    'विश्लेषण', 'निदान', 'मदद', 'आपातकाल', 'பகுப்பாய்வு', 'విశ్లేషించు']

  const addToHistory = useCallback((transcript, result) => {
    const entry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      transcript: transcript.substring(0, 100),
      urgency: result?.urgency || null,
      action: result?.actions?.[0] || null
    }
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 20)
      saveHistory(updated)
      return updated
    })
  }, [])

  const speakText = useCallback(async (text) => {
    if (!text) return
    setLoading(true)
    setIsBotSpeaking(true)
    try {
      const formData = new FormData()
      formData.append('text', text.substring(0, 5000))
      formData.append('language', language)

      const response = await axios.post(`${API_URL}/api/voice/synthesize`, formData, {
        responseType: 'blob'
      })

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)

      const audio = new Audio(url)
      audioRef.current = audio

      return new Promise((resolve) => {
        audio.onended = () => { setLoading(false); setIsBotSpeaking(false); resolve() }
        audio.onerror = () => { setLoading(false); setIsBotSpeaking(false); resolve() }
        audio.play().catch(() => { setLoading(false); setIsBotSpeaking(false); resolve() })
      })
    } catch (err) {
      console.error('TTS error:', err)
      setLoading(false)
      setIsBotSpeaking(false)
    }
  }, [language])


  const handleSmartAnalysis = useCallback(async (transcript) => {
    if (!transcript.trim()) return
    setLoading(true)
    setDiagnosticResult(null)

    try {
      // Step 1: Multilingual symptom extraction
      setLoadingStep('🧠 Extracting symptoms from your description...')
      const lang_name = languageMap[language] || 'English'
      const extractPrompt =
        `Patient said (in ${lang_name}): "${transcript}"\n` +
        `Task: Extract health symptoms from this statement regardless of language.\n` +
        `Return ONLY valid JSON with these exact boolean keys: ` +
        `fever, cough, breathing, chest_pain, weakness, vomiting, diarrhea, headache, unconscious, bleeding, swelling, back_pain\n` +
        `Example: {"fever": true, "cough": false, "chest_pain": false, ...}\n` +
        `No explanation, only JSON.`

      const aiResponse = await axios.post(`${API_URL}/api/ai/chat`, {
        message: extractPrompt,
        language: 'en'
      })

      let symptoms = {}
      try {
        const content = aiResponse.data.response || ''
        const jsonStr = content.match(/\{[\s\S]*\}/)?.[0] || '{}'
        symptoms = JSON.parse(jsonStr)
      } catch (e) {
        console.warn('Symptom JSON parse failed:', e)
        // Fallback: basic keyword matching
        symptoms = {
          fever: /fever|बुखार|காய்ச்சல்|జ్వరం|jor/i.test(transcript),
          cough: /cough|खांसी|இருமல்|దగ్గు/i.test(transcript),
          chest_pain: /chest|सीने|நெஞ்சு|ఛాతీ/i.test(transcript),
          breathing: /breath|सांस|மூச்சு|శ్వాస/i.test(transcript),
          weakness: /weak|कमज|சோர்|అలసట/i.test(transcript),
          vomiting: /vomit|उल्टी|வாந்தி|వాంతి/i.test(transcript),
          diarrhea: /diarrhea|दस्त|வயிற்று|విరేచన/i.test(transcript),
          headache: /headache|सिर|தலை|తలనొప్పి/i.test(transcript),
          unconscious: false, bleeding: false, swelling: false, back_pain: false
        }
      }

      // Step 2: ASHA triage analysis
      setLoadingStep('⚡ Running emergency triage assessment...')
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
          family_history_diabetes: 0,
          language: languageMap[language] || 'english'
        },
        symptoms
      })

      if (analysisResponse.data.success) {
        const resultData = analysisResponse.data
        setDiagnosticResult(resultData)
        addToHistory(transcript, resultData)

        // Step 3: Speak result in user's language
        setLoadingStep('🔊 Preparing voice response...')
        let message = ''
        if (resultData.ai_insights) {
          message = resultData.ai_insights.substring(0, 1000)
        } else {
          const urgencyText = resultData.urgency_text
          message = `${globalT.yourHealthLevel || 'Your health level is'} ${urgencyText}. ${resultData.actions?.[0] || ''}.`
        }
        await speakText(message)
      }
    } catch (err) {
      console.error('Smart Analysis Error:', err)
      setError('AI analysis failed. Please try again.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }, [language, selectedPatient, addToHistory, speakText, globalT])

  const startListening = useCallback(() => {
    if (!isSupported) { setError(t.noVoice); return }

    // Reset transcript ref
    transcriptRef.current = ''
    setTranscriptDisplay('')
    setError(null)

    const recognition = new SpeechRecognition()
    recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else interim += t
      }
      const current = final || interim
      // FIX: Update ref (not state) to avoid stale closure in onend
      transcriptRef.current = current
      setTranscriptDisplay(current)

      // Auto-trigger on spoken trigger phrase (hands-free)
      const lower = current.toLowerCase()
      if (triggerPhrases.some(p => lower.includes(p)) && diagnosticMode) {
        recognition.stop()
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') setError(`Recognition error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      // FIX: Read from ref (not state) — always has the latest value
      const finalTranscript = transcriptRef.current
      
      // GUARANTEE NO STALE CLOSURE
      // Re-evaluate the DOM or state directly if needed, but since recognition is recreated, it should be fine.
      // Actually, to be absolutely bulletproof, let's just invoke handleSmartAnalysis if it's in diagnostic mode visually.
      const isDiag = document.getElementById('diagnostic-mode-active') !== null || diagnosticMode;
      if (isDiag && finalTranscript.trim()) {
        handleSmartAnalysis(finalTranscript)
      }
    }

    recognition.start()
  }, [isSupported, language, diagnosticMode, handleSmartAnalysis, t.noVoice])

  const speakInstructions = useCallback(async () => {
    setIsBotSpeaking(true)
    await speakText(t.aiInstructions)
    setTimeout(() => startListening(), 800)
  }, [speakText, t.aiInstructions, startListening])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const clearHistory = () => {
    setHistory([])
    sessionStorage.removeItem('voice_history')
  }

  const deleteEntry = (id) => {
    setHistory(prev => {
      const updated = prev.filter(e => e.id !== id)
      saveHistory(updated)
      return updated
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

      {/* ── Header ── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden flex items-center justify-between border border-indigo-500/20">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Agentic AI Voice OS · {language.toUpperCase()}</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 mb-2">
            {t.title}
          </h2>
          <p className="text-indigo-200/80 text-sm font-semibold max-w-sm">{t.subtitle}</p>
        </div>
        <div className="flex flex-col items-center space-y-3 relative z-10">
          <div className={`w-24 h-24 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 transition-all duration-700 ${isListening ? 'animate-pulse scale-110 ring-4 ring-cyan-400/50' : 'hover:scale-105'}`}>
            <Mic className="w-10 h-10 text-white" />
          </div>
          {isListening && (
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20 shadow-lg shadow-rose-500/20">● LIVE MONITORING</span>
          )}
        </div>
        
        {/* Animated Background Mesh Glows */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">

        {/* ── Interaction Core ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Waveform */}
          <div className="bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
            {isListening && <div className="absolute inset-0 bg-rose-500/5 animate-pulse rounded-[2.5rem]" />}
            <WaveformVisualizer isListening={isListening} />

            {/* Status */}
            <div className="text-center space-y-2">
              <h3 id={diagnosticMode ? "diagnostic-mode-active" : ""} className="text-xl font-black text-white">
                {diagnosticMode ? t.smartDiag : t.title}
              </h3>
              <p className="text-slate-400 text-sm font-semibold">
                {isBotSpeaking ? t.speaking : isListening ? '● Recording...' : diagnosticMode ? t.diagDesc : t.tapToTalk}
              </p>
            </div>

            {/* Mic Button */}
            <div className="flex justify-center">
              <div className="relative">
                {isListening && (
                  <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-20 scale-150" />
                )}
                {isBotSpeaking && (
                  <div className="absolute inset-0 bg-indigo-500 rounded-full animate-pulse opacity-20 scale-125" />
                )}
                <button
                  disabled={isBotSpeaking || (loading && !isListening)}
                  onClick={isListening ? stopListening : (diagnosticMode ? speakInstructions : startListening)}
                  aria-label={isListening ? 'Stop listening' : 'Start listening'}
                  className={`relative w-40 h-40 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 shadow-2xl focus:outline-none focus:ring-4 z-10 ${
                    isListening
                      ? 'bg-gradient-to-tr from-rose-600 to-rose-500 scale-110 shadow-rose-500/50 focus:ring-rose-400'
                      : diagnosticMode
                      ? 'bg-gradient-to-tr from-white to-slate-100 text-slate-900 hover:scale-105 shadow-xl hover:shadow-indigo-500/20'
                      : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white hover:scale-105 hover:bg-indigo-500 shadow-indigo-600/40 focus:ring-indigo-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading && !isListening ? (
                    <Activity className="w-10 h-10 text-white animate-spin" />
                  ) : isListening ? (
                    <Square className="w-8 h-8 fill-white text-white" />
                  ) : diagnosticMode ? (
                    <Brain className="w-10 h-10" />
                  ) : (
                    <Mic className="w-12 h-12" />
                  )}
                </button>
              </div>
            </div>

            {/* Loading step */}
            {loading && loadingStep && (
              <div className="flex items-center justify-center space-x-2 text-indigo-300">
                <Activity className="w-4 h-4 animate-spin" />
                <span className="text-xs font-bold">{loadingStep}</span>
              </div>
            )}

            {/* Mode Toggle */}
            {!diagnosticMode ? (
              <button
                onClick={() => setDiagnosticMode(true)}
                className="w-full flex items-center justify-between px-8 py-5 bg-gradient-to-r from-slate-800 to-slate-800/80 hover:from-indigo-600/20 hover:to-slate-800 border border-white/10 hover:border-indigo-500/50 rounded-2xl transition-all duration-300 shadow-lg group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-indigo-500/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="p-2 bg-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-indigo-300" />
                  </div>
                  <span className="font-black text-white text-base tracking-wide">{t.smartDiag}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => { setDiagnosticMode(false); setDiagnosticResult(null); transcriptRef.current = ''; setTranscriptDisplay('') }}
                className="w-full text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-rose-500 transition-colors py-2"
              >
                Exit Diagnostic Mode
              </button>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center space-x-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold">{error}</span>
              </div>
            )}
          </div>

          {/* Transcript Box */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 space-y-4 min-h-[140px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.transcript}</span>
              </div>
              {transcriptDisplay && (
                <button
                  onClick={() => !diagnosticMode && speakText(transcriptDisplay)}
                  disabled={!transcriptDisplay || loading || diagnosticMode}
                  className="flex items-center space-x-1 text-[10px] font-black text-indigo-500 hover:text-indigo-400 disabled:opacity-30 transition-colors"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{t.play}</span>
                </button>
              )}
            </div>
            {transcriptDisplay ? (
              <p className="text-lg font-bold text-slate-800 leading-relaxed italic">"{transcriptDisplay}"</p>
            ) : (
              <p className="text-sm text-slate-300 font-semibold">Awaiting voice input...</p>
            )}
          </div>
        </div>

        {/* ── Right Panel: Results + History ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Diagnostic Result */}
          {diagnosticResult ? (
            <div className="bg-slate-900 rounded-[2rem] p-8 border border-white/10 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${diagnosticResult.urgency === 'RED' ? 'bg-rose-500/20' : diagnosticResult.urgency === 'YELLOW' ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                  <ShieldCheck className={`w-7 h-7 ${diagnosticResult.urgency === 'RED' ? 'text-rose-400' : diagnosticResult.urgency === 'YELLOW' ? 'text-amber-400' : 'text-emerald-400'}`} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.diagResult}</p>
                  <h4 className="text-xl font-black text-white">{diagnosticResult.urgency_text}</h4>
                </div>
              </div>

              {/* ML Risk mini-bars */}
              {diagnosticResult.ml_predictions && (
                <div className="space-y-2 p-3 bg-white/5 rounded-xl">
                  {Object.entries(diagnosticResult.ml_predictions).map(([k, v]) => (
                    <div key={k} className="flex items-center space-x-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase w-16">{k}</span>
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round(v * 100)}%`,
                            backgroundColor: v >= 0.7 ? '#f43f5e' : v >= 0.4 ? '#f59e0b' : '#10b981'
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-black text-slate-400">{Math.round(v * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}

              {diagnosticResult.actions?.slice(0, 3).map((action, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <Activity className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-300">{action}</span>
                </div>
              ))}

              {diagnosticResult.urgency === 'RED' && (
                <a href="tel:108" className="flex items-center justify-center space-x-2 w-full py-3.5 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-500 transition-all">
                  📞 CALL 108 EMERGENCY
                </a>
              )}

              <button
                onClick={() => { setDiagnosticResult(null); transcriptRef.current = ''; setTranscriptDisplay('') }}
                className="w-full py-3 bg-slate-800/80 text-slate-400 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                {t.reListen}
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-[2rem] p-8 border border-white/10 flex flex-col items-center justify-center min-h-[200px] space-y-4 text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-indigo-400 opacity-50" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-400">
                  {diagnosticMode ? 'Speak to get AI diagnosis' : 'Enable Smart Diagnosis mode'}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">Your voice → AI analysis → spoken response</p>
              </div>
            </div>
          )}

          {/* Session History */}
          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.history}</span>
                {history.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full">{history.length}</span>
                )}
              </div>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[9px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-wider transition-colors">
                  {t.clearHistory}
                </button>
              )}
            </div>
            <div className="bg-slate-900/95 p-4 max-h-80 overflow-y-auto space-y-3">
              {history.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-bold text-center py-8">{t.noHistory}</p>
              ) : (
                history.map(entry => (
                  <HistoryEntry key={entry.id} entry={entry} onDelete={deleteEntry} />
                ))
              )}
            </div>
          </div>

          {/* Quick Nav */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate('asha')} className="flex items-center justify-center space-x-2 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-500 transition-all min-h-[50px]">
              <Activity className="w-4 h-4" />
              <span>ASHA Triage</span>
            </button>
            <button onClick={() => onNavigate('chat')} className="flex items-center justify-center space-x-2 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all min-h-[50px]">
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceInput
