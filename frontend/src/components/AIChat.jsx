import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  MessageSquare, Send, Sparkles, User, Brain, AlertCircle,
  RefreshCcw, Zap, Terminal, ShieldAlert, Activity, Volume2, Pause,
  Mic, Square, Globe, Copy, Check
} from 'lucide-react'

import { API_URL } from '../config'
import aiService from '../services/aiService'

// ── Language map for Web Speech API ──────────────────────────────────────────
const SPEECH_LANG_MAP = {
  en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
  bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN',
  ml: 'ml-IN', pa: 'pa-IN'
}

// ── Welcome messages for all 10 languages ─────────────────────────────────────
const WELCOME_MESSAGES = {
  en: "Hello! I am your AI Health Specialist powered by Gemini & Groq Llama. I've reviewed your clinical profile. How can I help you today?",
  hi: "नमस्ते! मैं आपका AI स्वास्थ्य सहायक हूं — Gemini और Groq Llama द्वारा संचालित। आपकी क्लिनिकल प्रोफ़ाइल की समीक्षा कर ली है। मैं आपकी कैसे सहायता कर सकता हूं?",
  ta: "வணக்கம்! நான் உங்கள் AI ஆரோக்கிய நிபுணர் — Gemini மற்றும் Groq மூலம் இயங்குகிறேன். உங்கள் மருத்துவ சுயவிவரத்தை ஆய்வு செய்தேன். நான் உங்களுக்கு எவ்வாறு உதவலாம்?",
  te: "నమస్కారం! నేను మీ AI ఆరోగ్య నిపుణుడిని — Gemini & Groq Llama ద్వారా. మీ క్లినికల్ ప్రొఫైల్ సమీక్షించాను. నేను మీకు ఎలా సహాయపడగలను?",
  bn: "নমস্কার! আমি আপনার AI স্বাস্থ্য বিশেষজ্ঞ — Gemini এবং Groq দ্বারা চালিত। আপনার ক্লিনিকাল প্রোফাইল পর্যালোচনা করা হয়েছে। আমি কীভাবে সাহায্য করতে পারি?",
  mr: "नमस्कार! मी तुमचा AI आरोग्य तज्ञ आहे — Gemini आणि Groq Llama द्वारे. तुमची क्लिनिकल प्रोफाइल तपासली आहे. मी तुम्हाला कशी मदत करू शकतो?",
  gu: "નમસ્તે! હું તમારો AI આરોગ્ય નિષ્ણાત છું — Gemini અને Groq Llama દ્વારા. તમારી ક્લિનિકલ પ્રોફાઇલ સમીક્ષા કરી. હું તમારી કેવી રીતે સહાય કરી શકું?",
  kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಆರೋಗ್ಯ ತಜ್ಞ — Gemini ಮತ್ತು Groq Llama ಮೂಲಕ. ನಿಮ್ಮ ಕ್ಲಿನಿಕಲ್ ಪ್ರೊಫೈಲ್ ಪರಿಶೀಲಿಸಿದ್ದೇನೆ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
  ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI ആരോഗ്യ വിദഗ്ദ്ധൻ — Gemini, Groq Llama വഴി. നിങ്ങളുടെ ക്ലിനിക്കൽ പ്രൊഫൈൽ അവലോകനം ചെയ്തു. ഞാൻ എങ്ങനെ സഹായിക്കാം?",
  pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ AI ਸਿਹਤ ਮਾਹਰ ਹਾਂ — Gemini ਅਤੇ Groq ਦੁਆਰਾ। ਤੁਹਾਡੀ ਕਲੀਨਿਕਲ ਪ੍ਰੋਫਾਈਲ ਦੀ ਸਮੀਖਿਆ ਕੀਤੀ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?"
}

