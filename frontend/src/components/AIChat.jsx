import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { MessageSquare, Send, Sparkles, User, Brain, AlertCircle, RefreshCcw, Zap, Terminal, ShieldAlert, Activity, Volume2, Pause } from 'lucide-react'

import { API_URL } from '../config'

function AIChat({ language = 'en', selectedPatient = null, chatContext = null, clearContext = () => {}, onNavigate = () => {} }) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: language === 'hi' ? 'नमस्ते! हम आपके एआई स्वास्थ्य परिषद (Gemini + GPT-4o) हैं। हम आपकी कैसे मदद कर सकते हैं?' : "Hello! We are your AI Health Council (Gemini + GPT-4o). We have synthesized your clinical profile for a unified assessment. How can we help you today?" 
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [audioLoading, setAudioLoading] = useState(null) // Stores index of message being synthesized
  const [playingIndex, setPlayingIndex] = useState(null)
  const [audioInstance, setAudioInstance] = useState(null)
  const [patientData, setPatientData] = useState({
    age: selectedPatient?.age || 45,
    gender: selectedPatient?.gender === 1 ? 'Female' : 'Male',
    glucose: selectedPatient?.glucose || 110,
    hba1c: selectedPatient?.hba1c || 5.7,
    bp: selectedPatient?.bp_systolic || 125,
    bmi: selectedPatient?.bmi || 26
  })
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  const handleSend = async (forcedText = null) => {
    const textToSend = forcedText || input
    if (!textToSend.trim() || loading) return

    const userMessage = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(`${API_URL}/api/ai/chat`, {
        message: textToSend,
        language,
        history: messages // Now supported by updated backend
      })
      
      if (response.data.success) {
        const assistantMessage = { 
          role: 'assistant', 
          content: response.data.response || "SYNTAX_ERROR: NULL_RESPONSE",
          agent_status: response.data.agent_status
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(response.data.error || "Neural Link Failure")
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorText = error.message.includes('quota') || error.message.includes('limit')
        ? (language === 'hi' ? 'Gemini AI का कोटा समाप्त हो गया है।' : 'Neural Quota Exceeded.')
        : (language === 'hi' ? 'सर्वर से जुड़ने में समस्या आ रही है।' : 'Core Link Disconnected.')
      
      setError(errorText)
      const errorMessage = {
        role: 'assistant',
        content: language === 'hi'
          ? `प्रोटोकॉल त्रुटि: ${errorText}`
          : `SYSTEM_ALERT: ${errorText}`
      }
      setMessages(prev => [...prev, errorMessage])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (chatContext) {
      const type = chatContext.type || 'Clinical Context'
      let contextMsg = `[SYSTEM_INITIALIZATION: ${type.toUpperCase()}]\n\n`
      
      if (type === 'Asha Triage' || type === 'Diagnostic Workflow') {
        contextMsg += `URGENCY: ${chatContext.urgency}\nFINDINGS: ${chatContext.findings}\nRECOMMENDED ACTIONS: ${chatContext.actions?.join(', ')}`
      } else if (type === 'Health Prediction') {
        contextMsg += `DISEASE: ${chatContext.disease}\nANALYSIS: ${chatContext.explanation}`
      } else if (type === 'Lab Report Analysis') {
        contextMsg += `REPORT: ${chatContext.file}\nSYNTHESIS: ${chatContext.analysis}`
      } else if (type === 'Treatment Plan') {
        contextMsg += `PERSONALIZED PLAN: ${chatContext.plan}`
      }

      handleSend(language === 'hi' 
        ? `मुझे इस ${type} के बारे में और सलाह दें: ${contextMsg}` 
        : `Please provide more advice regarding this ${type}: ${contextMsg}`
      )
      clearContext()
    }
  }, [chatContext])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      if (audioInstance) audioInstance.pause()
    }
  }, [audioInstance])

  const handlePlayAudio = async (text, index) => {
    if (playingIndex === index && audioInstance) {
      audioInstance.pause()
      setPlayingIndex(null)
      return
    }

    if (audioInstance) audioInstance.pause()

    setAudioLoading(index)
    
    try {
      // Clean text: remove markdown and limit length
      const cleanText = text.replace(/[#*]/g, '').substring(0, 4000)
      
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
      
      audio.onplay = () => setPlayingIndex(index)
      audio.onended = () => setPlayingIndex(null)
      audio.onpause = () => setPlayingIndex(null)
      
      audio.play()
    } catch (err) {
      console.error('Audio synthesis error:', err)
    } finally {
      setAudioLoading(null)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const labels = {
    en: {
      placeholder: 'Enter query...',
      send: 'Send',
      title: 'AI Clinical Copilot',
      subtitle: 'Diagnostic Intelligence',
      suggested: 'Common Protocols',
      typing: 'AI is analyzing clinical data...'
    },
    hi: {
      placeholder: 'प्रश्न पूछें...',
      send: 'भेजें',
      title: 'AI स्वास्थ्य सहायक',
      subtitle: 'निदान बुद्धिमत्ता',
      suggested: 'सामान्य प्रोटोकॉल',
      typing: 'AI विचार कर रहा है...'
    }
  }

  const t = labels[language] || labels.en

  const quickQuestions = [
    language === 'hi' ? 'मधुमेह प्रबंधन?' : 'Diabetes protocol?',
    language === 'hi' ? 'हृदय स्वास्थ्य?' : 'Heart health?',
    language === 'hi' ? 'स्वस्थ रहने के टिप्स?' : 'Longevity tips?',
    language === 'hi' ? 'ASHA वर्कर क्या है?' : 'ASHA worker role?'
  ];

  return (
    <div className="max-w-6xl mx-auto h-[800px] flex flex-col main-card overflow-hidden animate-in">
      {/* Clean Header */}
      <div className="header-panel p-8 relative overflow-hidden group">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
               <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center relative z-10">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white z-20"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">{t.title}</h2>
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Online
                </div>
                <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">{t.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button 
                onClick={() => setMessages([messages[0]])}
                className="btn-secondary p-3 flex items-center justify-center"
                title="Restart Chat"
              >
                <RefreshCcw className="w-5 h-5 text-slate-500" />
              </button>
              <div className="hidden sm:flex flex-col items-end justify-center px-6 border-l border-[var(--border-light)]">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Protocol</span>
                <span className="text-sm font-black text-[var(--accent-blue)] tracking-tight">NH-OS v4.0</span>
              </div>
          </div>
        </div>
      </div>

      {/* Neural Canvas */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth bg-[var(--bg-card)]">
        
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`flex items-start space-x-4 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
          >
            {/* Semantic Identity */}
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              {message.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>

            {/* Response Node */}
            <div 
              className={`max-w-[75%] px-6 py-5 rounded-2xl relative ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-50 text-[var(--text-primary)] rounded-tl-none border border-[var(--border-light)]'
              }`}
            >
               {message.role !== 'user' && (
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2 opacity-40">
                    <Terminal className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Incoming Transmission</span>
                  </div>
                  {message.agent_status && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full animate-pulse">
                      <Zap className="w-3 h-3 text-emerald-500" />
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">
                        {message.agent_status}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <p className={`text-base leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'font-medium' : ''}`}>
                {message.content}
              </p>
              {message.role !== 'user' && (
                <div className="mt-4 flex items-center justify-end">
                  {playingIndex === index && (
                    <div className="flex items-center justify-center space-x-1 h-4 mr-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-1 bg-blue-600 rounded-full animate-pulse h-full" style={{ animationDelay: `${i * 0.2}s` }}></div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => handlePlayAudio(message.content, index)}
                    disabled={audioLoading !== null}
                    className={`p-2 rounded-lg transition-colors ${
                      playingIndex === index 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'hover:bg-slate-200 text-slate-500'
                    }`}
                  >
                    {audioLoading === index ? (
                      <Activity className="w-4 h-4 animate-spin" />
                    ) : playingIndex === index ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="bg-slate-50 border border-[var(--border-light)] px-6 py-4 rounded-2xl rounded-tl-none inline-block">
               <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
               </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mx-auto max-w-md bg-rose-500/10 text-rose-400 p-6 rounded-[2rem] text-center flex items-center justify-center space-x-4 border border-rose-500/20 shadow-2xl animate-in shake duration-500">
            <ShieldAlert className="w-8 h-8 flex-shrink-0" />
            <span className="font-black text-sm tracking-tight uppercase tracking-[0.1em]">{error}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8 header-panel">
        <div className="mb-6 border-b border-[var(--border-light)] pb-4">
           <div className="flex items-center space-x-2 mb-3">
             <Zap className="w-4 h-4 text-amber-500" />
             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.suggested}</p>
           </div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="btn-secondary py-1.5 px-4 text-xs font-semibold"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t.placeholder}
            disabled={loading}
            className="w-full pl-6 pr-32 py-4 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-base text-[var(--text-primary)] outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 btn-primary rounded-lg flex items-center space-x-2 text-sm"
          >
            <span>{t.send}</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}


export default AIChat
