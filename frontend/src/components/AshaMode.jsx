import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  Phone, 
  Stethoscope, 
  User, 
  MapPin, 
  Gauge, 
  Droplets, 
  Heart, 
  Zap, 
  Brain, 
  Plus, 
  ShieldCheck, 
  Volume2, 
  Pause, 
  Sparkles, 
  Cpu,
  Clock,
  Globe,
  Printer,
  Share2,
  Calendar,
  BadgeCheck,
  Mic,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  X
} from 'lucide-react'
import AgenticConsensus from './AgenticConsensus'

import { API_URL } from '../config'
import aiService, { languageMap } from '../services/aiService'
import { getT } from '../utils/translations'

// ── Persistent ASHA Worker Profile ────────────────────────────────────────────
function loadASHAProfile() {
  try {
    return JSON.parse(localStorage.getItem('asha_worker_profile') || '{}')
  } catch { return {} }
}

function saveASHAProfile(profile) {
  localStorage.setItem('asha_worker_profile', JSON.stringify(profile))
}

function loadFollowUps() {
  try {
    return JSON.parse(localStorage.getItem('asha_followups') || '[]')
  } catch { return [] }
}

function saveFollowUps(list) {
  localStorage.setItem('asha_followups', JSON.stringify(list))
}

// ── Confidence Meter Component ─────────────────────────────────────────────────
function ConfidenceMeter({ predictions, urgency }) {
  if (!predictions) return null
  const maxRisk = Math.max(predictions.diabetes || 0, predictions.heart || 0, predictions.kidney || 0)
  const confidence = Math.round(70 + Math.abs(maxRisk - 0.5) * 50)
  const ringColor = urgency === 'RED' ? '#f43f5e' : urgency === 'YELLOW' ? '#f59e0b' : '#10b981'

  return (
    <div className="mt-3 flex items-center space-x-3">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${confidence}%`, backgroundColor: ringColor }}
        />
      </div>
      <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">
        AI {confidence}% confident
      </span>
    </div>
  )
}

// ── Risk Score Bar ─────────────────────────────────────────────────────────────
function RiskBar({ label, value, color }) {
  const pct = Math.round((value || 0) * 100)
  const barColor = pct >= 70 ? '#f43f5e' : pct >= 40 ? '#f59e0b' : '#10b981'
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
        <span className="text-[10px] font-black" style={{ color: barColor }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}

// ── Handover Card (Printable) ─────────────────────────────────────────────────
function HandoverCard({ result, patientData, ashaProfile, language }) {
  const docId = `ASHA-${Date.now().toString(36).toUpperCase()}`
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsApp = () => {
    const preds = result.ml_predictions || {}
    const maxRisk = Math.max(preds.diabetes || 0, preds.heart || 0, preds.kidney || 0)
    const msg = encodeURIComponent(
      `🏥 *ASHA Health Alert*\n` +
      `📋 Doc ID: ${docId}\n` +
      `👤 Patient: ${patientData.age}y ${patientData.gender}, ${patientData.village || 'Unknown Village'}\n` +
      `🚨 Urgency: *${result.urgency}*\n` +
      `📊 Max Risk: ${Math.round(maxRisk * 100)}%\n` +
      `✅ Action: ${result.actions?.[0] || 'See PHC'}\n` +
      `🩺 ASHA: ${ashaProfile.name || 'Health Worker'} (${ashaProfile.id || 'ID N/A'})\n` +
      `⏰ ${timestamp}\n` +
      `\n_Powered by Agentic Healthcare AI_`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div className="space-y-4 printable-card">
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center justify-center space-x-2 p-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print / PDF</span>
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-500 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>
      </div>

      {/* Printable Summary Card */}
      <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl print-card">
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical Handover</p>
            <p className="text-[10px] font-bold text-slate-600">Doc: {docId}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-400">{timestamp}</p>
            <p className="text-[9px] font-bold text-blue-600">Agentic Healthcare AI</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[10px] mb-3">
          <div>
            <p className="text-slate-400 font-bold uppercase">Patient</p>
            <p className="text-slate-700 font-semibold">{patientData.age}y / {patientData.gender}</p>
            <p className="text-slate-500">{patientData.village || 'Village N/A'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase">ASHA Worker</p>
            <p className="text-slate-700 font-semibold">{ashaProfile.name || 'Unknown'}</p>
            <p className="text-slate-500">ID: {ashaProfile.id || 'N/A'} | {ashaProfile.zone || 'Zone N/A'}</p>
          </div>
        </div>

        {/* Risk Bars */}
        {result.ml_predictions && (
          <div className="space-y-1.5 mb-3">
            <RiskBar label="Diabetes" value={result.ml_predictions.diabetes} />
            <RiskBar label="Heart" value={result.ml_predictions.heart} />
            <RiskBar label="Kidney" value={result.ml_predictions.kidney} />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-1">
          {result.actions?.slice(0, 3).map((a, i) => (
            <div key={i} className="flex items-start space-x-2 text-[10px] text-slate-600">
              <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Follow-up Scheduler ────────────────────────────────────────────────────────
function FollowUpScheduler({ urgency, patientData, ashaProfile }) {
  const [date, setDate] = useState('')
  const [saved, setSaved] = useState(false)

  if (urgency === 'RED') return null // Emergency — no scheduled follow-up

  const handleSave = () => {
    if (!date) return
    const followUps = loadFollowUps()
    followUps.push({
      id: Date.now(),
      date,
      patient: `${patientData.age}y ${patientData.gender}, ${patientData.village || 'Unknown'}`,
      urgency,
      ashaId: ashaProfile.id || 'N/A',
      createdAt: new Date().toISOString()
    })
    saveFollowUps(followUps)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
      <div className="flex items-center space-x-2">
        <Calendar className="w-4 h-4 text-indigo-600" />
        <span className="text-xs font-black text-indigo-700 uppercase tracking-wide">Schedule Follow-Up</span>
      </div>
      <div className="flex space-x-2">
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => setDate(e.target.value)}
          className="flex-1 text-xs px-3 py-2 border border-indigo-200 rounded-lg bg-white focus:border-indigo-400 outline-none font-semibold"
        />
        <button
          onClick={handleSave}
          disabled={!date}
          className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
            saved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50'
          }`}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
      {saved && <p className="text-[10px] text-emerald-600 font-bold">✅ Follow-up saved to your schedule.</p>}
    </div>
  )
}

