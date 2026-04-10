import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Activity, 
  Heart, 
  Info, 
  Zap, 
  BarChart3, 
  Volume2, 
  Pause, 
  ChevronRight, 
  Brain, 
  Droplets, 
  AlertCircle, 
  Sparkles, 
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Cpu
} from 'lucide-react'

import { API_URL } from '../config'
import aiService, { languageMap } from '../services/aiService'
import { getT } from '../utils/translations'

function Prediction({ language = 'en', selectedPatient = null, onNavigate = () => {} }) {
  const globalT = getT(language);
  const [formData, setFormData] = useState({
    age: selectedPatient?.age || 45,
    gender: selectedPatient?.gender === 1 ? 'Female' : 'Male',
    glucose: selectedPatient?.glucose || 110,
    hba1c: selectedPatient?.hba1c || 5.7,
    cholesterol: selectedPatient?.cholesterol || 190,
    bp: selectedPatient?.bp_systolic || 125,
    bmi: selectedPatient?.bmi || 26,
    creatinine: selectedPatient?.creatinine || 0.9,
    smoking: selectedPatient?.smoking || 0,
    family_history_diabetes: selectedPatient?.family_history_diabetes || 0,
    family_history_heart: selectedPatient?.family_history_heart || 0
  })

  useEffect(() => {
    if (selectedPatient) {
      setFormData({
        age: selectedPatient.age || 45,
        gender: selectedPatient.gender === 1 ? 'Female' : 'Male',
        glucose: selectedPatient.glucose || 110,
        hba1c: selectedPatient.hba1c || 5.7,
        cholesterol: selectedPatient.cholesterol || 190,
        bp: selectedPatient.bp_systolic || 125,
        bmi: selectedPatient.bmi || 26,
        creatinine: selectedPatient.creatinine || 0.9,
        smoking: selectedPatient.smoking || 0,
        family_history_diabetes: selectedPatient.family_history_diabetes || 0,
        family_history_heart: selectedPatient.family_history_heart || 0
      })
    }
  }, [selectedPatient])

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioInstance, setAudioInstance] = useState(null)
  const [error, setError] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [loadingExplain, setLoadingExplain] = useState(false)

  useEffect(() => {
    return () => { if (audioInstance) audioInstance.pause() }
  }, [audioInstance])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'gender' || name === 'smoking') ? value : parseFloat(value) || 0
    }))
  }

  const handleToggle = (name) => {
    setFormData(prev => ({ ...prev, [name]: prev[name] === 1 ? 0 : 1 }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults(null)
    setExplanation(null)
    
    try {
      const langName = languageMap[language] || "english"
      const response = await axios.post(`${API_URL}/api/predict`, {
        ...formData,
        language: langName
      })
      if (response.data.success) {
        const predsArray = Object.entries(response.data.predictions).map(([disease, prob]) => ({
          disease, probability: prob,
          risk_level: prob > 0.7 ? 'high' : prob > 0.4 ? 'medium' : 'low',
          confidence: response.data.confidence_intervals ? response.data.confidence_intervals[disease] : 85,
          features: response.data.feature_importance ? response.data.feature_importance[disease] : []
        }))
        setResults(predsArray)
        const highRisk = predsArray.find(p => p.risk_level === 'high') || predsArray[0]
        if (highRisk) handleExplain(highRisk.disease, highRisk.probability)
      } else {
        throw new Error("Invalid response")
      }
    } catch (error) {
      console.error('Prediction error:', error)
      setError(language === 'hi' ? 'सर्वर से कनेक्ट नहीं हो पा रहा।' : 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  const handleExplain = async (disease, probability) => {
    setLoadingExplain(true)
    try {
      // Direct-to-Gemini Explanation (Via Netlify Frontend Brain)
      const response = await aiService.explainRisk(
          disease,
          probability,
          formData,
          language
      );
      
      if (response.success) {
          setExplanation({ text: response.response, disease })
      }
    } catch (error) {
      console.error('Explanation error:', error)
    } finally {
      setLoadingExplain(false)
    }
  }

  const handlePlayAudio = async () => {
    if (!explanation) return
    if (isPlaying && audioInstance) { audioInstance.pause(); setIsPlaying(false); return }
    setAudioLoading(true)
    try {
      const cleanText = explanation.text.replace(/[#*]/g, '').substring(0, 4000)
      const fd = new FormData()
      fd.append('text', cleanText)
      fd.append('language', language)
      const response = await axios.post(`${API_URL}/api/voice/synthesize`, fd, { responseType: 'blob' })
      const audioUrl = URL.createObjectURL(new Blob([response.data], { type: 'audio/mpeg' }))
      const audio = new Audio(audioUrl)
      setAudioInstance(audio)
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
      audio.onpause = () => setIsPlaying(false)
      audio.play()
    } catch (err) { console.error('Audio error:', err) }
    finally { setAudioLoading(false) }
  }

  const translations = {
    en: {
      title: 'Health Screening Protocol', subtitle: 'Advanced neural diagnostics for multi-organ risk synthesis',
      vitals: 'Clinical Biomarker Stream', familyHistory: 'Genetic Risk Predisposition',
      run: 'Execute Neural Screening', results: 'Screening Analytics',
      diabetes: 'Type 2 Diabetes', heart: 'Cardiovascular Disease', kidney: 'Renal Functionality',
      age: 'Age', gender: 'Gender', glucose: 'Glucose (mg/dL)', hba1c: 'HbA1c (%)',
      cholesterol: 'Cholesterol', bloodPressure: 'BP Systolic', bmi: 'BMI', creatinine: 'Creatinine',
      familyDiabetes: 'Family: Diabetes', familyHeart: 'Family: Heart',
      high: 'Critical Risk', medium: 'Elevated Risk', low: 'Optimal Range',
      explanation: 'AI Clinical Reasoning', recommend: 'Deploy Treatment Plan',
      awaitingTitle: 'Awaiting Protocol Execution', awaitingDesc: 'Input clinical biomarkers to initialize neural assessment matrix.'
    },
    hi: {
      title: 'स्वास्थ्य जांच प्रोटोकॉल', subtitle: 'बहु-अंग जोखिम संश्लेषण के लिए उन्नत तंत्रिका निदान',
      vitals: 'नैदानिक बायोमार्कर स्ट्रीम', familyHistory: 'आनुवंशिक जोखिम पूर्वसूचना',
      run: 'जांच निष्पादित करें', results: 'जांच विश्लेषण',
      diabetes: 'मधुमेह', heart: 'हृदय रोग', kidney: 'किडनी रोग',
      age: 'उम्र', gender: 'लिंग', glucose: 'ग्लूकोज', hba1c: 'HbA1c',
      cholesterol: 'कोलेस्ट्रॉल', bloodPressure: 'रक्तचाप', bmi: 'बीएमआई', creatinine: 'क्रिएटिनिन',
      familyDiabetes: 'परिवार: मधुमेह', familyHeart: 'परिवार: हृदय रोग',
      high: 'गंभीर जोखिम', medium: 'बढ़ा हुआ जोखिम', low: 'इष्टतम सीमा',
      explanation: 'AI नैदानिक तर्क', recommend: 'उपचार योजना तैनात करें',
      awaitingTitle: 'प्रोटोकॉल प्रतीक्षा में', awaitingDesc: 'जोखिम मूल्यांकन शुरू करने के लिए विवरण भरें।'
    },
    bn: {
      title: 'স্বাস্থ্য স্ক্রীনিং প্রোটোকল', subtitle: 'মাল্টি-অর্গান ঝুঁকি সংশ্লেষণের জন্য উন্নত নিউরাল ডায়াগনস্টিকস',
      vitals: 'ক্লিনিক্যাল বায়োমার্কার', familyHistory: 'জেনেটিক ঝুঁকি',
      run: 'স্ক্রীনিং চালান', results: 'স্ক্রীনিং ফলাফল',
      diabetes: 'ডায়াবেটিস', heart: 'হৃদরোগ', kidney: 'কিডনি রোগ',
      age: 'বয়স', gender: 'লিঙ্গ', glucose: 'গ্লুকোজ', hba1c: 'HbA1c',
      cholesterol: 'কোলেস্টেরল', bloodPressure: 'রক্তচাপ', bmi: 'BMI', creatinine: 'ক্রিয়েটিনিন',
      familyDiabetes: 'পরিবার: ডায়াবেটিস', familyHeart: 'পরিবার: হৃদরোগ',
      high: 'মারাত্মক ঝুঁকি', medium: 'ঝুঁকি বেড়েছে', low: 'উপযুক্ত পরিসীমা',
      explanation: 'AI ক্লিনিক্যাল যুক্তি', recommend: 'চিকিৎসা পরিকল্পনা দেখুন',
      awaitingTitle: 'অপেক্ষমাণ', awaitingDesc: 'নিউরাল অ্যাসেসমেন্ট শুরু করতে ক্লিনিক্যাল ডেটা প্রদান করুন।'
    },
    ta: {
      title: 'உடல்நல பரிசோதனை', subtitle: 'முன்கூட்டியே ஆபத்து கண்டறிதல்',
      vitals: 'மருத்துவ அளவீடுகள்', familyHistory: 'மரபணு ஆபத்து',
      run: 'பரிசோதனை தொடங்கு', results: 'பரிசோதனை முடிவுகள்',
      diabetes: 'நீரிழிவு நோய்', heart: 'இதய நோய்', kidney: 'சிறுநீரக நோய்',
      age: 'வயது', gender: 'பாலினம்', glucose: 'குளுக்கோஸ்', hba1c: 'HbA1c',
      cholesterol: 'கொலஸ்ட்ரால்', bloodPressure: 'இரத்த அழுத்தம்', bmi: 'BMI', creatinine: 'கிரியேட்டினின்',
      familyDiabetes: 'குடும்பம்: நீரிழிவு', familyHeart: 'குடும்பம்: இதயம்',
      high: 'கடுமையான ஆபத்து', medium: 'ஆபத்து', low: 'இயல்பு',
      explanation: 'AI மருத்துவ காரணம்', recommend: 'சிகிச்சை திட்டம்',
      awaitingTitle: 'காத்திருக்கிறது', awaitingDesc: 'தரவை உள்ளிடவும்.'
    },
    te: {
      title: 'ఆరోగ్య పరీక్ష', subtitle: 'అధునాతన ప్రమాద అంచనా',
      vitals: 'క్లినికల్ కొలమానాలు', familyHistory: 'జన్యుపరమైన ప్రమాదం',
      run: 'పరీక్ష ప్రారంభించండి', results: 'పరీక్ష ఫలితాలు',
      diabetes: 'మధుమేహం', heart: 'గుండె జబ్బు', kidney: 'కిడ్నీ వ్యాధి',
      age: 'వయసు', gender: 'లింగం', glucose: 'గ్లూకోజ్', hba1c: 'HbA1c',
      cholesterol: 'కొలెస్ట్రాల్', bloodPressure: 'రక్తపోటు', bmi: 'BMI', creatinine: 'క్రియాటినిన్',
      familyDiabetes: 'కుటుంబం: మధుమేహం', familyHeart: 'కుటుంబం: గుండె',
      high: 'తీవ్ర ప్రమాదం', medium: 'ప్రమాదం', low: 'సాధారణం',
      explanation: 'AI కారణం', recommend: 'చికిత్స ప్రణాళిక',
      awaitingTitle: 'వేచి ఉంది', awaitingDesc: 'డేటాను నమోదు చేయండి.'
    },
    mr: {
        title: 'आरोग्य तपासणी', subtitle: 'प्रगत जोखीम मूल्यांकन',
        vitals: 'क्लीनिकल मेट्रिक्स', familyHistory: 'अनुवांशिक जोखीम',
        run: 'तपासणी सुरू करा', results: 'तपासणी परिणाम',
        diabetes: 'मधुमेह', heart: 'हृदयविकार', kidney: 'किडनी आजार',
        age: 'वय', gender: 'लिंग', glucose: 'ग्लुकोज', hba1c: 'HbA1c',
        cholesterol: 'कोलेस्ट्रॉल', bloodPressure: 'रक्तदाब', bmi: 'BMI', creatinine: 'क्रिएटिनिन',
        familyDiabetes: 'कुटुंब: मधुमेह', familyHeart: 'कुटुंब: हृदय',
        high: 'गंभीर जोखीम', medium: 'वाढलेली जोखीम', low: 'सामान्य',
        explanation: 'AI कारण', recommend: 'उपचार योजना',
        awaitingTitle: 'वाट पाहत आहे', awaitingDesc: 'डेटा प्रविष्ट करा.'
    },
    gu: {
        title: 'સ્વાસ્થ્ય તપાસ', subtitle: 'અદ્યતન જોખમ મૂલ્યાંકન',
        vitals: 'ક્લિનિકલ મેટ્રિક્સ', familyHistory: 'આનુવંશિક જોખમ',
        run: 'તપાસ શરૂ કરો', results: 'પરિણામો',
        diabetes: 'ડાયાબિટીસ', heart: 'હૃદય રોગ', kidney: 'કિડની રોગ',
        age: 'ઉંમર', gender: 'લિંગ', glucose: 'ગ્લુકોઝ', hba1c: 'HbA1c',
        cholesterol: 'કોલેસ્ટ્રોલ', bloodPressure: 'બ્લડ પ્રેશર', bmi: 'BMI', creatinine: 'ક્રિએટિનાઇન',
        familyDiabetes: 'પરિવાર: ડાયાબિટીસ', familyHeart: 'પરિવાર: હૃદય',
        high: 'ગંભીર જોખમ', medium: 'જોખમ', low: 'સામાન્ય',
        explanation: 'AI કારણ', recommend: 'સારવાર યોજના',
        awaitingTitle: 'પ્રતીક્ષા કરી રહ્યા છીએ', awaitingDesc: 'ડેટા દાખલ કરો.'
    },
    kn: {
        title: 'ಆರೋಗ್ಯ ತಪಾಸಣೆ', subtitle: 'ಮುಂಗಡ ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ',
        vitals: 'ಕ್ಲಿನಿಕಲ್ ಮೆಟ್ರಿಕ್ಸ್', familyHistory: 'ಆನುವಂಶಿಕ ಅಪಾಯ',
        run: 'ತಪಾಸಣೆ ಪ್ರಾರಂಭಿಸಿ', results: 'ಫಲಿತಾಂಶಗಳು',
        diabetes: 'ಮಧುಮೇಹ', heart: 'ಹೃದ್ರೋಗ', kidney: 'ಮೂತ್ರಪಿಂಡ ರೋಗ',
        age: 'ವಯಸ್ಸು', gender: 'ಲಿಂಗ', glucose: 'ಗ್ಲೂಕೋಸ್', hba1c: 'HbA1c',
        cholesterol: 'ಕೊಲೆಸ್ಟ್ರಾಲ್', bloodPressure: 'ರಕ್ತದೊತ್ತಡ', bmi: 'BMI', creatinine: 'ಕ್ಯಾಟಿನೈನ್',
        familyDiabetes: 'ಕುಟುಂಬ: ಮಧುಮೇಹ', familyHeart: 'ಕುಟುಂಬ: ಹೃದಯ',
        high: 'ತೀವ್ರ ಅಪಾಯ', medium: 'ಅಪಾಯ', low: 'ಸಾಮಾನ್ಯ',
        explanation: 'AI ಕಾರಣ', recommend: 'ಚಿಕಿತ್ಸಾ ಯೋಜನೆ',
        awaitingTitle: 'ಕಾಯಲಾಗುತ್ತಿದೆ', awaitingDesc: 'ಡೇಟಾ ನಮೂದಿಸಿ.'
    },
    ml: {
        title: 'ആരോഗ്യ പരിശോധന', subtitle: 'നൂതന അപകടസാധ്യത വിലയിരുത്തൽ',
        vitals: 'ക്ലിനിക്കൽ അളവുകൾ', familyHistory: 'ജനിതക അപകടസാധ്യത',
        run: 'പരിശോധന തുടങ്ങുക', results: 'ഫലങ്ങൾ',
        diabetes: 'പ്രമേഹം', heart: 'ഹൃദ്രോഗം', kidney: 'വൃക്കരോഗം',
        age: 'പ്രായം', gender: 'ലിംഗം', glucose: 'ഗ്ലൂക്കോസ്', hba1c: 'HbA1c',
        cholesterol: 'കൊളസ്ട്രോൾ', bloodPressure: 'രക്തസമ്മർദ്ദം', bmi: 'BMI', creatinine: 'ക്രിയാറ്റിനിൻ',
        familyDiabetes: 'കുടുംബം: പ്രമേഹം', familyHeart: 'കുടുംബം: ഹൃദയം',
        high: 'ഗുരുതരമായ അപകടസാധ്യത', medium: 'അപകടസാധ്യത', low: 'സാധാരണ',
        explanation: 'AI കാരണം', recommend: 'ചികിത്സാ പദ്ധതി',
        awaitingTitle: 'കാത്തിരിക്കുന്നു', awaitingDesc: 'വിവരങ്ങൾ നൽകുക.'
    },
    pa: {
        title: 'ਸਿਹਤ ਜਾਂਚ', subtitle: 'ਉੱਨਤ ਜੋਖਮ ਮੁਲਾਂਕਣ',
        vitals: 'ਕਲੀਨਿਕਲ ਮੈਟ੍ਰਿਕਸ', familyHistory: 'ਜੈਨੇਟਿਕ ਜੋਖਮ',
        run: 'ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ', results: 'ਨਤੀਜੇ',
        diabetes: 'ਸ਼ੂਗਰ', heart: 'ਦਿਲ ਦੀ ਬਿਮਾਰੀ', kidney: 'ਗੁਰਦੇ ਦੀ ਬਿਮਾਰੀ',
        age: 'ਉਮਰ', gender: 'ਲਿੰਗ', glucose: 'ਗਲੂਕੋਜ਼', hba1c: 'HbA1c',
        cholesterol: 'ਕੋਲੈਸਟ੍ਰੋਲ', bloodPressure: 'ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ', bmi: 'BMI', creatinine: 'ਕ੍ਰੀਏਟੀਨਾਈਨ',
        familyDiabetes: 'ਪਰਿਵਾਰ: ਸ਼ੂਗਰ', familyHeart: 'ਪਰਿਵਾਰ: ਦਿਲ',
        high: 'ਗੰਭੀਰ ਜੋਖਮ', medium: 'ਜੋਖਮ', low: 'ਆਮ',
        explanation: 'AI ਕਾਰਨ', recommend: 'ਇਲਾਜ ਯੋਜਨਾ',
        awaitingTitle: 'ਉਡੀਕ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ', awaitingDesc: 'ਡਾਟਾ ਭਰੋ.'
    }
  }

  const t = translations[language] || translations.en

  const getRiskStyles = (risk) => {
    switch (risk) {
      case 'high': return { bg: 'bg-rose-50', text: 'text-rose-600', bar: 'bg-rose-500', border: 'border-rose-200' }
      case 'medium': return { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-500', border: 'border-amber-200' }
      case 'low': return { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500', border: 'border-emerald-200' }
      default: return { bg: 'bg-slate-50', text: 'text-slate-600', bar: 'bg-slate-500', border: 'border-slate-200' }
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase">{globalT.diagnosticProtocol}</span>
          </div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{t.title}</h2>
          <p className="text-sm text-[var(--text-muted)] font-medium">{t.subtitle}</p>
        </div>
        <div className="flex space-x-3 items-center">
             <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                <Brain className="w-5 h-5" />
             </div>
             <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
             </div>
             <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                <Cpu className="w-5 h-5" />
             </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 animate-in">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <p className="text-sm font-semibold text-rose-600">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Input Matrix */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Clinical Biomarkers Card */}
            <div className="main-card p-8 group transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Activity className="w-32 h-32" />
              </div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{t.vitals}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'age', label: t.age, icon: <Info className="w-4 h-4" /> },
                    { name: 'glucose', label: t.glucose, icon: <Droplets className="w-4 h-4" /> },
                    { name: 'hba1c', label: t.hba1c, icon: <Zap className="w-4 h-4" />, step: '0.1' },
                    { name: 'cholesterol', label: t.cholesterol, icon: <Heart className="w-4 h-4" /> },
                    { name: 'bp', label: t.bloodPressure, icon: <Activity className="w-4 h-4" /> },
                    { name: 'bmi', label: t.bmi, icon: <TrendingUp className="w-4 h-4" />, step: '0.1' },
                    { name: 'creatinine', label: t.creatinine, icon: <Activity className="w-4 h-4" />, step: '0.1' },
                  ].map(field => (
                    <div key={field.name} className="space-y-2 group">
                      <label className="text-xs font-bold text-slate-500 uppercase pl-1 transition-colors group-focus-within:text-blue-600">
                        {field.label}
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">{field.icon}</div>
                        <input
                          type="number"
                          name={field.name}
                          step={field.step || '1'}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold text-[var(--text-primary)] focus:border-blue-500 outline-none transition-all placeholder:text-[var(--text-muted)] hover:bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Genetic Predisposition Card */}
            <div className="main-card p-8 bg-blue-50/50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t.familyHistory}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'family_history_diabetes', label: t.familyDiabetes },
                  { name: 'family_history_heart', label: t.familyHeart },
                ].map(item => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleToggle(item.name)}
                     className={`flex items-center justify-between p-5 rounded-xl border transition-all group outline-none ${
                      formData[item.name]
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'
                    }`}
                  >
                    <span className="text-sm font-bold uppercase">{item.label}</span>
                    <div className={`w-10 h-5 rounded-full relative transition-all ${formData[item.name] ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData[item.name] ? 'left-5' : 'left-1'}`}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-base flex items-center justify-center space-x-2"
            >
              {loading ? (
                <RefreshCcw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{t.run}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Intelligence Side-panel */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
          <div className="main-card p-8 sticky top-10 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t.results}</h3>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              {results ? (
                <div className="space-y-6 animate-in">
                  {results.map((res, idx) => {
                    const s = getRiskStyles(res.risk_level)
                    return (
                      <div key={idx} className={`p-5 rounded-2xl border ${s.bg} ${s.border} relative overflow-hidden group`}>
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-[var(--text-primary)] uppercase">{t[res.disease]}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${s.border} ${s.text} bg-white`}>{t[res.risk_level]}</span>
                          </div>
                          
                          <div className="flex items-end justify-between mb-4">
                            <h4 className={`text-3xl font-black ${s.text}`}>{Math.round(res.probability * 100)}%</h4>
                            <div className="flex space-x-2">
                              <button onClick={() => handleExplain(res.disease)} className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-all border border-slate-200" title="AI Explain">
                                <Brain className="w-4 h-4 text-blue-600" />
                              </button>
                              <button 
                                onClick={() => onNavigate('chat', { 
                                  type: 'Health Prediction', 
                                  disease: res.disease, 
                                  probability: Math.round(res.probability * 100),
                                  risk_level: res.risk_level
                                })}
                                className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-all border border-slate-200" 
                                title={globalT.consultDoctor}
                              >
                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                              </button>
                            </div>
                          </div>

                          <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${s.bar}`} style={{ width: `${Math.round(res.probability * 100)}%` }}></div>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                             <div className="flex items-center space-x-1.5">
                                <span className="text-[10px] font-semibold uppercase text-slate-500">{globalT.aiConfidence}: {res.confidence}%</span>
                             </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* AI Explanation Sub-panel */}
                  {explanation && (
                    <div className="p-5 border border-blue-200 bg-blue-50/50 rounded-xl space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                           <ShieldCheck className="w-4 h-4 text-blue-600" />
                           <p className="text-[10px] font-bold text-blue-700 uppercase">{t.explanation}</p>
                        </div>
                        <button 
                          onClick={handlePlayAudio}
                          disabled={audioLoading}
                          className={`p-2 rounded-lg border transition-all ${isPlaying ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                        >
                          {audioLoading ? <Activity className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{explanation.text}</p>
                      <button 
                        onClick={() => onNavigate('plan')}
                        className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold uppercase transition-all"
                      >
                        {globalT.deployMatrix}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">{t.awaitingTitle}</h4>
                    <p className="text-xs text-[var(--text-muted)] font-medium max-w-[200px] leading-relaxed mx-auto">{t.awaitingDesc}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="bg-emerald-50 p-3 rounded-xl flex items-center space-x-3 border border-emerald-100">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <p className="text-[10px] font-semibold text-emerald-800 leading-tight">
                       Clinical Decision Support System active. Verify findings with practitioner.
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RefreshCcw(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className + " lucide lucide-refresh-ccw"}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}

export default Prediction
