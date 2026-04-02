import { 
  Activity, 
  Users, 
  Heart, 
  TrendingUp, 
  Stethoscope, 
  FileText, 
  BarChart3, 
  Clipboard, 
  MessageSquare, 
  Mic, 
  ChevronRight, 
  ArrowRight, 
  Shield, 
  Sparkles, 
  Clock,
  Zap,
  Globe,
  Brain,
  UserCheck,
  AlertCircle
} from 'lucide-react'

// Professional AI Medical Panel Configuration
const AI_DOCTORS = [
  { name: 'Dr. Arjun Mehta', specialty: 'Cardiology & Internal Medicine', initials: 'AM', color: 'blue' },
  { name: 'Dr. Sarah Johnson', specialty: 'Endocrinology & Diabetes', initials: 'SJ', color: 'emerald' },
  { name: 'Dr. Priya Nair', specialty: 'General Practice & Diagnostics', initials: 'PN', color: 'violet' },
  { name: 'Dr. James Chen', specialty: 'Radiology & Imaging', initials: 'JC', color: 'amber' },
]

function Home({ language = 'en', onNavigate }) {
  const translations = {
    en: {
      welcome: 'Welcome back, Doctor',
      subtitle: 'Your Agentic AI healthcare intelligence system is ready. All models are loaded and operational.',
      startScreening: 'Start Health Screening',
      voiceAssistant: 'Voice Assistant',
      totalPatients: 'Total Patients',
      activeCases: 'Active Cases',
      successRate: 'Success Rate',
      aiAccuracy: 'AI Accuracy',
      quickActions: 'Quick Actions',
      features: 'Intelligence Hub',
      ashaAlert: '14 pending patient assessments in the ASHA community health network.',
      ashaBtn: 'Open ASHA Dashboard',
      recentActivity: 'Clinical Protocol Log',
    },
    hi: {
      welcome: 'नमस्ते, डॉक्टर',
      subtitle: 'आपका AI-सहायक स्वास्थ्य बुद्धिमत्ता प्रणाली तैयार है।',
      startScreening: 'स्वास्थ्य जांच शुरू करें',
      voiceAssistant: 'आवाज़ सहायक',
      totalPatients: 'कुल रोगी',
      activeCases: 'सक्रिय मामले',
      successRate: 'सफलता दर',
      aiAccuracy: 'AI सटीकता',
      quickActions: 'त्वरित कार्रवाई',
      features: 'मुख्य सुविधाएं',
      ashaAlert: 'ASHA नेटवर्क में 14 लंबित रोगी मूल्यांकन हैं।',
      ashaBtn: 'ASHA डैशबोर्ड खोलें',
      recentActivity: 'हालिया गतिविधि',
    },
  }

  const t = translations[language] || translations.en

  const stats = [
    { label: t.totalPatients, val: '10,000', change: '+12%', color: 'blue', icon: Users },
    { label: t.activeCases, val: '328', change: 'Critical', color: 'rose', icon: AlertCircle },
    { label: t.successRate, val: '94.2%', change: '+3.1%', color: 'emerald', icon: TrendingUp },
    { label: t.aiAccuracy, val: '98.5%', change: '+0.3%', color: 'violet', icon: Brain },
  ]

  const modules = [
    { key: 'predict', label: language === 'hi' ? 'स्वास्थ्य जांच' : 'Health Screening', icon: Activity, desc: 'Agentic AI-powered risk assessment for critical conditions.', color: 'blue' },
    { key: 'report', label: language === 'hi' ? 'मेडिकल रिपोर्ट' : 'Medical Reports', icon: FileText, desc: 'Multimodal analysis of clinical documents and imaging.', color: 'indigo' },
    { key: 'asha', label: language === 'hi' ? 'ASHA कार्यकर्ता' : 'ASHA Worker Hub', icon: Stethoscope, desc: 'Decentralized community health decision support.', color: 'rose' },
    { key: 'plan', label: language === 'hi' ? 'उपचार योजना' : 'Treatment Plans', icon: Clipboard, desc: 'Personalized evidence-based clinical protocols.', color: 'emerald' },
    { key: 'chat', label: language === 'hi' ? 'AI सलाहकार' : 'AI Council', icon: MessageSquare, desc: 'Direct multi-agent collaborative diagnostics.', color: 'violet' },
    { key: 'second-opinion', label: language === 'hi' ? 'Joint AI Panel' : 'Joint AI Consensus', icon: Zap, desc: 'Dual-AI model synthesis for complex cases.', color: 'amber' },
  ]

  return (
    <div className="space-y-10 animate-in">

      {/* Hero Section */}
      <div className="relative overflow-hidden main-card p-0 rounded-3xl">
        <div className="relative z-10 grid lg:grid-cols-2 gap-0 items-stretch">
          {/* Left: Text Content */}
          <div className="p-10 lg:p-14 space-y-8 flex flex-col justify-center">
            <div className="inline-flex items-center space-x-3 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full w-max">
              <div className="status-dot status-online"></div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">System Operational — 10,000 Patients Registered</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight tracking-tight">
                {t.welcome}<span className="text-blue-600">.</span>
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg font-medium">
                {t.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => onNavigate('predict')}
                className="btn-primary flex items-center space-x-3 group"
              >
                <span>{t.startScreening}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => onNavigate('patients')}
                className="btn-secondary flex items-center space-x-3"
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>Patient Registry</span>
              </button>
            </div>

            {/* AI Medical Panel */}
            <div className="pt-6 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Supervising AI Clinical Panel</p>
              <div className="flex items-center gap-3 flex-wrap">
                {AI_DOCTORS.map((doc, i) => (
                  <div key={i} className={`flex items-center gap-2 bg-${doc.color}-50 border border-${doc.color}-100 px-3 py-2 rounded-xl`}>
                    <div className={`w-8 h-8 rounded-lg bg-${doc.color}-600 flex items-center justify-center text-white text-[10px] font-black`}>
                      {doc.initials}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-800 leading-none">{doc.name}</p>
                      <p className={`text-[9px] text-${doc.color}-600 font-semibold leading-none mt-0.5`}>{doc.specialty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Professional Doctor Image */}
          <div className="hidden lg:block relative min-h-[500px] overflow-hidden rounded-r-3xl">
            <img 
              src="/doctor_team.png" 
              alt="Professional Medical Team" 
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/ai_visual.png';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/10"></div>
            {/* Floating metric card */}
            <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinical Accuracy</p>
                  <p className="text-2xl font-black text-slate-900">99.2%</p>
                  <p className="text-[10px] text-emerald-600 font-bold">↑ Validated by 4 AI Agents</p>
                </div>
              </div>
            </div>
            {/* Floating AI tag */}
            <div className="absolute top-8 right-8 bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              ✦ AI-Powered Diagnostics
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="main-card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-${stat.color}-50 rounded-xl text-${stat.color}-600`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 
                stat.change === 'Critical' ? 'bg-rose-50 text-rose-600' : 
                'bg-rose-50 text-rose-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <h4 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-0.5">{stat.val}</h4>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Feature Grid ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-3">
             <div className="w-6 h-1 bg-indigo-500 rounded-full"></div>
             {t.features}
          </h3>
          <p className="text-xs font-bold text-indigo-500 cursor-pointer hover:underline uppercase tracking-tighter">View All Protocols</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <div 
              key={i} 
              onClick={() => onNavigate(mod.key)}
              className="main-card p-8 cursor-pointer group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="relative space-y-5">
                <div className={`w-12 h-12 rounded-xl bg-${mod.color}-50 flex items-center justify-center group-hover:bg-${mod.color}-600 transition-all duration-300`}>
                  <mod.icon className={`w-6 h-6 text-${mod.color}-600 group-hover:text-white transition-colors`} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1 uppercase tracking-tight">{mod.label}</h4>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">{mod.desc}</p>
                </div>
                
                <div className="flex items-center text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                  <span>Open Module</span>
                  <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-Column Bottom Section ── */}
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* ASHA Banner */}
        <div className="lg:col-span-3 main-card border-l-4 border-rose-500 p-10 flex flex-col justify-between relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Globe className="w-40 h-40" />
          </div>
          <div className="relative space-y-6">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-rose-600 uppercase tracking-tight mb-2">
                ASHA Alert Network
              </h4>
              <p className="text-base text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
                {t.ashaAlert} High priority cases detected in active community clusters. Immediate coordination suggested.
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('asha')}
            className="mt-8 w-full lg:w-max btn-primary !bg-rose-600 hover:!bg-rose-700 shadow-rose-100"
          >
            {t.ashaBtn}
          </button>
        </div>

        {/* Protocol Log */}
        <div className="lg:col-span-2 main-card border-l-4 border-blue-500 p-10 bg-white">
          <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest mb-8 flex items-center gap-3">
            <Clock className="w-4 h-4 text-blue-600" />
            {t.recentActivity}
          </h4>
          <div className="space-y-6">
            {[
              { text: 'Health screening complete for Patient #P004201', time: '2m ago', color: 'emerald' },
              { text: 'System Consensus: Stage 2 Diabetes detected', time: '15m ago', color: 'blue' },
              { text: 'ASHA Node Sync: 3 new patient listings', time: '1h ago', color: 'rose' },
              { text: 'Treatment protocol generated: Cardia-X', time: '3h ago', color: 'blue' },
              { text: '328 critical cases flagged for immediate review', time: '4h ago', color: 'rose' },
            ].map((item, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className={`w-1.5 h-6 rounded-full bg-${item.color}-500 mt-1 flex-shrink-0 opacity-70`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.text}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Home
