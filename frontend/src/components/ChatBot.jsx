import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, Sparkles, Loader2 } from 'lucide-react'
import aiService from '../services/aiService'

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your Agentic AI assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userText = input
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setInput('')
    setLoading(true)
    
    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
      
      const response = await aiService.chatWithAI(userText, null, history, 'en')
      
      if (response.success) {
        setMessages(prev => [...prev, { role: 'bot', text: response.response }])
      }
    } catch (error) {
      const errorText = error.message.includes('quota') || error.message.includes('limit') 
        ? "Neural Quota Exceeded. Please configure valid API keys."
        : "Core Link Disconnected: " + error.message;
      setMessages(prev => [...prev, { role: 'bot', text: "SYSTEM ALERT: " + errorText }])
    }
    
    setLoading(false)
  }

  return (
    <div className="fixed bottom-8 right-8 z-[1000]">
      {isOpen ? (
        <div className="bg-white dark:bg-slate-900 w-80 h-[500px] rounded-[2.5rem] shadow-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-widest">Agentic AI Bot</h4>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[10px] font-bold opacity-80 uppercase">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-bold leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-2xl text-xs font-bold leading-relaxed bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none shadow-sm flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
                placeholder="Ask Agentic AI..."
                className="w-full pl-6 pr-14 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold outline-none dark:text-white disabled:opacity-50"
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-3xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 h-full w-[200%] -translate-x-full group-hover:translate-x-0 transition-transform duration-700 skew-x-12"></div>
          <Bot className="w-8 h-8 relative z-10" />
          <div className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
          </div>
        </button>
      )}
    </div>
  )
}

export default ChatBot
