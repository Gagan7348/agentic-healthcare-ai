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
      welcome: 'Welcome back',
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
      welcome: 'पुनः स्वागत है',
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
    bn: {
      welcome: 'স্বাগতম',
      subtitle: 'আপনার AI স্বাস্থ্য বুদ্ধিমত্তা সিস্টেম প্রস্তুত।',
      startScreening: 'স্বাস্থ্য পরীক্ষা শুরু করুন',
      voiceAssistant: 'ভয়েস সহায়ক',
      totalPatients: 'মোট রোগী',
      activeCases: 'সক্রিয় কেস',
      successRate: 'সাফল্যের হার',
      aiAccuracy: 'AI নির্ভুলতা',
      quickActions: 'দ্রুত পদক্ষেপ',
      features: 'ইন্টেলিজেন্স হাব',
      ashaAlert: 'ASHA নেটওয়ার্কে ১৪টি মুলতুবি রোগী মূল্যায়ন রয়েছে।',
      ashaBtn: 'ASHA ড্যাশবোর্ড খুলুন',
      recentActivity: 'সাম্প্রতিক কার্যকলাপ',
    },
    ta: {
      welcome: 'மீண்டும் வரவேற்கிறோம்',
      subtitle: 'உங்கள் AI சுகாதார நுண்ணறிவு அமைப்பு தயாராக உள்ளது.',
      startScreening: 'சுகாதார பரிசோதனை தொடங்கு',
      voiceAssistant: 'குரல் உதவியாளர்',
      totalPatients: 'மொத்த நோயாளர்கள்',
      activeCases: 'செயலில் உள்ள வழக்குகள்',
      successRate: 'வெற்றி விகிதம்',
      aiAccuracy: 'AI துல்லியம்',
      quickActions: 'விரைவு நடவடிக்கைகள்',
      features: 'நுண்ணறிவு மையம்',
      ashaAlert: 'ASHA நெட்வொர்க்கில் 14 நிலுவையில் உள்ள மதிப்பீடுகள்.',
      ashaBtn: 'ASHA டாஷ்போர்டு திற',
      recentActivity: 'சமீபத்திய செயல்பாடு',
    },
    te: {
      welcome: 'తిరిగి స్వాగతం',
      subtitle: 'మీ AI ఆరోగ్య సేవా వ్యవస్థ సిద్ధంగా ఉంది.',
      startScreening: 'ఆరోగ్య స్క్రీనింగ్ ప్రారంభించు',
      voiceAssistant: 'వాయిస్ అసిస్టెంట్',
      totalPatients: 'మొత్తం రోగులు',
      activeCases: 'క్రియాశీల కేసులు',
      successRate: 'విజయ నిరక్షరాస్యత',
      aiAccuracy: 'AI ఖచ్చితత్వం',
      quickActions: 'శీఘ్ర చర్యలు',
      features: 'ఇంటెలిజెన్స్ హబ్',
      ashaAlert: 'ASHA నెట్‌వర్క్‌లో 14 పెండింగ్ అంచనాలు ఉన్నాయి.',
      ashaBtn: 'ASHA డాష్‌బోర్డ్ తెరవండి',
      recentActivity: 'ఇటీవలి కార్యకలాపం',
    },
    mr: {
      welcome: 'पुन्हा स्वागत',
      subtitle: 'तुमची AI आरोग्यसेवा प्रणाली तयार आहे.',
      startScreening: 'आरोग्य तपासणी सुरू करा',
      voiceAssistant: 'व्हॉइस सहाय्यक',
      totalPatients: 'एकूण रुग्ण',
      activeCases: 'सक्रिय प्रकरणे',
      successRate: 'यश दर',
      aiAccuracy: 'AI अचूकता',
      quickActions: 'त्वरित क्रिया',
      features: 'इंटेलिजेन्स हब',
      ashaAlert: 'ASHA नेटवर्कमध्ये 14 प्रलंबित मूल्यांकने आहेत.',
      ashaBtn: 'ASHA डॅशबोर्ड उघडा',
      recentActivity: 'अलीकडील क्रियाकलाप',
    },
    gu: {
      welcome: 'ફરી સ્વાગત છે',
      subtitle: 'તમારી AI આરોગ્ય સેવા પ્રણાલી તૈયાર છે.',
      startScreening: 'આરોગ્ય સ્ક્રીનિંગ શરૂ કરો',
      voiceAssistant: 'વૉઇસ આસિસ્ટન્ટ',
      totalPatients: 'કુલ દર્દીઓ',
      activeCases: 'સક્રિય કેસ',
      successRate: 'સફળતા દર',
      aiAccuracy: 'AI ચોકસાઈ',
      quickActions: 'ઝડપી ક્રિયાઓ',
      features: 'ઇન્ટેલિજન્સ હબ',
      ashaAlert: 'ASHA નેટવર્કમાં 14 પ્રલંબિત આકારણીઓ.',
      ashaBtn: 'ASHA ડૅશબોર્ડ ખોલો',
      recentActivity: 'તાજેતરની પ્રવૃત્તિ',
    },
    kn: {
      welcome: 'ಮತ್ತೆ ಸ್ವಾಗತ',
      subtitle: 'ನಿಮ್ಮ AI ಆರೋಗ್ಯಸೇವೆ ವ್ಯವಸ್ಥೆ ಸಿದ್ಧವಾಗಿದೆ.',
      startScreening: 'ಆರೋಗ್ಯ ತಪಾಸಣೆ ಪ್ರಾರಂಭಿಸಿ',
      voiceAssistant: 'ಧ್ವನಿ ಸಹಾಯಕ',
      totalPatients: 'ಒಟ್ಟು ರೋಗಿಗಳು',
      activeCases: 'ಕ್ರಿಯಾಶೀಲ ಪ್ರಕರಣಗಳು',
      successRate: 'ಯಶಸ್ಸಿನ ದರ',
      aiAccuracy: 'AI ನಿಖರತೆ',
      quickActions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
      features: 'ಇಂಟೆಲಿಜೆನ್ಸ್ ಹಬ್',
      ashaAlert: 'ASHA ನೆಟ್‌ವರ್ಕ್‌ನಲ್ಲಿ 14 ಬಾಕಿ ಮೌಲ್ಯಮಾಪನಗಳಿವೆ.',
      ashaBtn: 'ASHA ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ',
      recentActivity: 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ',
    },
    ml: {
      welcome: 'തിരിച്ചു സ്വാഗതം',
      subtitle: 'നിങ്ങളുടെ AI ആരോഗ്യ സേവന സംവിധാനം തയ്യാറാണ്.',
      startScreening: 'ആരോഗ്യ സ്ക്രീനിംഗ് ആരംഭിക്കുക',
      voiceAssistant: 'ശബ്ദ സഹായി',
      totalPatients: 'ആകെ രോഗികൾ',
      activeCases: 'സജീവ കേസുകൾ',
      successRate: 'വിജയ നിരക്ക്',
      aiAccuracy: 'AI കൃത്യത',
      quickActions: 'ദ്രുത നടപടികൾ',
      features: 'ഇൻ്റലിജൻസ് ഹബ്',
      ashaAlert: 'ASHA നെറ്റ്‌വർക്കിൽ 14 തീർപ്പുകൽപ്പിക്കാത്ത വിലയിരുത്തലുകൾ.',
      ashaBtn: 'ASHA ഡാഷ്‌ബോർഡ് തുറക്കുക',
      recentActivity: 'സമീപകാല പ്രവർത്തനം',
    },
    pa: {
      welcome: 'ਜੀ ਆਇਆਂ ਨੂੰ',
      subtitle: 'ਤੁਹਾਡੀ AI ਸਿਹਤ ਸੇਵਾ ਪ੍ਰਣਾਲੀ ਤਿਆਰ ਹੈ।',
      startScreening: 'ਸਿਹਤ ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ',
      voiceAssistant: 'ਆਵਾਜ਼ ਸਹਾਇਕ',
      totalPatients: 'ਕੁੱਲ ਮਰੀਜ਼',
      activeCases: 'ਸਰਗਰਮ ਕੇਸ',
      successRate: 'ਸਫਲਤਾ ਦਰ',
      aiAccuracy: 'AI ਸ਼ੁੱਧਤਾ',
      quickActions: 'ਤੇਜ਼ ਕਾਰਵਾਈਆਂ',
      features: 'ਇੰਟੈਲੀਜੈਂਸ ਹੱਬ',
      ashaAlert: 'ASHA ਨੈੱਟਵਰਕ ਵਿੱਚ 14 ਲੰਬਿਤ ਮੁਲਾਂਕਣ ਹਨ।',
      ashaBtn: 'ASHA ਡੈਸ਼ਬੋਰਡ ਖੋਲ੍ਹੋ',
      recentActivity: 'ਹਾਲੀਆ ਗਤੀਵਿਧੀ',
    },
  }

  const t = translations[language] || translations.en

  const stats = [
    { label: t.totalPatients, val: '10,000', change: '+12%', color: 'blue', icon: Users },
    { label: t.activeCases, val: '328', change: 'Critical', color: 'rose', icon: AlertCircle },
    { label: t.successRate, val: '94.2%', change: '+3.1%', color: 'emerald', icon: TrendingUp },
    { label: t.aiAccuracy, val: '98.5%', change: '+0.3%', color: 'violet', icon: Brain },
  ]

  const moduleLabels = {
    en:  { predict: 'Health Screening', report: 'Medical Reports', asha: 'ASHA Worker Hub', plan: 'Treatment Plans', chat: 'AI Council', opinion: 'Joint AI Consensus' },
    hi:  { predict: 'स्वास्थ्य जांच', report: 'मेडिकल रिपोर्ट', asha: 'ASHA कार्यकर्ता', plan: 'उपचार योजना', chat: 'AI सलाहकार', opinion: 'संयुक्त AI पैनल' },
    bn:  { predict: 'স্বাস্থ্য পরীক্ষা', report: 'মেডিকেল রিপোর্ট', asha: 'ASHA হাব', plan: 'চিকিৎসা পরিকল্পনা', chat: 'AI পরামর্শ', opinion: 'যৌথ AI মতামত' },
    ta:  { predict: 'சுகாதார பரிசோதனை', report: 'மருத்துவ அறிக்கைகள்', asha: 'ASHA மையம்', plan: 'சிகிச்சை திட்டங்கள்', chat: 'AI ஆலோசனை', opinion: 'கூட்டு AI ஒருமித்த கருத்து' },
    te:  { predict: 'ఆరోగ్య స్క్రీనింగ్', report: 'వైద్య నివేదికలు', asha: 'ASHA హబ్', plan: 'చికిత్స ప్రణాళికలు', chat: 'AI సంప్రదింపులు', opinion: 'సంయుక్త AI ఏకాభిప్రాయం' },
    mr:  { predict: 'आरोग्य तपासणी', report: 'वैद्यकीय अहवाल', asha: 'ASHA हब', plan: 'उपचार योजना', chat: 'AI सल्लामसलत', opinion: 'संयुक्त AI सहमती' },
    gu:  { predict: 'આરોગ્ય સ્ક્રીનિંગ', report: 'તbibical અહેવાલ', asha: 'ASHA હબ', plan: 'સારવાર યોજનાઓ', chat: 'AI સલાહ', opinion: 'સંયુક્ત AI સહમતિ' },
    kn:  { predict: 'ಆರೋಗ್ಯ ತಪಾಸಣೆ', report: 'ವೈದ್ಯಕೀಯ ವರದಿ', asha: 'ASHA ಹಬ್', plan: 'ಚಿಕಿತ್ಸಾ ಯೋಜನೆಗಳು', chat: 'AI ಸಲಹೆ', opinion: 'ಸಂಯುಕ್ತ AI ಒಮ್ಮತ' },
    ml:  { predict: 'ആരോഗ്യ സ്ക്രീനിംഗ്', report: 'മെഡിക്കൽ റിപ്പോർട്ടുകൾ', asha: 'ASHA ഹബ്', plan: 'ചികിത്സാ പ്രോട്ടോക്കോൾ', chat: 'AI കൺസൾട്ടേഷൻ', opinion: 'സംയുക്ത AI സമ്മതം' },
    pa:  { predict: 'ਸਿਹਤ ਜਾਂਚ', report: 'ਮੈਡੀਕਲ ਰਿਪੋਰਟਾਂ', asha: 'ASHA ਹੱਬ', plan: 'ਇਲਾਜ ਯੋਜਨਾਵਾਂ', chat: 'AI ਸਲਾਹ', opinion: 'ਸਾਂਝੀ AI ਸਹਿਮਤੀ' },
  }
  const ml_ = moduleLabels[language] || moduleLabels.en

  const modules = [
    { key: 'predict', label: ml_.predict, icon: Activity, desc: 'Agentic AI-powered risk assessment for critical conditions.', color: 'blue' },
    { key: 'report', label: ml_.report, icon: FileText, desc: 'Multimodal analysis of clinical documents and imaging.', color: 'indigo' },
    { key: 'asha', label: ml_.asha, icon: Stethoscope, desc: 'Decentralized community health decision support.', color: 'rose' },
    { key: 'plan', label: ml_.plan, icon: Clipboard, desc: 'Personalized evidence-based clinical protocols.', color: 'emerald' },
    { key: 'chat', label: ml_.chat, icon: MessageSquare, desc: 'Direct multi-agent collaborative diagnostics.', color: 'violet' },
    { key: 'second-opinion', label: ml_.opinion, icon: Zap, desc: 'Dual-AI model synthesis for complex cases.', color: 'amber' },
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