// ── Quick prompts for all 10 languages ───────────────────────────────────────
const QUICK_PROMPTS = {
  en: ['Diabetes protocol?', 'Heart health?', 'Hypertension tips?', 'ASHA worker role?'],
  hi: ['मधुमेह प्रबंधन?', 'हृदय स्वास्थ्य?', 'उच्च रक्तचाप?', 'ASHA कार्यकर्ता?'],
  ta: ['நீரிழிவு நோய்?', 'இதய ஆரோக்கியம்?', 'உயர் இரத்த அழுத்தம்?', 'ASHA பணி?'],
  te: ['మధుమేహం?', 'గుండె ఆరోగ్యం?', 'రక్తపోటు?', 'ASHA పని?'],
  bn: ['ডায়াবেটিস?', 'হৃদয় স্বাস্থ্য?', 'উচ্চ রক্তচাপ?', 'ASHA কর্মী?'],
  mr: ['मधुमेह?', 'हृदय आरोग्य?', 'उच्च रक्तदाब?', 'ASHA कार्यकर्ता?'],
  gu: ['ડાયાબિટીઝ?', 'હૃદય આરોગ્ય?', 'ઉચ્ચ રક્તદાબ?', 'ASHA કાર્યકર?'],
  kn: ['ಮಧುಮೇಹ?', 'ಹೃದಯ ಆರೋಗ್ಯ?', 'ರಕ್ತದೊತ್ತಡ?', 'ASHA ಕಾರ್ಯಕರ್ತ?'],
  ml: ['പ്രമേഹം?', 'ഹൃദയ ആരോഗ്യം?', 'രക്തസമ്മർദ്ദം?', 'ASHA ജോലി?'],
  pa: ['ਸ਼ੂਗਰ?', 'ਦਿਲ ਦੀ ਸਿਹਤ?', 'ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ?', 'ASHA ਕਾਰਕੁਨ?']
}

// ── UI label strings ──────────────────────────────────────────────────────────
const UI_LABELS = {
  en: { placeholder: 'Ask a clinical question...', send: 'Send', title: 'AI Clinical Copilot', subtitle: 'Multilingual Diagnostic Intelligence', suggested: 'Common Protocols', typing: 'AI is analyzing...' },
  hi: { placeholder: 'प्रश्न पूछें...', send: 'भेजें', title: 'AI स्वास्थ्य सहायक', subtitle: 'बहुभाषी निदान बुद्धिमत्ता', suggested: 'सामान्य प्रोटोकॉल', typing: 'AI विचार कर रहा है...' },
  ta: { placeholder: 'மருத்துவ கேள்வி கேளுங்கள்...', send: 'அனுப்பு', title: 'AI மருத்துவ தோழர்', subtitle: 'பல மொழி நோயறிதல்', suggested: 'நெறிமுறைகள்', typing: 'AI பகுப்பாய்கிறது...' },
  te: { placeholder: 'వైద్య పశ్న అడగండి...', send: 'పంపు', title: 'AI క్లినికల్ కో-పైలట్', subtitle: 'బహుభాషా నిర్ధారణ', suggested: 'సాధారణ ప్రోటోకాల్', typing: 'AI విశ్లేషిస్తున్నది...' },
  bn: { placeholder: 'চিকিৎসা প্রশ্ন করুন...', send: 'পাঠান', title: 'AI ক্লিনিক্যাল কো-পাইলট', subtitle: 'বহুভাষিক নির্ণয়', suggested: 'প্রোটোকল', typing: 'AI বিশ্লেষণ করছে...' },
  mr: { placeholder: 'वैद्यकीय प्रश्न विचारा...', send: 'पाठवा', title: 'AI क्लिनिकल को-पायलट', subtitle: 'बहुभाषिक निदान', suggested: 'प्रोटोकॉल', typing: 'AI विश्लेषण करत आहे...' },
  gu: { placeholder: 'તબીબી પ્રશ્ન પૂછો...', send: 'મોકલો', title: 'AI ક્લિનિકલ કો-પાઇલટ', subtitle: 'બહુભાષી નિદાન', suggested: 'પ્રોટોકોલ', typing: 'AI વિશ્લેષણ કરી રહ્યો છે...' },
  kn: { placeholder: 'ವೈದ್ಯಕೀಯ ಪ್ರಶ್ನೆ ಕೇಳಿ...', send: 'ಕಳುಹಿಸಿ', title: 'AI ಕ್ಲಿನಿಕಲ್ ಕೊ-ಪೈಲಟ್', subtitle: 'ಬಹುಭಾಷಾ ನಿರ್ಣಯ', suggested: 'ಪ್ರೋಟೋಕಾಲ್', typing: 'AI ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...' },
  ml: { placeholder: 'വൈദ്യ ചോദ്യം ചോദിക്കൂ...', send: 'അയക്കൂ', title: 'AI ക്ലിനിക്കൽ കോ-പൈലറ്റ്', subtitle: 'ബഹുഭാഷാ നിർണ്ണയം', suggested: 'പ്രോട്ടോകോൾ', typing: 'AI വിശകലനം ചെയ്യുന്നു...' },
  pa: { placeholder: 'ਡਾਕਟਰੀ ਸਵਾਲ ਪੁੱਛੋ...', send: 'ਭੇਜੋ', title: 'AI ਕਲੀਨਿਕਲ ਕੋ-ਪਾਇਲਟ', subtitle: 'ਬਹੁਭਾਸ਼ੀ ਨਿਦਾਨ', suggested: 'ਪ੍ਰੋਟੋਕੋਲ', typing: 'AI ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਿਹਾ ਹੈ...' }
}

