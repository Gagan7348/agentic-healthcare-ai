import { useState, useMemo, useEffect } from 'react'
import { 
  Activity, 
  Users, 
  MessageSquare, 
  Mic, 
  LayoutDashboard, 
  Bell, 
  Search, 
  Menu, 
  X, 
  Stethoscope,
  Heart, 
  FileText, 
  BarChart3, 
  Clipboard, 
  ChevronRight, 
  Settings, 
  LogOut, 
  Plus, 
  TrendingUp, 
  Sun, 
  Moon,
  ShieldCheck,
  Zap,
  Layers
} from 'lucide-react'

// Component Imports
import Prediction from './components/Prediction'
import AshaMode from './components/AshaMode'
import AIChat from './components/AIChat'
import VoiceInput from './components/VoiceInput'
import LanguageSelector from './components/LanguageSelector'
import TreatmentPlan from './components/TreatmentPlan'
import DiagnosticWorkflow from './components/DiagnosticWorkflow'
import ReportAnalysis from './components/ReportAnalysis'
import Home from './components/Home'
import PatientRegistry from './components/PatientRegistry'
import ChatBot from './components/ChatBot'
import DrugInteractionChecker from './components/DrugInteractionChecker'
import CollaborativeAI from './components/CollaborativeAI'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [language, setLang] = useState('en')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false) // Default to light mode for human-made feel
  const [chatContext, setChatContext] = useState(null)

  const navigate = useMemo(() => (tab, context = null) => {
    if (context) {
      setChatContext(context)
    }
    setActiveTab(tab)
  }, [])

  useEffect(() => {
    const handleNavigate = (e) => {
      if (e.detail && e.detail.tab) {
        navigate(e.detail.tab, e.detail.context)
      }
    }
    window.addEventListener('navigate-tab', handleNavigate)
    return () => window.removeEventListener('navigate-tab', handleNavigate)
  }, [navigate])

  // Translation keys for navigation
  const LANG_LABELS = {
    en: { dashboard: 'Dashboard', screening: 'Health Screening', reports: 'Medical Reports', community: 'Community Health', care: 'Care Protocols', diagnostics: 'Diagnostics', ai: 'AI Consultation', voice: 'Voice Assistant', patients: 'Patient Records', drugs: 'Drug Checker', consensus: 'Joint Consensus' },
    hi: { dashboard: 'डैशबोर्ड', screening: 'स्वास्थ्य जांच', reports: 'मेडिकल रिपोर्ट', community: 'सामुदायिक स्वास्थ्य', care: 'देखभाल प्रोटोकॉल', diagnostics: 'निदान', ai: 'AI परामर्श', voice: 'आवाज़ सहायक', patients: 'रोगी रिकॉर्ड', drugs: 'दवाई जांचक', consensus: 'संयुक्त सलाह' },
    bn: { dashboard: 'ড্যাশবোর্ড', screening: 'স্বাস্থ্য পরীক্ষা', reports: 'মেডিকেল রিপোর্ট', community: 'সমাজ স্বাস্থ্য', care: 'যত্ন প্রোটোকল', diagnostics: 'ডায়াগনস্টিক্স', ai: 'AI পরামর্শ', voice: 'ভয়েস সহায়ক', patients: 'রোগীর রেকর্ড', drugs: 'ড্রাগ চেকার', consensus: 'যৌথ পরামর্শ' },
    ta: { dashboard: 'டாஷ்போர்டு', screening: 'சுகாதார பரிசோதனை', reports: 'மருத்துவ அறிக்கைகள்', community: 'சமுதாய சுகாதாரம்', care: 'சிகிச்சை நெறிமுறைகள்', diagnostics: 'நோயறிதல்', ai: 'AI ஆலோசனை', voice: 'குரல் உதவியாளர்', patients: 'நோயாளி பதிவுகள்', drugs: 'மருந்து சரிபார்ப்பு', consensus: 'கூட்டு ஒருமித்த கருத்து' },
    te: { dashboard: 'డాష్‌బోర్డ్', screening: 'ఆరోగ్య స్క్రీనింగ్', reports: 'వైద్య నివేదికలు', community: 'సమాజ ఆరోగ్యం', care: 'సంరక్షణ ప్రోటోకాల్', diagnostics: 'రోగ నిర్ధారణ', ai: 'AI సంప్రదింపులు', voice: 'వాయిస్ అసిస్టెంట్', patients: 'రోగి రికార్డులు', drugs: 'డ్రగ్ చెకర్', consensus: 'సంయుక్త ఏకాభిప్రాయం' },
    mr: { dashboard: 'डॅशबोर्ड', screening: 'आरोग्य तपासणी', reports: 'वैद्यकीय अहवाल', community: 'सामुदायिक आरोग्य', care: 'काळजी प्रोटोकॉल', diagnostics: 'निदान', ai: 'AI सल्लामसलत', voice: 'व्हॉइस सहाय्यक', patients: 'रुग्ण नोंदी', drugs: 'औषध तपासक', consensus: 'संयुक्त सहमती' },
    gu: { dashboard: 'ડૅશબોર્ડ', screening: 'આrોગ્ય સ્ક્રીનિંગ', reports: 'તbibical અહેવાલ', community: 'સamudayic આrોગ્ય', care: 'સeवा P&T', diagnostics: 'ઔ&P', ai: 'AI', voice: 'વaice', patients: 'Dvo', drugs: 'Drug', consensus: 'Consensus' },
    kn: { dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', screening: 'ಆರೋಗ್ಯ ತಪಾಸಣೆ', reports: 'ವೈದ್ಯಕೀಯ ವರದಿ', community: 'ಸಮುದಾಯ ಆರೋಗ್ಯ', care: 'ಆರೈಕೆ ನಿಯಮಾವಳಿ', diagnostics: 'ರೋಗನಿರ್ಣಯ', ai: 'AI ಸಲಹೆ', voice: 'ಧ್ವನಿ ಸಹಾಯಕ', patients: 'ರೋಗಿ ದಾಖಲಾತಿ', drugs: 'ಔಷಧ ಪರೀಕ್ಷಕ', consensus: 'ಸಂಯುಕ್ತ ಒಮ್ಮತ' },
    ml: { dashboard: 'ഡാഷ്ബോർഡ്', screening: 'ആരോഗ്യ സ്ക്രീനിംഗ്', reports: 'മെഡിക്കൽ റിപ്പോർട്ടുകൾ', community: 'സാമുദായിക ആരോഗ്യം', care: 'പരിചരണ നിർദ്ദേശങ്ങൾ', diagnostics: 'ഡയഗ്നോസ്റ്റിക്സ്', ai: 'AI കൺസൾട്ടേഷൻ', voice: 'ശബ്ദ സഹായി', patients: 'രോഗിയുടെ രേഖകൾ', drugs: 'മരുന്ന് പരിശോധകൻ', consensus: 'സംയുക്ത സമ്മതം' },
    pa: { dashboard: 'ਡੈਸ਼ਬੋਰਡ', screening: 'ਸਿਹਤ ਜਾਂਚ', reports: 'ਮੈਡੀਕਲ ਰਿਪੋਰਟਾਂ', community: 'ਸਮਾਜਿਕ ਸਿਹਤ', care: 'ਦੇਖਭਾਲ ਪ੍ਰੋਟੋਕੋਲ', diagnostics: 'ਡਾਇਗਨੌਸਟਿਕਸ', ai: 'AI ਸਲਾਹ', voice: 'ਆਵਾਜ਼ ਸਹਾਇਕ', patients: 'ਮਰੀਜ਼ ਰਿਕਾਰਡ', drugs: 'ਦਵਾਈ ਜਾਂਚਕਰਤਾ', consensus: 'ਸਾਂਝੀ ਸਹਿਮਤੀ' }
  }
  const L = LANG_LABELS[language] || LANG_LABELS.en

  const tabs = {
    en: [
      { key: 'home', label: L.dashboard, icon: LayoutDashboard, desc: 'Overview of clinical operations' },
      { key: 'predict', label: L.screening, icon: Activity, desc: 'Patient risk assessment' },
      { key: 'report', label: L.reports, icon: FileText, desc: 'Clinical document analysis' },
      { key: 'asha', label: L.community, icon: Stethoscope, desc: 'Rural health coordinator' },
      { key: 'plan', label: L.care, icon: Clipboard, desc: 'Treatment guidelines' },
      { key: 'workflow', label: L.diagnostics, icon: TrendingUp, desc: 'Clinical decision support' },
      { key: 'chat', label: L.ai, icon: MessageSquare, desc: 'Multi-agent clinical review' },
      { key: 'voice', label: L.voice, icon: Mic, desc: 'Voice-enabled control' },
      { key: 'patients', label: L.patients, icon: Users, desc: 'Management of patient data' },
      { key: 'drugs', label: L.drugs, icon: Zap, desc: 'Drug interaction analysis' },
      { key: 'second-opinion', label: L.consensus, icon: Layers, desc: 'Collaborative AI review' },
    ]
  }

  const currentTabs = tabs.en

  return (
    <div className={`h-screen overflow-hidden ${isDarkMode ? 'dark' : ''} font-sans selection:bg-indigo-500/30`}>
      <div className="h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex transition-colors duration-300">
        
        <aside className={`
          ${isSidebarOpen ? 'w-72' : 'w-24'} 
          sidebar-panel
          transition-all duration-300 ease-in-out 
          flex flex-col sticky top-0 h-screen overflow-hidden z-40
        `}>
          
          {/* Brand */}
          <div className="p-6 flex items-center justify-between border-b border-[var(--border-light)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md group hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              {isSidebarOpen && (
                <div className="animate-in">
                  <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight tracking-tight">
                    Healthcare AI
                  </h1>
                  <p className="text-[10px] font-semibold text-blue-600 uppercase">
                    Agentic System
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
            {currentTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                  ${activeTab === tab.key 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-[var(--text-secondary)] hover:bg-slate-50 hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0 p-2 rounded-lg transition-colors
                  ${activeTab === tab.key ? 'text-blue-600' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}
                `}>
                  <tab.icon className="w-5 h-5" />
                </div>
                {isSidebarOpen && (
                  <div className="ml-3 text-left min-w-0 animate-in">
                    <span className="block text-sm font-semibold truncate">{tab.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)] truncate block opacity-80 font-medium">{tab.desc}</span>
                  </div>
                )}
                {activeTab === tab.key && isSidebarOpen && (
                  <ChevronRight className="w-4 h-4 ml-auto text-blue-600/50" />
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          {isSidebarOpen && (
            <div className="p-4 border-t border-[var(--border-light)] mx-2 mb-2">
              <div className="main-card p-4 bg-slate-50 border-none shadow-none">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="status-dot status-online"></div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Operational</p>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-medium">
                  Autonomous diagnostic agents are monitoring patient streams.
                </p>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-4 flex items-center justify-center text-[var(--text-muted)] hover:text-indigo-500 transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 h-screen overflow-y-auto relative bg-[var(--bg-page)]">
          
          {/* Top Header */}
          <header className="sticky top-0 z-30 header-panel px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-slate-100 border border-slate-200 px-4 py-2 rounded-full">
                 <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                 </div>
                 <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-2">
                    Live Diagnostics: <span className="text-blue-600">Active</span>
                 </span>
              </div>
              
              <div className="relative hidden xl:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  placeholder="Search council records..." 
                  className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs w-64 focus:w-80 focus:border-indigo-500/50 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-full hover:bg-white/5 text-[var(--text-secondary)] transition-all"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <LanguageSelector language={language} onChange={setLang} />

              <button className="relative p-2.5 rounded-full hover:bg-white/5 text-[var(--text-secondary)]">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[var(--bg-page)]"></span>
              </button>

              <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

              <div className="flex items-center space-x-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-[var(--text-primary)] uppercase">Healthcare User</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase">Patient Portal</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-blue-600 font-bold shadow-sm">
                  HP
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="px-8 py-8 pb-24 max-w-[1600px] mx-auto animate-in">
            {activeTab === 'home' && <Home language={language} onNavigate={navigate} />}
            {activeTab === 'predict' && <Prediction language={language} selectedPatient={selectedPatient} onNavigate={navigate} />}
            {activeTab === 'report' && <ReportAnalysis language={language} selectedPatient={selectedPatient} onNavigate={navigate} />}
            {activeTab === 'asha' && <AshaMode language={language} selectedPatient={selectedPatient} onNavigate={navigate} />}
            {activeTab === 'plan' && <TreatmentPlan language={language} selectedPatient={selectedPatient} onNavigate={navigate} />}
            {activeTab === 'workflow' && <DiagnosticWorkflow language={language} selectedPatient={selectedPatient} onNavigate={navigate} />}
            {activeTab === 'chat' && <AIChat language={language} selectedPatient={selectedPatient} chatContext={chatContext} clearContext={() => setChatContext(null)} onNavigate={navigate} />}
            {activeTab === 'voice' && <VoiceInput language={language} selectedPatient={selectedPatient} onNavigate={navigate} />}
            {activeTab === 'patients' && <PatientRegistry language={language} selectedPatient={selectedPatient} onSelectedPatient={setSelectedPatient} onNavigate={navigate} />}
            {activeTab === 'drugs' && <DrugInteractionChecker />}
            {activeTab === 'second-opinion' && <CollaborativeAI />}
          </div>

          <ChatBot />
        </main>
      </div>
    </div>
  )
}

export default App
