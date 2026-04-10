import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  Clipboard, 
  Phone, 
  Stethoscope, 
  User, 
  MapPin, 
  Gauge, 
  Droplets, 
  Heart, 
  Zap, 
  Brain, 
  Info, 
  Plus, 
  ShieldCheck, 
  Volume2, 
  Pause, 
  Sparkles, 
  Cpu,
  Clock,
  Layers,
  Globe
} from 'lucide-react'
import AgenticConsensus from './AgenticConsensus'

import { API_URL } from '../config'
import aiService, { languageMap } from '../services/aiService'
import { getT } from '../utils/translations'

function AshaMode({ language = 'en', selectedPatient = null, onNavigate = () => {} }) {
  const globalT = getT(language);
  const [symptoms, setSymptoms] = useState({
    fever: false, cough: false, breathing: false, chest_pain: false,
    vomiting: false, diarrhea: false, weakness: false, unconscious: false,
    bleeding: false, high_fever: false, swelling: false, back_pain: false
  })
  
  const [patientData, setPatientData] = useState({
    age: selectedPatient?.age || 35,
    gender: selectedPatient?.gender === 1 ? 'Female' : 'Male',
    village: '',
    glucose: selectedPatient?.glucose || 100,
    hba1c: selectedPatient?.hba1c || 5.6,
    bp: selectedPatient?.bp_systolic || 120,
    cholesterol: selectedPatient?.cholesterol || 200,
    bmi: selectedPatient?.bmi || 24,
    creatinine: selectedPatient?.creatinine || 1.0,
    smoking: selectedPatient?.smoking || 0,
    family_history_diabetes: selectedPatient?.family_history_diabetes || 0,
    family_history_heart: selectedPatient?.family_history_heart || 0
  })
  
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioInstance, setAudioInstance] = useState(null)
  const [error, setError] = useState(null)
  const [showConsensus, setShowConsensus] = useState(false)
  const [consensusData, setConsensusData] = useState(null)
  const [consensusLoading, setConsensusLoading] = useState(false)

  useEffect(() => {
    return () => { if (audioInstance) audioInstance.pause() }
  }, [audioInstance])

  const handleSymptomChange = (symptom) => {
    setSymptoms(prev => ({ ...prev, [symptom]: !prev[symptom] }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setPatientData(prev => ({
      ...prev,
      [name]: (name === 'village' || name === 'gender') ? value : parseFloat(value) || 0
    }))
  }

  const handleToggle = (name) => {
    setPatientData(prev => ({ ...prev, [name]: prev[name] === 1 ? 0 : 1 }))
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    try {
      // PHASE 1: Fetch ML Risks from Backend
      let mlRisks = { diabetes: 0.1, heart: 0.1, kidney: 0.1 };
      try {
          const mlResponse = await axios.post(`${API_URL}/api/predict/all`, patientData);
          if (mlResponse.data.success) mlRisks = mlResponse.data.predictions;
      } catch (mlErr) { console.warn("ML Triage Fetch Failed:", mlErr); }

      // PHASE 2: Local Emergency Triage Logic (Red/Yellow/Green)
      const maxRisk = Math.max(...Object.values(mlRisks));
      const critical = symptoms.chest_pain || symptoms.unconscious || symptoms.bleeding || symptoms.breathing;
      const moderate = symptoms.fever || symptoms.vomiting || symptoms.diarrhea;

      let urgency = "GREEN";
      let actions = ["✅ Monitor at home", "📄 Keep health card updated"];
      let timeframe = "Standard";

      if (critical || maxRisk > 0.7) {
        urgency = "RED";
        timeframe = "0-2 hours";
        actions = ["🚨 Immediate PHC transfer Required", "📞 Call 108 Emergency Now", "👨‍⚕️ Alert local MO"];
      } else if (moderate || maxRisk > 0.4) {
        urgency = "YELLOW";
        timeframe = "24-48 hours";
        actions = ["🏠 Scheduled PHC Visit", "💊 Symptomatic relief as per kit", "📈 4-hour vital tracking"];
      }

      // PHASE 3: AI Diagnosis (Netlify Direct)
      const aiResponse = await aiService.analyzeASHACase(
          { ...patientData, predictions: mlRisks },
          symptoms,
          language
      );

      setResult({
        success: true,
        urgency,
        urgency_text: `${urgency} - ${timeframe}`,
        actions,
        ai_insights: aiResponse.response,
        ml_predictions: mlRisks,
        agent_status: aiResponse.agent_status
      });

    } catch (error) {
      console.error('ASHA Analysis error:', error)
      setError(language === 'hi' ? 'विश्लेषण में त्रुटि हुई।' : 'Error performing analysis.')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayAudio = async () => {
    if (!result || !result.ai_insights) return
    if (isPlaying && audioInstance) { audioInstance.pause(); setIsPlaying(false); return }
    setAudioLoading(true)
    try {
      const cleanText = result.ai_insights.replace(/[#*]/g, '').substring(0, 4000)
      const fdData = new FormData(); fdData.append('text', cleanText); fdData.append('language', language)
      const response = await axios.post(`${API_URL}/api/voice/synthesize`, fdData, { responseType: 'blob' })
      const audioUrl = URL.createObjectURL(new Blob([response.data], { type: 'audio/mpeg' }))
      const audio = new Audio(audioUrl); setAudioInstance(audio)
      audio.onplay = () => setIsPlaying(true); audio.onended = () => setIsPlaying(false); audio.onpause = () => setIsPlaying(false)
      audio.play()
    } catch (err) { console.error('Audio error:', err) }
    finally { setAudioLoading(false) }
  }
  
  const handleActivateConsensus = async () => {
    if (!result) return
    setConsensusLoading(true)
    setError(null)
    try {
      const langName = languageMap[language] || 'english'
      const response = await axios.post(`${API_URL}/api/asha/consensus`, {
        patient: { ...patientData, language: langName },
        symptoms: symptoms
      })
      if (response.data.success) { setConsensusData(response.data); setShowConsensus(true) }
      else throw new Error(response.data.error || "Consensus failed")
    } catch (error) {
      console.error('Consensus error:', error)
      setError(language === 'hi' ? 'कंसेंसस पैनल सक्रिय करने में विफल।' : 'Failed to activate consensus panel.')
    } finally {
      setConsensusLoading(false)
    }
  }

  const labels = {
    en: {
      title: 'Community Health Coordinator', subtitle: 'Field Operations & Triage Assessment',
      symptoms: 'Patient Symptoms', patientInfo: 'Patient Profile', age: 'Age', gender: 'Gender', village: 'Sector / Village',
      labValues: 'Clinical Metrics', glucose: 'Glucose', hba1c: 'HbA1c', bp: 'BP Systolic', cholesterol: 'Cholesterol', bmi: 'BMI', creatinine: 'Creatinine',
      lifestyle: 'Risk Factors', smoking: 'Active Smoker', familyDiabetes: 'Family: Diabetes', familyHeart: 'Family: Heart Disease',
      analyze: 'Analyze Patient Data', urgency: 'Triage Priority', actions: 'Recommended Actions', callScript: 'Handover Summary', insights: 'AI Clinical Reasoning'
    },
    hi: {
      title: 'ASHA स्मार्ट इंटेलिजेंस', subtitle: 'विकेंद्रीकृत न्यूरल सपोर्ट मैट्रिक्स',
      symptoms: 'लक्षण वेक्टर मूल्यांकन', patientInfo: 'विटल्स और बायोमार्कर स्ट्रीम', age: 'उम्र', gender: 'लिंग', village: 'क्षेत्र / गाँव',
      labValues: 'नैदानिक मेट्रिक्स काउंसिल', glucose: 'ग्लूकोज', hba1c: 'HbA1c', bp: 'रक्तचाप', cholesterol: 'कोलेस्ट्रॉल', bmi: 'बीएमआई', creatinine: 'क्रिएटिनिन',
      lifestyle: 'पर्यावरणीय जोखिम', smoking: 'धूम्रपान', familyDiabetes: 'आनुवंशिक: मधुमेह', familyHeart: 'आनुवंशिक: हृदय रोग',
      analyze: 'न्यूरल प्रोटोकॉल शुरू करें', urgency: 'सामरिक तात्कालिकता वेक्टर', actions: 'रणनीतिक देखभाल मैट्रिक्स', callScript: 'हैंडओवर प्रोटोकॉल v2.1', insights: 'AI नैदानिक तर्क'
    },
    bn: {
        title: 'আশা স্বাস্থ্য সমন্বয়কারী', subtitle: 'মাঠ পর্যায়ের অপারেশন এবং ট্রায়েজ',
        symptoms: 'রোগীর লক্ষণসমূহ', patientInfo: 'রোগীর প্রোফাইল', age: 'বয়স', gender: 'লিঙ্গ', village: 'গ্রাম',
        labValues: 'ক্লিনিক্যাল মেট্রিক্স', glucose: 'গ্লুকোজ', hba1c: 'HbA1c', bp: 'রক্তচাপ', cholesterol: 'কোলেস্টেরল', bmi: 'BMI', creatinine: 'ক্রিয়েটিনিন',
        lifestyle: 'ঝুঁকির কারণ', smoking: 'ধূমপান', familyDiabetes: 'বংশগত: ডায়াবেটিস', familyHeart: 'বংশগত: হৃদরোগ',
        analyze: 'বিশ্লেষণ করুন', urgency: 'ট্রায়েজ অগ্রাধিকার', actions: 'প্রস্তাবিত পদক্ষেপ', callScript: 'হস্তান্তর সারাংশ', insights: 'AI বিশ্লেষণ'
    },
    ta: {
        title: 'ஆஷா சுகாதார ஒருங்கிணைப்பாளர்', subtitle: 'களச் செயல்பாடு மற்றும் மதிப்பீடு',
        symptoms: 'நோயாளியின் அறிகுறிகள்', patientInfo: 'நோயாளி விவரங்கள்', age: 'வயது', gender: 'பாலினம்', village: 'கிராமம்',
        labValues: 'மருத்துவ அளவீடுகள்', glucose: 'குளுக்கோஸ்', hba1c: 'HbA1c', bp: 'இரத்த அழுத்தம்', cholesterol: 'கொலஸ்ட்ரால்', bmi: 'BMI', creatinine: 'கிரியேட்டினின்',
        lifestyle: 'ஆபத்து காரணிகள்', smoking: 'புகைப்பிடித்தல்', familyDiabetes: 'மரபணு: நீரிழிவு', familyHeart: 'மரபணு: இதயம்',
        analyze: 'பகுப்பாய்வு செய்', urgency: 'முன்னுரிமை', actions: 'பரிந்துரைக்கப்படும் செயல்கள்', callScript: 'ஒப்படைப்பு சுருக்கம்', insights: 'AI மருத்துவ காரணம்'
    },
    te: {
        title: 'ఆశా ఆరోగ్య సమన్వయకర్త', subtitle: 'క్షేత్ర స్థాయి కార్యకలాపాలు & అంచనా',
        symptoms: 'రోగి లక్షణాలు', patientInfo: 'రోగి ప్రొఫైల్', age: 'వయసు', gender: 'లింగం', village: 'గ్రామం',
        labValues: 'క్లినికల్ కొలమానాలు', glucose: 'గ్లూకోజ్', hba1c: 'HbA1c', bp: 'రక్తపోటు', cholesterol: 'కొలెస్ట్రాల్', bmi: 'BMI', creatinine: 'క్రియాటినిన్',
        lifestyle: 'ప్రమాద కారకాలు', smoking: 'ధూమపానం', familyDiabetes: 'కుటుంబం: మధుమేహం', familyHeart: 'కుటుంబం: గుండె',
        analyze: 'విశ్లేషించండి', urgency: 'ప్రాధాన్యత', actions: 'సూచించిన చర్యలు', callScript: 'సారాంశం', insights: 'AI విశ్లేషణ'
    },
    mr: {
        title: 'आशा आरोग्य समन्वयक', subtitle: 'फील्ड ऑपरेशन्स आणि मूल्यांकन',
        symptoms: 'रुग्णाची लक्षणे', patientInfo: 'रुग्ण प्रोफाइल', age: 'वय', gender: 'लिंग', village: 'गाव',
        labValues: 'क्लीनिकल मेट्रिक्स', glucose: 'ग्लुकोज', hba1c: 'HbA1c', bp: 'रक्तदाब', cholesterol: 'कोलेस्ट्रॉल', bmi: 'BMI', creatinine: 'क्रिएटिनिन',
        lifestyle: 'धोका घटक', smoking: 'धूम्रपान', familyDiabetes: 'अनुवांशिक: मधुमेह', familyHeart: 'अनुवांशिक: हृदयविकार',
        analyze: 'विश्लेषण करा', urgency: 'प्राधान्य', actions: 'सुचवलेल्या कृती', callScript: 'सारांश', insights: 'AI विश्लेषण'
    },
    gu: {
        title: 'આશા સ્વાસ્થ્ય સંયોજક', subtitle: 'ક્ષેત્ર કામગીરી અને મૂલ્યાંકન',
        symptoms: 'દર્દીના લક્ષણો', patientInfo: 'દર્દીની પ્રોફાઇલ', age: 'ઉંમર', gender: 'લિંગ', village: 'ગામ',
        labValues: 'ક્લિનિકલ મેટ્રિક્સ', glucose: 'ગ્લુકોઝ', hba1c: 'HbA1c', bp: 'બ્લડ પ્રેશર', cholesterol: 'કોલેસ્ટ્રોલ', bmi: 'BMI', creatinine: 'ક્રિએટિનાઇન',
        lifestyle: 'જોખમ ના પરિબળો', smoking: 'ધૂમ્રપાન', familyDiabetes: 'પરિવાર: ડાયાબિટીસ', familyHeart: 'પરિવાર: હૃદય રોગ',
        analyze: 'વિશ્લેષણ કરો', urgency: 'પ્રાધાન્યતા', actions: 'સૂચવેલા પગલાં', callScript: 'સારાંશ', insights: 'AI વિશ્લેષણ'
    },
    kn: {
        title: 'ಆಶಾ ಆರೋಗ್ಯ ಸಂಯೋಜಕರು', subtitle: 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಾಚರಣೆ ಮತ್ತು ಮೌಲ್ಯಮಾಪನ',
        symptoms: 'ರೋಗಿಯ ಲಕ್ಷಣಗಳು', patientInfo: 'ರೋಗಿಯ ಪ್ರೊಫೈಲ್', age: 'ವಯಸ್ಸು', gender: 'ಲಿಂಗ', village: 'ಹಳ್ಳಿ',
        labValues: 'ಕ್ಲಿನಿಕಲ್ ಮೆಟ್ರಿಕ್ಸ್', glucose: 'ಗ್ಲೂಕೋಸ್', hba1c: 'HbA1c', bp: 'ರಕ್ತದೊತ್ತಡ', cholesterol: 'ಕೊಲೆಸ್ಟ್ರಾಲ್', bmi: 'BMI', creatinine: 'ಕ್ಯಾಟಿನೈನ್',
        lifestyle: 'ಅಪಾಯ ಘಟಕಗಳು', smoking: 'ಧೂಮಪಾನ', familyDiabetes: 'ಕುಟುಂಬ: ಮಧುಮೇಹ', familyHeart: 'ಕುಟುಂಬ: ಹೃದಯ',
        analyze: 'ವಿಶ್ಲೇಷಿಸಿ', urgency: 'ಆದ್ಯತೆ', actions: 'ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳು', callScript: 'ಸಾರಾಂಶ', insights: 'AI ವಿಶ್ಲೇಷಣೆ'
    },
    ml: {
        title: 'ആശാ ആരോഗ്യ കോർഡിനേറ്റർ', subtitle: 'ഫീൽഡ് വിലയിരുത്തൽ',
        symptoms: 'രോഗിയുടെ ലക്ഷണങ്ങൾ', patientInfo: 'രോഗിയുടെ പ്രൊഫൈൽ', age: 'പ്രായം', gender: 'ലിംഗം', village: 'ഗ്രാമം',
        labValues: 'ക്ലിനിക്കൽ അളവുകൾ', glucose: 'ഗ്ലൂക്കോസ്', hba1c: 'HbA1c', bp: 'രക്തസമ്മർദ്ദം', cholesterol: 'കൊളസ്ട്രോൾ', bmi: 'BMI', creatinine: 'ക്രിയാറ്റിനിൻ',
        lifestyle: 'അപകടസാധ്യത ഘടകങ്ങൾ', smoking: 'പുകവലി', familyDiabetes: 'കുടുംബം: പ്രമേഹം', familyHeart: 'കുടുംബം: ഹൃദയം',
        analyze: 'വിശകലനം ചെയ്യുക', urgency: 'മുൻഗണന', actions: 'നിർദ്ദേശിച്ച പ്രവർത്തനങ്ങൾ', callScript: 'സംഗ്രഹം', insights: 'AI വിശകലനം'
    },
    pa: {
        title: 'ਆਸ਼ਾ ਸਿਹਤ ਕੋਆਰਡੀਨੇਟਰ', subtitle: 'ਫੀਲਡ ਮੁਲਾਂਕਣ',
        symptoms: 'ਮਰੀਜ਼ ਦੇ ਲੱਛਣ', patientInfo: 'ਮਰੀਜ਼ ਦੀ ਪ੍ਰੋਫਾਈਲ', age: 'ਉਮਰ', gender: 'ਲਿੰਗ', village: 'ਪਿੰਡ',
        labValues: 'ਕਲੀਨਿਕਲ ਮੈਟ੍ਰਿਕਸ', glucose: 'ਗਲੂਕੋਜ਼', hba1c: 'HbA1c', bp: 'ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ', cholesterol: 'ਕੋਲੈਸਟ੍ਰੋਲ', bmi: 'BMI', creatinine: 'ਕ੍ਰੀਏਟੀਨਾਈਨ',
        lifestyle: 'ਜੋਖਮ ਦੇ ਕਾਰਕ', smoking: 'ਸਿਗਰਟਨੋਸ਼ੀ', familyDiabetes: 'ਪਰਿਵਾਰ: ਸ਼ੂਗਰ', familyHeart: 'ਪਰਿਵਾਰ: ਦਿਲ',
        analyze: 'ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ', urgency: 'ਤਰਜੀਹ', actions: 'ਸੁਝਾਏ ਗਏ ਕੰਮ', callScript: 'ਸੰਖੇਪ', insights: 'AI ਵਿਸ਼ਲੇਸ਼ਣ'
    }
  }

  const t = labels[language] || labels.en

  const symptomList = [
    { key: 'fever', label: { en: 'Fever', hi: 'बुखार', bn: 'জ্বর', ta: 'காய்ச்சல்', te: 'జ్వరం', mr: 'ताप', gu: 'તાવ', kn: 'ಜ್ವರ', ml: 'പനി', pa: 'ਬੁਖਾਰ' }, icon: '🌡️' },
    { key: 'cough', label: { en: 'Cough', hi: 'खांसी', bn: 'কাশি', ta: 'இருமல்', te: 'దగ్గు', mr: 'खोकला', gu: 'ઉધરસ', kn: 'ಕೆಮ್ಮು', ml: 'ചുമ', pa: 'ਖੰਘ' }, icon: '😷' },
    { key: 'breathing', label: { en: 'Dyspnea', hi: 'सांस में दिक्कत', bn: 'শ্বাসকষ্ট', ta: 'மூச்சுத் திணறல்', te: 'శ్వాస తీసుకోవడంలో ఇబ్బంది', mr: 'श्वास घेण्यास त्रास', gu: 'શ્વાસ લેવામાં તબકલીફ', kn: 'ಉಸಿರಾಟದ ತೊಂದರೆ', ml: 'ശ്വാസതടസ്സം', pa: 'ਸਾਹ ਦੀ ਤਕਲੀਫ' }, icon: '🫁' },
    { key: 'chest_pain', label: { en: 'Chest Pain', hi: 'सीने में दर्द', bn: 'বুকে ব্যথা', ta: 'நெஞ்சு வலி', te: 'ఛాతీ నొప్పి', mr: 'छातीत दुखणे', gu: 'છાતીમાં દુખાવો', kn: 'ಎದೆ ನೋವು', ml: 'നെഞ്ചുവേദന', pa: 'ਛਾਤੀ ਵਿਚ ਦਰਦ' }, icon: '💔' },
    { key: 'vomiting', label: { en: 'Vomiting', hi: 'उल्टी', bn: 'বমি', ta: 'வாந்தி', te: 'వాంతులు', mr: 'उलट्या', gu: 'ઉલટી', kn: 'ವಾಂತಿ', ml: 'ഛർദ്ദി', pa: 'ਉਲਟੀ' }, icon: '🤮' },
    { key: 'diarrhea', label: { en: 'Diarrhea', hi: 'दस्त', bn: 'ডায়রিয়া', ta: 'வயிற்றுப்போக்கு', te: 'విరేచనాలు', mr: 'अतिसार', gu: 'ઝાડા', kn: 'ಅತಿಸಾರ', ml: 'അതിസാരം', pa: 'ਦਸਤ' }, icon: '💩' },
    { key: 'weakness', label: { en: 'Fatigue', hi: 'कमजोरी', bn: 'ক্লান্তি', ta: 'சோர்வு', te: 'అలసట', mr: 'थकवा', gu: 'થાક', kn: 'ಆಯಾಸ', ml: 'ക്ഷീണം', pa: 'ਥਕਾਵਟ' }, icon: '😴' },
    { key: 'unconscious', label: { en: 'Unconscious', hi: 'बेहोशी', bn: 'অজ্ঞান', ta: 'மயக்கம்', te: 'అపస్మారక స్థితి', mr: 'बेशुद्ध', gu: 'બેભાન', kn: 'ಪ್ರಜ್ಞಾಹೀನ', ml: 'ബോധക്ഷയം', pa: 'ਬੇਹੋਸ਼' }, icon: '😵' },
    { key: 'bleeding', label: { en: 'Bleeding', hi: 'रक्तस्राव', bn: 'রক্তপাত', ta: 'இரத்தப்போக்கு', te: 'రక్తస్రావం', mr: 'रक्तस्त्राव', gu: 'રક્તસ્ત્રાવ', kn: 'ರಕ್ತಸ್ರಾವ', ml: 'രക്തസ്രാവം', pa: 'ਖੂਨ ਵਗਣਾ' }, icon: '🩸' },
    { key: 'high_fever', label: { en: 'Severe Fever', hi: 'तेज बुखार', bn: 'তীব্র জ্বর', ta: 'கடுமையான காய்ச்சல்', te: 'తీవ్రమైన జ్వరం', mr: 'तीव्र ताप', gu: 'વધુ તાવ', kn: 'ತೀವ್ರ ಜ್ವರ', ml: 'കടുത്ത പനി', pa: 'ਤੇਜ਼ ਬੁਖਾਰ' }, icon: '🔥' },
    { key: 'swelling', label: { en: 'Swelling', hi: 'सूजन', bn: 'ফোলা', ta: 'வீக்கம்', te: 'వాపు', mr: 'सूज', gu: 'સોજો', kn: 'ಊತ', ml: 'വീക്കം', pa: 'ਸੋਜ' }, icon: '🦵' },
    { key: 'back_pain', label: { en: 'Back Pain', hi: 'पीठ दर्द', bn: 'পিঠে ব্যথা', ta: 'முதுகு வலி', te: 'వెన్నునొప్పి', mr: 'पाठदुखी', gu: 'પીઠનો દુખાવો', kn: 'ಬೆನ್ನು ನೋವು', ml: 'നടുവേദന', pa: 'ਪਿੱਠ ਦਰਦ' }, icon: '🔙' }
  ]

  const getUrgencyColors = (urgency) => {
    if (urgency === 'RED') return 'border-rose-500 text-rose-600 bg-rose-50'
    if (urgency === 'YELLOW') return 'border-amber-500 text-amber-600 bg-amber-50'
    return 'border-emerald-500 text-emerald-600 bg-emerald-50'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in">
      {showConsensus && consensusData ? (
        <AgenticConsensus data={consensusData} onBack={() => setShowConsensus(false)} onNavigate={onNavigate} />
      ) : (
        <>
          <div className="main-card p-10 flex flex-col md:flex-row items-center justify-between mb-8 group">
             <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                   <Stethoscope className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                   <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full mb-2">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest pt-0.5">{globalT.communityNetwork}</span>
                   </div>
                   <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-1">{t.title}</h2>
                   <p className="text-sm font-semibold text-[var(--text-secondary)]">{t.subtitle}</p>
                </div>
             </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Input Matrix */}
            <div className="lg:col-span-12 xl:col-span-8 space-y-10">
              <div className="grid md:grid-cols-2 gap-10">
                
                <div className="main-card p-8 group">
                   <div className="relative">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">{t.symptoms}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {symptomList.map(symptom => (
                          <button 
                            key={symptom.key}
                            onClick={() => handleSymptomChange(symptom.key)}
                            className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 ${
                              symptoms[symptom.key] 
                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-lg group-hover:scale-110 transition-transform">{symptom.icon}</span>
                            <span className="text-xs font-semibold">{symptom.label[language] || symptom.label.en}</span>
                          </button>
                        ))}
                      </div>
                   </div>
                </div>

                {/* Patient Bio-Profile Matrix */}
                <div className="flex flex-col space-y-6">
                   <div className="main-card p-8 flex-grow">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">{t.patientInfo}</h3>
                      </div>
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">{t.age}</label>
                            <input
                              type="number" name="age" value={patientData.age} onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium text-sm transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">{t.gender}</label>
                            <select
                              name="gender" value={patientData.gender} onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium text-sm transition-all"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">{t.village}</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text" name="village" value={patientData.village} onChange={handleInputChange}
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium text-sm transition-all"
                            />
                          </div>
                        </div>
                      </div>
                   </div>

                   <button
                      onClick={handleAnalyze} disabled={loading}
                      className="w-full btn-primary py-4 flex items-center justify-center space-x-2 text-lg"
                    >
                      {loading ? (
                        <RefreshCcw className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Brain className="w-6 h-6" />
                          <span>{t.analyze}</span>
                        </>
                      )}
                    </button>
                </div>
              </div>

              {/* Lab Metrics Matrix */}
              <div className="main-card p-8 grid md:grid-cols-2 gap-8 relative overflow-hidden">
                  <div className="relative space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{t.labValues}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       {[
                        { name: 'glucose', label: t.glucose, icon: <Droplets className="w-4 h-4 text-slate-400" /> },
                        { name: 'hba1c', label: t.hba1c, icon: <Zap className="w-4 h-4 text-slate-400" />, step: '0.1' },
                        { name: 'bp', label: t.bp, icon: <Gauge className="w-4 h-4 text-slate-400" /> },
                        { name: 'bmi', label: t.bmi, icon: <Activity className="w-4 h-4 text-slate-400" />, step: '0.1' },
                        { name: 'creatinine', label: t.creatinine, icon: <Activity className="w-4 h-4 text-slate-400" />, step: '0.1' },
                        { name: 'cholesterol', label: t.cholesterol, icon: <Heart className="w-4 h-4 text-slate-400" /> },
                      ].map(field => (
                        <div key={field.name} className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">{field.label}</label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">{field.icon}</div>
                            <input
                              type="number" name={field.name} step={field.step || '1'} value={patientData[field.name]} onChange={handleInputChange}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 transition-all font-medium outline-none text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{t.lifestyle}</h3>
                    </div>
                    <div className="space-y-3">
                       {[
                        { name: 'smoking', label: t.smoking, icon: <Zap className="w-4 h-4" /> },
                        { name: 'family_history_diabetes', label: t.familyDiabetes, icon: <Activity className="w-4 h-4" /> },
                        { name: 'family_history_heart', label: t.familyHeart, icon: <Heart className="w-4 h-4" /> }
                      ].map(field => (
                        <button
                          key={field.name} onClick={() => handleToggle(field.name)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                            patientData[field.name] 
                              ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {field.icon}
                            <span className="font-semibold text-xs tracking-tight">{field.label}</span>
                          </div>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${patientData[field.name] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${patientData[field.name] ? 'left-[22px]' : 'left-0.5'}`}></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
              </div>
            </div>

            {/* Tactical Command Center Results */}
            <div className="lg:col-span-12 xl:col-span-4 flex flex-col min-h-[600px]">
               {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 flex items-center space-x-3 mb-6 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span className="font-bold text-xs text-rose-600">{error}</span>
                </div>
              )}

              <div className="main-card p-8 sticky top-10 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{t.urgency}</h3>
                  <div className="status-dot status-online"></div>
                </div>

                <div className="space-y-8 flex-grow">
                   {result ? (
                     <div className="space-y-8 animate-in">
                        {/* High Urgency Vector Card */}
                        <div className={`p-6 rounded-2xl border ${getUrgencyColors(result.urgency)}`}>
                           <div className="relative">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{globalT.priority}</p>
                                  <h4 className="text-3xl font-black">{result.urgency}</h4>
                                </div>
                                <div className="p-3 bg-white/50 rounded-xl">
                                  <AlertTriangle className="w-6 h-6" />
                                </div>
                              </div>
                              <p className="text-sm font-semibold italic border-l-2 border-current pl-3 opacity-90">
                                "{result.urgency_text?.split('-').slice(1).join('-') || result.ai_insights}"
                              </p>
                              <div className="mt-6 flex justify-end">
                                <button
                                  onClick={handlePlayAudio} disabled={audioLoading}
                                  className="p-2 rounded-lg bg-white/50 hover:bg-white transition-colors"
                                >
                                  {audioLoading ? <Activity className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                              </div>
                           </div>
                        </div>

                        {/* Tactical Actions Stack */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span>{t.actions}</span>
                          </h4>
                          <div className="space-y-2">
                            {result.actions?.map((action, i) => (
                              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-3">
                                <div className="text-sm font-bold text-blue-500">{(i+1).toString().padStart(2, '0')}</div>
                                <span className="text-xs font-semibold text-[var(--text-secondary)]">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                         
                         {/* Deep Consensus Activation */}
                         <div className="space-y-3 pt-4 border-t border-slate-200 mt-auto">
                            <button
                              onClick={handleActivateConsensus} disabled={consensusLoading}
                              className="w-full btn-primary py-3 text-sm flex items-center justify-between group"
                            >
                               <div className="flex items-center space-x-3">
                                  <Cpu className="w-5 h-5" />
                                  <span className="font-semibold text-sm">{globalT.consultDoctor}</span>
                               </div>
                               {consensusLoading ? <Activity className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>
                          
                            <div className="grid grid-cols-2 gap-3">
                               <button 
                                 onClick={() => onNavigate('chat')}
                                 className="btn-secondary py-2 text-xs text-blue-600"
                               >
                                 {globalT.openChat}
                               </button>
                               <button 
                                 onClick={() => onNavigate('plan')}
                                 className="btn-secondary py-2 text-xs"
                               >
                                 {globalT.createPlan}
                               </button>
                            </div>
                         </div>

                        {/* Handover Signature Block */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl mt-4">
                           <div className="flex items-center justify-between mb-3">
                             <h4 className="text-[10px] font-bold text-slate-500 uppercase">{t.callScript}</h4>
                             <Clock className="w-3.5 h-3.5 text-slate-400" />
                           </div>
                           <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                             {`ID: ${Math.random().toString(36).substr(2, 6).toUpperCase()}\nNODE: RURAL_CLINIC_A\nSTATUS: ${result.urgency}\nREADY FOR REVIEW`}
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
                          <Stethoscope className="w-10 h-10 text-blue-300" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-[var(--text-primary)]">{globalT.readyForAssessment}</h4>
                          <p className="text-xs text-[var(--text-muted)] font-medium max-w-[200px] leading-relaxed mx-auto">Select symptoms and enter bio-data to begin triage.</p>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
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

export default AshaMode