// ── Mic Voice-to-Chat hook ────────────────────────────────────────────────────
function useMicToChat(language, onTranscript) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const supported = !!SpeechRecognition

  const start = useCallback(() => {
    if (!supported) return
    transcriptRef.current = ''
    const recognition = new SpeechRecognition()
    recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN'
    recognition.interimResults = true
    recognition.continuous = false
    recognitionRef.current = recognition

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (e) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      transcriptRef.current = final || interim
      onTranscript(transcriptRef.current, false)
    }
    recognition.onend = () => {
      setIsListening(false)
      if (transcriptRef.current.trim()) onTranscript(transcriptRef.current, true)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.start()
  }, [supported, language, onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { isListening, supported, start, stop }
}

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ message, index, onPlayAudio, audioLoading, playingIndex, onCopy, copiedIndex }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex items-start space-x-4 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
        isUser ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
      }`}>
        {isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] px-6 py-5 rounded-2xl relative ${
        isUser
          ? 'bg-blue-600 text-white rounded-tr-none'
          : 'bg-slate-50 text-[var(--text-primary)] rounded-tl-none border border-[var(--border-light)]'
      }`}>
        {/* AI header metadata */}
        {!isUser && (
          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center space-x-2 opacity-40">
              <Terminal className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">AI Response</span>
            </div>
            {message.agent_status && (
              <div className="flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <Zap className="w-2.5 h-2.5 text-emerald-500" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                  {message.agent_status}
                </span>
              </div>
            )}
          </div>
        )}

        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'font-medium' : 'text-[var(--text-primary)]'}`}>
          {message.content}
        </p>

        {/* AI actions: TTS + Copy */}
        {!isUser && (
          <div className="mt-4 flex items-center justify-end space-x-2">
            {playingIndex === index && (
              <div className="flex items-center space-x-0.5 h-4 mr-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1 bg-blue-500 rounded-full animate-bounce h-full" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
            {/* Copy button */}
            <button
              onClick={() => onCopy(message.content, index)}
              className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Copy response"
              title="Copy"
            >
              {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {/* TTS button */}
            <button
              onClick={() => onPlayAudio(message.content, index)}
              disabled={audioLoading !== null}
              aria-label="Read aloud"
              className={`p-2 rounded-lg transition-colors ${
                playingIndex === index ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-400'
              }`}
            >
              {audioLoading === index
                ? <Activity className="w-4 h-4 animate-spin" />
                : playingIndex === index
                ? <Pause className="w-4 h-4" />
                : <Volume2 className="w-4 h-4" />
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


// ── Main AIChat Component ──────────────────────────────────────────────────────
function AIChat({ language = 'en', selectedPatient = null, chatContext = null, clearContext = () => {}, onNavigate = () => {} }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME_MESSAGES[language] || WELCOME_MESSAGES.en }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [audioLoading, setAudioLoading] = useState(null)
  const [playingIndex, setPlayingIndex] = useState(null)
  const [audioInstance, setAudioInstance] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [patientData] = useState({
    age: selectedPatient?.age || 45,
    gender: selectedPatient?.gender === 1 ? 'Female' : 'Male',
    glucose: selectedPatient?.glucose || 110,
    hba1c: selectedPatient?.hba1c || 5.7,
    bp: selectedPatient?.bp_systolic || 125,
    bmi: selectedPatient?.bmi || 26,
    creatinine: selectedPatient?.creatinine || 1.0,
    cholesterol: selectedPatient?.cholesterol || 180,
    smoking: selectedPatient?.smoking || 0,
    family_history_diabetes: selectedPatient?.family_history_diabetes || 0,
    family_history_heart: selectedPatient?.family_history_heart || 0
  })
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  const t = UI_LABELS[language] || UI_LABELS.en
  const quickQuestions = QUICK_PROMPTS[language] || QUICK_PROMPTS.en

  // ── Voice to chat ────────────────────────────────────────────────────────────
  const handleVoiceTranscript = useCallback((text, isFinal) => {
    setInput(text)
    // Auto-send when speech ends and there's content
    if (isFinal && text.trim()) {
      // Short delay to let UI update before sending
      setTimeout(() => {
        setInput('')
        handleSend(text)
      }, 300)
    }
  }, [])

  const { isListening, supported: voiceSupported, start: startMic, stop: stopMic } = useMicToChat(language, handleVoiceTranscript)

  const handleSend = async (forcedText = null) => {
    const textToSend = forcedText || input
    if (!textToSend.trim() || loading) return

    const userMessage = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Phase 1: Fetch ML risks if patient is selected
      let mlRisks = null
      if (selectedPatient) {
        try {
          const mlResponse = await axios.post(`${API_URL}/api/predict/all`, {
            age: patientData.age, gender: selectedPatient.gender === 1 ? 'Female' : 'Male',
            glucose: patientData.glucose, hba1c: patientData.hba1c,
            bp: patientData.bp, bmi: patientData.bmi,
            creatinine: patientData.creatinine, cholesterol: patientData.cholesterol,
            smoking: patientData.smoking, physical_activity: selectedPatient.physical_activity || 0,
            family_history_diabetes: patientData.family_history_diabetes,
            family_history_heart: patientData.family_history_heart
          })
          if (mlResponse.data.success) mlRisks = mlResponse.data.predictions
        } catch {
          // ML risks optional — continue without
        }
      }

      // Phase 2: AI response (Backend-first: Gemini / Groq fallback)
      const response = await aiService.chatWithAI(
        textToSend,
        mlRisks ? { ...patientData, predictions: mlRisks } : patientData,
        messages,
        language
      )

      if (response.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.response,
          agent_status: response.agent_status
        }])
      } else {
        throw new Error(response.error || 'AI response failed')
      }
    } catch (err) {
      const errorText = err.message?.includes('quota') || err.message?.includes('limit')
        ? (language === 'hi' ? 'AI कोटा समाप्त।' : 'API quota exceeded — please retry in a moment.')
        : (language === 'hi' ? 'सर्वर त्रुटि।' : 'Connection error. Please try again.')
      setError(errorText)
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errorText}` }])
    }
    setLoading(false)
  }

  // ── Chat context injection from other tabs ────────────────────────────────────
  useEffect(() => {
    if (!chatContext) return
    const type = chatContext.type || 'Clinical Context'
    let contextMsg = `[${type.toUpperCase()}]\n\n`
    if (type === 'Asha Triage' || type === 'Diagnostic Workflow') {
      contextMsg += `Urgency: ${chatContext.urgency}\nFindings: ${chatContext.findings}\nActions: ${chatContext.actions?.join(', ')}`
    } else if (type === 'Health Prediction') {
      contextMsg += `Disease: ${chatContext.disease}\nAnalysis: ${chatContext.explanation}`
    } else if (type === 'Lab Report Analysis') {
      contextMsg += `Report: ${chatContext.file}\nSynthesis: ${chatContext.analysis}`
    } else if (type === 'Treatment Plan') {
      contextMsg += `Plan: ${chatContext.plan}`
    }
    handleSend(language === 'hi'
      ? `इस ${type} के बारे में और सलाह दें: ${contextMsg}`
      : `Please advise on this ${type}: ${contextMsg}`)
    clearContext()
  }, [chatContext])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => { if (audioInstance) audioInstance.pause() }
  }, [audioInstance])

  // ── TTS ────────────────────────────────────────────────────────────────────
  const handlePlayAudio = async (text, index) => {
    if (playingIndex === index && audioInstance) {
      audioInstance.pause()
      setPlayingIndex(null)
      return
    }
    if (audioInstance) audioInstance.pause()
    setAudioLoading(index)
    try {
      // Raise limit to 5000 chars, strip markdown
      const cleanText = text.replace(/[#*_`]/g, '').substring(0, 5000)
      const formData = new FormData()
      formData.append('text', cleanText)
      formData.append('language', language)
      const response = await axios.post(`${API_URL}/api/voice/synthesize`, formData, { responseType: 'blob' })
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      setAudioInstance(audio)
      audio.onplay = () => setPlayingIndex(index)
      audio.onended = () => setPlayingIndex(null)
      audio.onpause = () => setPlayingIndex(null)
      audio.play()
    } catch (err) {
      console.error('TTS error:', err)
    } finally {
      setAudioLoading(null)
    }
  }

  // ── Copy ──────────────────────────────────────────────────────────────────
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="max-w-6xl mx-auto h-[820px] flex flex-col main-card overflow-hidden animate-in">

      {/* ── Header ── */}
      <div className="header-panel p-6 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-blue-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{t.title}</h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider">Online</span>
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400">
                  <Globe className="w-3 h-3" />
                  <span>{t.subtitle}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Reset chat */}
            <button
              onClick={() => setMessages([{ role: 'assistant', content: WELCOME_MESSAGES[language] || WELCOME_MESSAGES.en }])}
              className="btn-secondary p-3 flex items-center justify-center"
              title="Restart conversation"
              aria-label="Restart chat"
            >
              <RefreshCcw className="w-4 h-4 text-slate-500" />
            </button>
            <div className="hidden sm:flex flex-col items-end px-5 border-l border-[var(--border-light)]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol</span>
              <span className="text-sm font-black text-blue-600 tracking-tight">NH-OS v4.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-[var(--bg-card)]" aria-live="polite">
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            index={i}
            onPlayAudio={handlePlayAudio}
            audioLoading={audioLoading}
            playingIndex={playingIndex}
            onCopy={handleCopy}
            copiedIndex={copiedIndex}
          />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="bg-slate-50 border border-[var(--border-light)] px-6 py-4 rounded-2xl rounded-tl-none inline-block">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                <span className="ml-3 text-[10px] font-bold text-slate-400 uppercase">{t.typing}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-auto max-w-md bg-rose-500/10 text-rose-500 p-5 rounded-2xl flex items-center space-x-4 border border-rose-200 animate-in" role="alert">
            <ShieldAlert className="w-7 h-7 flex-shrink-0" />
            <span className="font-black text-sm">{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="p-6 header-panel border-t border-[var(--border-light)]">
        {/* Quick prompts */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.suggested}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="btn-secondary py-1.5 px-3.5 text-xs font-semibold disabled:opacity-50 min-h-[36px]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Text + Mic + Send */}
        <div className="relative flex items-center space-x-2">
          {/* Voice input button */}
          {voiceSupported && (
            <button
              onClick={isListening ? stopMic : startMic}
              disabled={loading}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600'
              } disabled:opacity-50`}
              title={isListening ? 'Stop speaking' : 'Speak your question'}
            >
              {isListening ? <Square className="w-4 h-4 fill-white text-white" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? '🎙 Listening...' : t.placeholder}
              disabled={loading}
              className={`w-full pl-5 pr-28 py-4 bg-white border rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm text-[var(--text-primary)] outline-none placeholder:text-slate-400 ${
                isListening ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
              }`}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="absolute right-2 top-2 bottom-2 px-5 btn-primary rounded-xl flex items-center space-x-2 text-sm disabled:opacity-50"
            >
              <span>{t.send}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isListening && (
          <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider mt-2 text-center animate-pulse">
            🎙 Listening in {SPEECH_LANG_MAP[language] || 'en-IN'} — Speak clearly...
          </p>
        )}
      </div>
    </div>
  )
}

export default AIChat