// ── ASHA Worker Identity Panel ────────────────────────────────────────────────
function AshaWorkerPanel({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)

  const handleSave = () => {
    saveASHAProfile(draft)
    onUpdate(draft)
    setEditing(false)
  }

  const isVerified = !!(profile.name && profile.id)

  return (
    <div className="main-card p-6 mb-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black text-slate-800">
                {profile.name || 'ASHA Worker Profile'}
              </span>
              {isVerified && (
                <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-2.5 h-2.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">
              {profile.id ? `ID: ${profile.id}` : 'No ID set'} {profile.zone ? `· ${profile.zone}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setDraft(profile); setEditing(!editing) }}
          className="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-wider transition-colors"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {editing && (
        <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase">Your Name</label>
              <input
                type="text"
                value={draft.name || ''}
                placeholder="e.g. Sunita Devi"
                onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-blue-400 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase">ASHA ID</label>
              <input
                type="text"
                value={draft.id || ''}
                placeholder="e.g. MH-2024-1234"
                onChange={e => setDraft(p => ({ ...p, id: e.target.value }))}
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-blue-400 outline-none font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase">Zone / PHC Name</label>
            <input
              type="text"
              value={draft.zone || ''}
              placeholder="e.g. PHC Nagpur Rural Block A"
              onChange={e => setDraft(p => ({ ...p, zone: e.target.value }))}
              className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-blue-400 outline-none font-semibold"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-2 bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-blue-500 transition-all"
          >
            Save Profile
          </button>
        </div>
      )}
    </div>
  )
}


// ── Main AshaMode Component ─────────────────────────────────────────────────────
function AshaMode({ language = 'en', selectedPatient = null, onSelectedPatient = null, onNavigate = () => {} }) {
  const globalT = getT(language)
  const [ashaProfile, setAshaProfile] = useState(loadASHAProfile)

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
  const [loadingStep, setLoadingStep] = useState('')
  const [audioLoading, setAudioLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioInstance, setAudioInstance] = useState(null)
  const [error, setError] = useState(null)
  const [showConsensus, setShowConsensus] = useState(false)
  const [consensusData, setConsensusData] = useState(null)
  const [consensusLoading, setConsensusLoading] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem('asha_autospeak') === 'true')
  const [activeTab, setActiveTab] = useState('triage') // 'triage' | 'handover' | 'followup'

  useEffect(() => {
    return () => { if (audioInstance) audioInstance.pause() }
  }, [audioInstance])

  useEffect(() => {
    if (selectedPatient) {
      setPatientData(prev => ({ ...prev, ...selectedPatient }))
    }
  }, [selectedPatient])
  const handleSymptomChange = (symptom) => {
    setSymptoms(prev => ({ ...prev, [symptom]: !prev[symptom] }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const newValue = (name === 'village' || name === 'gender') ? value : parseFloat(value) || 0;
    setPatientData(prev => {
      const updated = { ...prev, [name]: newValue };
      if (onSelectedPatient) onSelectedPatient(updated);
      return updated;
    });
  }

  const handleToggle = (name) => {
    setPatientData(prev => {
      const updated = { ...prev, [name]: prev[name] === 1 ? 0 : 1 };
      if (onSelectedPatient) onSelectedPatient(updated);
      return updated;
    });
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      // PHASE 1: ML Risk Prediction
      setLoadingStep('🧠 Running ML Risk Models...')
      let mlRisks = { diabetes: 0.1, heart: 0.1, kidney: 0.1 }
      try {
        const mlResponse = await axios.post(`${API_URL}/api/predict/all`, patientData)
        if (mlResponse.data.success) mlRisks = mlResponse.data.predictions
      } catch (mlErr) { console.warn('ML Triage Fetch Failed:', mlErr) }

      // PHASE 2: Emergency Triage Logic (Red / Yellow / Green)
      setLoadingStep('⚡ Calculating Emergency Triage Level...')
      const maxRisk = Math.max(...Object.values(mlRisks))
      const critical = symptoms.chest_pain || symptoms.unconscious || symptoms.bleeding || symptoms.breathing
      const moderate = symptoms.fever || symptoms.vomiting || symptoms.diarrhea || symptoms.high_fever

      let urgency = 'GREEN'
      let actions = []
      let timeframe = 'Standard'

      if (critical || maxRisk > 0.7) {
        urgency = 'RED'
        timeframe = '0–2 hours'
        actions = [
          `🚨 Immediate PHC Transfer Required`,
          `📞 Call 108 Emergency Ambulance Now`,
          `👨‍⚕️ Alert local Medical Officer immediately`,
          `📋 Carry all available patient records`
        ]
      } else if (moderate || maxRisk > 0.4) {
        urgency = 'YELLOW'
        timeframe = '24–48 hours'
        actions = [
          `🏥 Schedule PHC appointment today`,
          `💊 Administer symptomatic relief from kit`,
          `📈 Monitor vitals every 4 hours`,
          `📝 Document all symptoms and readings`
        ]
      } else {
        urgency = 'GREEN'
        timeframe = '1–2 weeks'
        actions = [
          `🏠 Home care is sufficient`,
          `📚 Counsel on healthy diet & exercise`,
          `📅 Schedule routine follow-up in 2 weeks`,
          `💊 Maintain current lifestyle improvements`
        ]
      }

      // PHASE 3: AI Diagnostic Insight
      setLoadingStep('🤖 Generating AI Clinical Insight...')
      const aiResponse = await aiService.analyzeASHACase(
        { ...patientData, predictions: mlRisks },
        symptoms,
        language
      )

      const analysisResult = {
        success: true,
        urgency,
        urgency_text: `${urgency} — ${timeframe}`,
        actions,
        ai_insights: aiResponse.response,
        ml_predictions: mlRisks,
        agent_status: aiResponse.agent_status
      }

      setResult(analysisResult)

      // Auto-speak if enabled
      if (autoSpeak && aiResponse.response) {
        setLoadingStep('🔊 Preparing voice output...')
        await triggerTTS(aiResponse.response)
      }

    } catch (error) {
      console.error('ASHA Analysis error:', error)
      setError(language === 'hi' ? 'विश्लेषण में त्रुटि हुई। कृपया पुनः प्रयास करें।' : 'Analysis error. Please try again.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const triggerTTS = async (text) => {
    try {
      const cleanText = text.replace(/[#*]/g, '').substring(0, 5000)
      const fdData = new FormData()
      fdData.append('text', cleanText)
      fdData.append('language', language)
      const response = await axios.post(`${API_URL}/api/voice/synthesize`, fdData, { responseType: 'blob' })
      const audioUrl = URL.createObjectURL(new Blob([response.data], { type: 'audio/mpeg' }))
      const audio = new Audio(audioUrl)
      setAudioInstance(audio)
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
      audio.onpause = () => setIsPlaying(false)
      audio.play()
    } catch (err) { console.error('TTS error:', err) }
  }

  const handlePlayAudio = async () => {
    if (!result || !result.ai_insights) return
    if (isPlaying && audioInstance) { audioInstance.pause(); setIsPlaying(false); return }
    setAudioLoading(true)
    try {
      await triggerTTS(result.ai_insights)
    } finally {
      setAudioLoading(false)
    }
  }

  const handleActivateConsensus = async () => {
    if (!result) return
    setConsensusLoading(true)
    setError(null)
    try {
      const langName = languageMap[language] || 'english'
      const response = await axios.post(`${API_URL}/api/asha/consensus`, {
        patient: { ...patientData, language: langName },
        symptoms
      })
      if (response.data.success) { setConsensusData(response.data); setShowConsensus(true) }
      else throw new Error(response.data.error || 'Consensus failed')
    } catch (error) {
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
      analyze: 'Run AI Triage Analysis', urgency: 'Triage Priority', actions: 'Recommended Actions', callScript: 'Case Summary', insights: 'AI Clinical Reasoning'
    },
    hi: {
      title: 'ASHA स्मार्ट हेल्थ इंटेलिजेंस', subtitle: 'ग्रामीण स्वास्थ्य तriage और AI सहायता',
      symptoms: 'रोगी के लक्षण', patientInfo: 'रोगी की जानकारी', age: 'उम्र', gender: 'लिंग', village: 'क्षेत्र / गाँव',
      labValues: 'नैदानिक मेट्रिक्स', glucose: 'ग्लूकोज', hba1c: 'HbA1c', bp: 'रक्तचाप', cholesterol: 'कोलेस्ट्रॉल', bmi: 'बीएमआई', creatinine: 'क्रिएटिनिन',
      lifestyle: 'जोखिम कारक', smoking: 'धूम्रपान', familyDiabetes: 'परिवार: मधुमेह', familyHeart: 'परिवार: हृदय रोग',
      analyze: 'AI ट्रायज विश्लेषण चलाएं', urgency: 'तात्कालिकता स्तर', actions: 'अनुशंसित कार्रवाई', callScript: 'केस सारांश', insights: 'AI नैदानिक विश्लेषण'
    },
    bn: { title: 'আশা স্বাস্থ্য সমন্বয়কারী', subtitle: 'মাঠ পর্যায়ের ট্রায়েজ', symptoms: 'রোগীর লক্ষণ', patientInfo: 'রোগীর প্রোফাইল', age: 'বয়স', gender: 'লিঙ্গ', village: 'গ্রাম', labValues: 'ক্লিনিক্যাল মেট্রিক্স', glucose: 'গ্লুকোজ', hba1c: 'HbA1c', bp: 'রক্তচাপ', cholesterol: 'কোলেস্টেরল', bmi: 'BMI', creatinine: 'ক্রিয়েটিনিন', lifestyle: 'ঝুঁকির কারণ', smoking: 'ধূমপান', familyDiabetes: 'বংশগত: ডায়াবেটিস', familyHeart: 'বংশগত: হৃদরোগ', analyze: 'AI বিশ্লেষণ', urgency: 'অগ্রাধিকার', actions: 'পরামর্শ', callScript: 'সারাংশ', insights: 'AI বিশ্লেষণ' },
    ta: { title: 'ஆஷா சுகாதார ஒருங்கிணைப்பாளர்', subtitle: 'களச் செயல்பாடு மற்றும் மதிப்பீடு', symptoms: 'அறிகுறிகள்', patientInfo: 'நோயாளி விவரங்கள்', age: 'வயது', gender: 'பாலினம்', village: 'கிராமம்', labValues: 'மருத்துவ அளவீடுகள்', glucose: 'குளுக்கோஸ்', hba1c: 'HbA1c', bp: 'இரத்த அழுத்தம்', cholesterol: 'கொலஸ்ட்ரால்', bmi: 'BMI', creatinine: 'கிரியேட்டினின்', lifestyle: 'ஆபத்து காரணிகள்', smoking: 'புகைப்பிடித்தல்', familyDiabetes: 'மரபணு: நீரிழிவு', familyHeart: 'மரபணு: இதயம்', analyze: 'பகுப்பாய்வு', urgency: 'முன்னுரிமை', actions: 'செயல்கள்', callScript: 'சுருக்கம்', insights: 'AI பகுப்பாய்வு' },
    te: { title: 'ఆశా ఆరోగ్య సమన్వయకర్త', subtitle: 'క్షేత్ర స్థాయి ట్రయాజ్', symptoms: 'రోగి లక్షణాలు', patientInfo: 'రోగి ప్రొఫైల్', age: 'వయసు', gender: 'లింగం', village: 'గ్రామం', labValues: 'క్లినికల్ కొలమానాలు', glucose: 'గ్లూకోజ్', hba1c: 'HbA1c', bp: 'రక్తపోటు', cholesterol: 'కొలెస్ట్రాల్', bmi: 'BMI', creatinine: 'క్రియాటినిన్', lifestyle: 'ప్రమాద కారకాలు', smoking: 'ధూమపానం', familyDiabetes: 'కుటుంబం: మధుమేహం', familyHeart: 'కుటుంబం: గుండె', analyze: 'విశ్లేషించండి', urgency: 'ప్రాధాన్యత', actions: 'చర్యలు', callScript: 'సారాంశం', insights: 'AI విశ్లేషణ' },
    mr: { title: 'आशा आरोग्य समन्वयक', subtitle: 'फील्ड ऑपरेशन्स आणि मूल्यांकन', symptoms: 'रुग्णाची लक्षणे', patientInfo: 'रुग्ण प्रोफाइल', age: 'वय', gender: 'लिंग', village: 'गाव', labValues: 'क्लीनिकल मेट्रिक्स', glucose: 'ग्लुकोज', hba1c: 'HbA1c', bp: 'रक्तदाब', cholesterol: 'कोलेस्ट्रॉल', bmi: 'BMI', creatinine: 'क्रिएटिनिन', lifestyle: 'धोका घटक', smoking: 'धूम्रपान', familyDiabetes: 'अनुवांशिक: मधुमेह', familyHeart: 'अनुवांशिक: हृदयविकार', analyze: 'विश्लेषण करा', urgency: 'प्राधान्य', actions: 'कृती', callScript: 'सारांश', insights: 'AI विश्लेषण' },
    gu: { title: 'આશા સ્વાસ્થ્ય સંયોજક', subtitle: 'ક્ષેત્ર કામગીરી અને ટ્રાયેજ', symptoms: 'દર્દીના લક્ષણો', patientInfo: 'દર્દીની પ્રોફાઇલ', age: 'ઉંમર', gender: 'લિંગ', village: 'ગામ', labValues: 'ક્લિનિકલ મેટ્રિક્સ', glucose: 'ગ્લુકોઝ', hba1c: 'HbA1c', bp: 'બ્લડ પ્રેશર', cholesterol: 'કોલેસ્ટ્રોલ', bmi: 'BMI', creatinine: 'ક્રિએટિનાઇન', lifestyle: 'જોખમ ના પરિબળો', smoking: 'ધૂમ્રપાન', familyDiabetes: 'પરિવાર: ડાયાબિટીસ', familyHeart: 'પરિવાર: હૃદય', analyze: 'વિશ્લેષણ કરો', urgency: 'પ્રાધાન્યતા', actions: 'પગલાં', callScript: 'સારાંશ', insights: 'AI વિશ્લેષણ' },
    kn: { title: 'ಆಶಾ ಆರೋಗ್ಯ ಸಂಯೋಜಕರು', subtitle: 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಾಚರಣೆ ಮತ್ತು ಟ್ರೈಯಾಜ್', symptoms: 'ರೋಗಿಯ ಲಕ್ಷಣಗಳು', patientInfo: 'ರೋಗಿಯ ಪ್ರೊಫೈಲ್', age: 'ವಯಸ್ಸು', gender: 'ಲಿಂಗ', village: 'ಹಳ್ಳಿ', labValues: 'ಕ್ಲಿನಿಕಲ್ ಮೆಟ್ರಿಕ್ಸ್', glucose: 'ಗ್ಲೂಕೋಸ್', hba1c: 'HbA1c', bp: 'ರಕ್ತದೊತ್ತಡ', cholesterol: 'ಕೊಲೆಸ್ಟ್ರಾಲ್', bmi: 'BMI', creatinine: 'ಕ್ರಿಯಾಟಿನಿನ್', lifestyle: 'ಅಪಾಯ ಘಟಕಗಳು', smoking: 'ಧೂಮಪಾನ', familyDiabetes: 'ಕುಟುಂಬ: ಮಧುಮೇಹ', familyHeart: 'ಕುಟುಂಬ: ಹೃದಯ', analyze: 'ವಿಶ್ಲೇಷಿಸಿ', urgency: 'ಆದ್ಯತೆ', actions: 'ಕ್ರಮಗಳು', callScript: 'ಸಾರಾಂಶ', insights: 'AI ವಿಶ್ಲೇಷಣೆ' },
    ml: { title: 'ആശാ ആരോഗ്യ കോർഡിനേറ്റർ', subtitle: 'ഫീൽഡ് ട്രൈയാജ്', symptoms: 'ലക്ഷണങ്ങൾ', patientInfo: 'രോഗിയുടെ പ്രൊഫൈൽ', age: 'പ്രായം', gender: 'ലിംഗം', village: 'ഗ്രാമം', labValues: 'ക്ലിനിക്കൽ', glucose: 'ഗ്ലൂക്കോസ്', hba1c: 'HbA1c', bp: 'രക്തസമ്മർദ്ദം', cholesterol: 'കൊളസ്ട്രോൾ', bmi: 'BMI', creatinine: 'ക്രിയാറ്റിനിൻ', lifestyle: 'ഘടകങ്ങൾ', smoking: 'പുകവലി', familyDiabetes: 'കുടുംബം: പ്രമേഹം', familyHeart: 'കുടുംബം: ഹൃദയം', analyze: 'വിശകലനം', urgency: 'മുൻഗണന', actions: 'പ്രവർത്തനങ്ങൾ', callScript: 'സംഗ്രഹം', insights: 'AI വിശകലനം' },
    pa: { title: 'ਆਸ਼ਾ ਸਿਹਤ ਕੋਆਰਡੀਨੇਟਰ', subtitle: 'ਫੀਲਡ ਟ੍ਰਾਇਆਜ਼', symptoms: 'ਲੱਛਣ', patientInfo: 'ਮਰੀਜ਼ ਦੀ ਜਾਣਕਾਰੀ', age: 'ਉਮਰ', gender: 'ਲਿੰਗ', village: 'ਪਿੰਡ', labValues: 'ਕਲੀਨਿਕਲ', glucose: 'ਗਲੂਕੋਜ਼', hba1c: 'HbA1c', bp: 'ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ', cholesterol: 'ਕੋਲੈਸਟ੍ਰੋਲ', bmi: 'BMI', creatinine: 'ਕ੍ਰੀਏਟਿਨਾਈਨ', lifestyle: 'ਜੋਖਮ', smoking: 'ਸਿਗਰਟਨੋਸ਼ੀ', familyDiabetes: 'ਪਰਿਵਾਰ: ਸ਼ੂਗਰ', familyHeart: 'ਪਰਿਵਾਰ: ਦਿਲ', analyze: 'ਵਿਸ਼ਲੇਸ਼ਣ', urgency: 'ਤਰਜੀਹ', actions: 'ਕੰਮ', callScript: 'ਸੰਖੇਪ', insights: 'AI ਵਿਸ਼ਲੇਸ਼ਣ' }
  }

  const t = labels[language] || labels.en

  const symptomList = [
    { key: 'fever',      label: { en: 'Fever',       hi: 'बुखार',         bn: 'জ্বর',           ta: 'காய்ச்சல்',     te: 'జ్వరం',      mr: 'ताप',        gu: 'તાવ',        kn: 'ಜ್ವರ',       ml: 'പനി',           pa: 'ਬੁਖਾਰ' }, icon: '🌡️' },
    { key: 'cough',      label: { en: 'Cough',       hi: 'खांसी',         bn: 'কাশি',           ta: 'இருமல்',       te: 'దగ్గు',      mr: 'खोकला',      gu: 'ઉધરસ',       kn: 'ಕೆಮ್ಮು',     ml: 'ചുമ',           pa: 'ਖੰਘ' }, icon: '😷' },
    { key: 'breathing',  label: { en: 'Dyspnea',     hi: 'सांस में दिक्कत', bn: 'শ্বাসকষ্ট',    ta: 'மூச்சுத்திணறல்', te: 'శ్వాస ఇబ్బంది', mr: 'श्वास त्रास', gu: 'શ્વાસ તતકલીફ', kn: 'ಉಸಿರಾಟ ತೊಂದರೆ', ml: 'ശ്വാസതടസ്സം', pa: 'ਸਾਹ ਤਕਲੀਫ' }, icon: '🫁' },
    { key: 'chest_pain', label: { en: 'Chest Pain',  hi: 'सीने में दर्द',  bn: 'বুকে ব্যথা',    ta: 'நெஞ்சு வலி',   te: 'ఛాతీ నొప్పి', mr: 'छातीत दुखणे', gu: 'છાતીમાં દુ:ખ', kn: 'ಎದೆ ನೋವು',   ml: 'നെഞ്ചുവേദന',  pa: 'ਛਾਤੀ ਦਰਦ' }, icon: '💔' },
    { key: 'vomiting',   label: { en: 'Vomiting',    hi: 'उल्टी',          bn: 'বমি',            ta: 'வாந்தி',       te: 'వాంతులు',    mr: 'उलट्या',     gu: 'ઉલટી',       kn: 'ವಾಂತಿ',      ml: 'ഛർദ്ദി',       pa: 'ਉਲਟੀ' }, icon: '🤮' },
    { key: 'diarrhea',   label: { en: 'Diarrhea',    hi: 'दस्त',           bn: 'ডায়রিয়া',       ta: 'வயிற்றுப்போக்கு', te: 'విరేచనాలు', mr: 'अतिसार',     gu: 'ઝાડા',       kn: 'ಅತಿಸಾರ',     ml: 'അതിസാരം',     pa: 'ਦਸਤ' }, icon: '💩' },
    { key: 'weakness',   label: { en: 'Fatigue',     hi: 'कमजोरी',         bn: 'ক্লান্তি',       ta: 'சோர்வு',       te: 'అలసట',       mr: 'थकवा',       gu: 'થાક',        kn: 'ಆಯಾಸ',       ml: 'ക്ഷീണം',       pa: 'ਥਕਾਵਟ' }, icon: '😴' },
    { key: 'unconscious',label: { en: 'Unconscious', hi: 'बेहोशी',         bn: 'অজ্ঞান',         ta: 'மயக்கம்',      te: 'అపస్మారకం',  mr: 'बेशुद्ध',    gu: 'બેભાન',      kn: 'ಪ್ರಜ್ಞಾಹೀನ', ml: 'ബോധക്ഷയം',    pa: 'ਬੇਹੋਸ਼' }, icon: '😵' },
    { key: 'bleeding',   label: { en: 'Bleeding',    hi: 'रक्तस्राव',       bn: 'রক্তপাত',        ta: 'இரத்தப்போக்கு', te: 'రక్తస్రావం', mr: 'रक्तस्त्राव', gu: 'રક્તસ્ત્રાવ', kn: 'ರಕ್ತಸ್ರಾವ',  ml: 'രക്തസ്രാവം',  pa: 'ਖੂਨ ਵਗਣਾ' }, icon: '🩸' },
    { key: 'high_fever', label: { en: 'Severe Fever',hi: 'तेज बुखार',      bn: 'তীব্র জ্বর',     ta: 'கடும் காய்ச்சல்', te: 'తీవ్ర జ్వరం', mr: 'तीव्र ताप',  gu: 'ભારે તાવ',   kn: 'ತೀವ್ರ ಜ್ವರ', ml: 'കടുത്ത പനി',  pa: 'ਤੇਜ਼ ਬੁਖਾਰ' }, icon: '🔥' },
    { key: 'swelling',   label: { en: 'Swelling',    hi: 'सूजन',           bn: 'ফোলা',           ta: 'வீக்கம்',      te: 'వాపు',       mr: 'सूज',        gu: 'સોજો',       kn: 'ಊತ',         ml: 'വീക്കം',       pa: 'ਸੋਜ' }, icon: '🦵' },
    { key: 'back_pain',  label: { en: 'Back Pain',   hi: 'पीठ दर्द',       bn: 'পিঠে ব্যথা',     ta: 'முதுகு வலி',   te: 'వెన్నునొప్పి', mr: 'पाठदुखी',  gu: 'પીઠ દુ:ખ',  kn: 'ಬೆನ್ನು ನೋವು', ml: 'നടുവേദന',     pa: 'ਪਿੱਠ ਦਰਦ' }, icon: '🔙' }
  ]

  const getUrgencyConfig = (urgency) => {
    if (urgency === 'RED') return {
      bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700',
      badge: 'bg-rose-500', icon: '🚨', ring: 'ring-rose-300',
      call108: true
    }
    if (urgency === 'YELLOW') return {
      bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700',
      badge: 'bg-amber-500', icon: '⚠️', ring: 'ring-amber-300',
      call108: false
    }
    return {
      bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700',
      badge: 'bg-emerald-500', icon: '✅', ring: 'ring-emerald-300',
      call108: false
    }
  }

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .printable-card { break-inside: avoid; }
          body * { visibility: hidden; }
          .print-card, .print-card * { visibility: visible; }
          .print-card { position: fixed; top: 20px; left: 20px; right: 20px; font-size: 12px; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6 animate-in pb-10">
        {showConsensus && consensusData ? (
          <AgenticConsensus data={consensusData} onBack={() => setShowConsensus(false)} onNavigate={onNavigate} />
        ) : (
          <>
            {/* ASHA Worker Identity Panel */}
            <AshaWorkerPanel profile={ashaProfile} onUpdate={setAshaProfile} />

            {/* Header */}
            <div className="main-card p-8 flex flex-col md:flex-row items-center justify-between group no-print">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full mb-1">
                    <Globe className="w-3 h-3 text-blue-600" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Community Network · {language.toUpperCase()}</span>
                  </div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-0.5">{t.title}</h2>
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">{t.subtitle}</p>
                </div>
              </div>
              {/* Auto-Speak Toggle */}
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Auto-Read Result</span>
                <button
                  onClick={() => {
                    const val = !autoSpeak
                    setAutoSpeak(val)
                    localStorage.setItem('asha_autospeak', String(val))
                  }}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${autoSpeak ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${autoSpeak ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* ── Input Columns ── */}
              <div className="lg:col-span-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">

                  {/* Symptoms Panel */}
                  <div className="main-card p-6">
                    <div className="flex items-center space-x-3 mb-5">
                      <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                      <h3 className="text-base font-black text-[var(--text-primary)]">{t.symptoms}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {symptomList.map(symptom => (
                        <button
                          key={symptom.key}
                          onClick={() => handleSymptomChange(symptom.key)}
                          className={`flex items-center space-x-2 p-2.5 rounded-xl border transition-all duration-200 min-h-[44px] ${
                            symptoms[symptom.key]
                              ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-base">{symptom.icon}</span>
                          <span className="text-[11px] font-semibold leading-tight">{symptom.label[language] || symptom.label.en}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patient Profile + Analyze */}
                  <div className="flex flex-col space-y-4">
                    <div className="main-card p-6 flex-grow">
                      <div className="flex items-center space-x-3 mb-5">
                        <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                        <h3 className="text-base font-black text-[var(--text-primary)]">{t.patientInfo}</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase">{t.age}</label>
                            <input type="number" name="age" value={patientData.age} onChange={handleInputChange}
                              className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-sm transition-all min-h-[44px]" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase">{t.gender}</label>
                            <select name="gender" value={patientData.gender} onChange={handleInputChange}
                              className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-sm transition-all min-h-[44px]">
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase">{t.village}</label>
                          <div className="relative mt-1">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" name="village" value={patientData.village} onChange={handleInputChange}
                              className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold text-sm transition-all min-h-[44px]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analyze Button */}
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full btn-primary py-4 flex items-center justify-center space-x-3 text-base font-black min-h-[56px] disabled:opacity-70"
                      aria-label="Run AI triage analysis"
                    >
                      {loading ? (
                        <div className="flex flex-col items-center space-y-1">
                          <div className="flex items-center space-x-2">
                            <Activity className="w-5 h-5 animate-spin" />
                            <span className="text-sm">{loadingStep || 'Analyzing...'}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Brain className="w-5 h-5" />
                          <span>{t.analyze}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Clinical Metrics */}
                <div className="main-card p-6 grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                      <h3 className="text-base font-black text-[var(--text-primary)]">{t.labValues}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'glucose',     label: t.glucose,     icon: <Droplets className="w-3.5 h-3.5 text-blue-400" /> },
                        { name: 'hba1c',       label: t.hba1c,       icon: <Zap className="w-3.5 h-3.5 text-purple-400" />,  step: '0.1' },
                        { name: 'bp',          label: t.bp,          icon: <Gauge className="w-3.5 h-3.5 text-red-400" /> },
                        { name: 'bmi',         label: t.bmi,         icon: <Activity className="w-3.5 h-3.5 text-green-400" />, step: '0.1' },
                        { name: 'creatinine',  label: t.creatinine,  icon: <Activity className="w-3.5 h-3.5 text-amber-400" />, step: '0.1' },
                        { name: 'cholesterol', label: t.cholesterol, icon: <Heart className="w-3.5 h-3.5 text-rose-400" /> },
                      ].map(field => (
                        <div key={field.name}>
                          <label className="text-[9px] font-black text-slate-400 uppercase">{field.label}</label>
                          <div className="relative mt-1">
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2">{field.icon}</div>
                            <input
                              type="number" name={field.name} step={field.step || '1'} value={patientData[field.name]} onChange={handleInputChange}
                              className="w-full pl-8 pr-2 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 transition-all font-semibold outline-none text-xs min-h-[40px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-5 bg-rose-400 rounded-full" />
                      <h3 className="text-base font-black text-[var(--text-primary)]">{t.lifestyle}</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'smoking',                label: t.smoking,       icon: <Zap className="w-4 h-4" /> },
                        { name: 'family_history_diabetes',label: t.familyDiabetes,icon: <Activity className="w-4 h-4" /> },
                        { name: 'family_history_heart',   label: t.familyHeart,  icon: <Heart className="w-4 h-4" /> }
                      ].map(field => (
                        <button
                          key={field.name}
                          onClick={() => handleToggle(field.name)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all min-h-[50px] ${
                            patientData[field.name]
                              ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {field.icon}
                            <span className="font-semibold text-xs">{field.label}</span>
                          </div>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${patientData[field.name] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${patientData[field.name] ? 'left-[22px]' : 'left-0.5'}`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Results Column ── */}
              <div className="lg:col-span-4 flex flex-col space-y-4" aria-live="polite">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 flex items-center space-x-3 rounded-xl" role="alert">
                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span className="font-bold text-xs text-rose-600">{error}</span>
                  </div>
                )}

                <div className="main-card p-6 sticky top-6 flex flex-col space-y-4">
                  {/* Result Tabs */}
                  {result && (
                    <div className="flex space-x-1 bg-slate-100 rounded-xl p-1">
                      {['triage', 'handover', 'followup'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                            activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'triage' ? 'Triage' : tab === 'handover' ? 'Handover' : 'Follow-Up'}
                        </button>
                      ))}
                    </div>
                  )}

                  {!result ? (
                    <div className="flex flex-col items-center justify-center text-center space-y-5 min-h-[400px]">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-10 h-10 text-blue-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-700">Ready for Assessment</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-[180px] mx-auto leading-relaxed">Select symptoms and fill patient data, then click Analyze.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* ── TAB: TRIAGE ── */}
                      {activeTab === 'triage' && (() => {
                        const cfg = getUrgencyConfig(result.urgency)
                        return (
                          <div className="space-y-4">
                            {/* Urgency Card */}
                            <div className={`p-5 rounded-2xl border-2 ${cfg.bg} ${cfg.border}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Triage Priority</p>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl">{cfg.icon}</span>
                                    <h4 className={`text-2xl font-black ${cfg.text}`}>{result.urgency}</h4>
                                  </div>
                                  <p className={`text-xs font-bold mt-1 ${cfg.text} opacity-80`}>{result.urgency_text}</p>
                                </div>
                                <button
                                  onClick={handlePlayAudio}
                                  disabled={audioLoading}
                                  aria-label="Read result aloud"
                                  className="p-2.5 rounded-xl bg-white/60 hover:bg-white transition-colors shadow-sm"
                                >
                                  {audioLoading ? <Activity className="w-4 h-4 animate-spin text-slate-500" /> : isPlaying ? <Pause className="w-4 h-4 text-blue-600" /> : <Volume2 className="w-4 h-4 text-slate-500" />}
                                </button>
                              </div>
                              <ConfidenceMeter predictions={result.ml_predictions} urgency={result.urgency} />
                            </div>

                            {/* 108 Emergency Call Button — only for RED */}
                            {result.urgency === 'RED' && (
                              <a
                                href="tel:108"
                                className="flex items-center justify-center space-x-3 w-full py-3.5 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-500 transition-all shadow-lg shadow-rose-200 animate-pulse-slow"
                              >
                                <Phone className="w-5 h-5" />
                                <span>📞 CALL 108 EMERGENCY</span>
                              </a>
                            )}

                            {/* Actions */}
                            <div className="space-y-2">
                              <h4 className="text-[9px] font-black text-slate-400 uppercase flex items-center space-x-1">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span>{t.actions}</span>
                              </h4>
                              {result.actions?.map((action, i) => (
                                <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start space-x-3">
                                  <span className="text-xs font-black text-blue-500 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                                  <span className="text-xs font-semibold text-slate-600 leading-snug">{action}</span>
                                </div>
                              ))}
                            </div>

                            {/* ML Risk Bars */}
                            {result.ml_predictions && (
                              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase flex items-center space-x-1">
                                  <TrendingUp className="w-3 h-3" />
                                  <span>ML Risk Scores</span>
                                </h4>
                                <RiskBar label="Diabetes" value={result.ml_predictions.diabetes} />
                                <RiskBar label="Heart" value={result.ml_predictions.heart} />
                                <RiskBar label="Kidney" value={result.ml_predictions.kidney} />
                              </div>
                            )}

                            {/* Consensus Button */}
                            <button
                              onClick={handleActivateConsensus}
                              disabled={consensusLoading}
                              className="w-full btn-primary py-3 text-xs flex items-center justify-between group"
                            >
                              <div className="flex items-center space-x-2">
                                <Cpu className="w-4 h-4" />
                                <span className="font-black">AI Specialist Panel</span>
                              </div>
                              {consensusLoading ? <Activity className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => onNavigate('chat')} className="btn-secondary py-2.5 text-xs text-blue-600 min-h-[44px]">
                                💬 Ask AI
                              </button>
                              <button onClick={() => onNavigate('plan')} className="btn-secondary py-2.5 text-xs min-h-[44px]">
                                📋 Care Plan
                              </button>
                            </div>
                          </div>
                        )
                      })()}

                      {/* ── TAB: HANDOVER ── */}
                      {activeTab === 'handover' && (
                        <HandoverCard
                          result={result}
                          patientData={patientData}
                          ashaProfile={ashaProfile}
                          language={language}
                        />
                      )}

                      {/* ── TAB: FOLLOW-UP ── */}
                      {activeTab === 'followup' && (
                        <div className="space-y-4">
                          <FollowUpScheduler
                            urgency={result.urgency}
                            patientData={patientData}
                            ashaProfile={ashaProfile}
                          />
                          {result.urgency === 'RED' && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                              🚨 Emergency cases require <strong>immediate transfer</strong> to PHC. No follow-up scheduling — call 108 now.
                            </div>
                          )}
                          {/* Upcoming visits */}
                          <UpcomingVisits />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── Upcoming Visits Display ───────────────────────────────────────────────────
function UpcomingVisits() {
  const [visits, setVisits] = useState(loadFollowUps)

  const remove = (id) => {
    const updated = visits.filter(v => v.id !== id)
    setVisits(updated)
    saveFollowUps(updated)
  }

  if (visits.length === 0) return (
    <div className="text-center py-6 text-xs text-slate-400 font-semibold">No upcoming follow-ups scheduled.</div>
  )

  return (
    <div className="space-y-2">
      <h4 className="text-[9px] font-black text-slate-400 uppercase">Scheduled Follow-Ups</h4>
      {visits.slice().sort((a, b) => a.date.localeCompare(b.date)).map(v => (
        <div key={v.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
          <div>
            <p className="text-xs font-black text-slate-700">{v.date}</p>
            <p className="text-[10px] text-slate-400 font-semibold">{v.patient}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
              v.urgency === 'RED' ? 'bg-rose-100 text-rose-600' :
              v.urgency === 'YELLOW' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            }`}>{v.urgency}</span>
            <button onClick={() => remove(v.id)} className="p-1 hover:text-rose-500 text-slate-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AshaMode
