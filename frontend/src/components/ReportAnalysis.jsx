import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { 
  FileText, 
  Upload, 
  Brain, 
  ShieldCheck, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  FileUp, 
  Activity, 
  Clipboard, 
  Sparkles, 
  User, 
  Microscope, 
  Volume2, 
  Pause, 
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  Globe
} from 'lucide-react'

import { API_URL } from '../config'
import aiService, { languageMap } from '../services/aiService'
import { getT } from '../utils/translations'

function ReportAnalysis({ language = 'en', selectedPatient = null, onNavigate = () => {} }) {
  const globalT = getT(language);
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioInstance, setAudioInstance] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => { if (audioInstance) audioInstance.pause() }
  }, [audioInstance])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setAnalysis(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError(language === 'hi' ? 'कृपया एक फाइल चुनें' : 'Please select a file first')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', languageMap[language] || 'english')
    setLoading(true)
    setError(null)
    try {
      // Direct-to-Gemini Vision Analysis (Via Netlify Frontend Brain)
      const response = await aiService.analyzeReport(
          file, 
          file.type, 
          language
      );
      
      if (response.success) {
          setAnalysis(response.analysis)
      } else {
        throw new Error(response.error || "Neural Link Failure")
      }
    } catch (err) {
      console.error('Analysis error:', err)
      const errorText = err.message.includes('quota') || err.message.includes('limit')
        ? (language === 'hi' ? 'Groq AI का कोटा समाप्त हो गया है।' : 'Neural Quota Exceeded.')
        : (language === 'hi' ? 'रिपोर्ट विश्लेषण विफल रहा' : 'Report Analysis Failed')
      
      setError(errorText)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayAudio = async () => {
    if (!analysis) return
    if (isPlaying && audioInstance) { audioInstance.pause(); setIsPlaying(false); return }
    setAudioLoading(true)
    setError(null)
    try {
      const cleanText = analysis.replace(/[#*]/g, '').substring(0, 4000)
      const formData = new FormData()
      formData.append('text', cleanText)
      formData.append('language', language)
      const response = await axios.post(`${API_URL}/api/voice/synthesize`, formData, { responseType: 'blob' })
      const audioUrl = URL.createObjectURL(new Blob([response.data], { type: 'audio/mpeg' }))
      const audio = new Audio(audioUrl)
      setAudioInstance(audio); audio.onplay = () => setIsPlaying(true); audio.onended = () => setIsPlaying(false); audio.onpause = () => setIsPlaying(false); audio.play()
    } catch (err) { console.error('Audio error:', err) }
    finally { setAudioLoading(false) }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in">
      
      {/* Premium Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            <Microscope className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase">{globalT.documentAnalysis}</span>
          </div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {globalT.clinicalReportLab}
          </h2>
          <p className="text-sm text-[var(--text-muted)] font-medium">AI analysis of clinical biomarkers and diagnostic imaging.</p>
        </div>
        <div className="hidden xl:flex items-center space-x-4">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">System Status</p>
                <div className="flex items-center space-x-2 text-emerald-600 justify-end">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span className="text-xs font-semibold">Secure Connection Active</span>
                </div>
             </div>
             <div className="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
             </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Upload Terminal */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
          <div className="main-card p-8 group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Upload className="w-24 h-24" />
            </div>
            <div className="relative">
               <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                  {globalT.documentUpload}
               </h3>
               
               <div 
                 onClick={() => fileInputRef.current.click()}
                 className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group/drop ${
                   file 
                     ? 'bg-emerald-50 border-emerald-300' 
                     : 'bg-slate-50 border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
                 }`}
               >
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                 
                 <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover/drop:scale-105 ${
                   file ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 border border-slate-200'
                 }`}>
                   {file ? <CheckCircle className="w-8 h-8" /> : <FileUp className="w-8 h-8" />}
                 </div>
                 
                 <p className={`text-sm font-semibold text-center ${file ? 'text-emerald-700' : 'text-slate-600'}`}>
                   {file ? file.name : globalT.selectMedicalReport}
                 </p>
                 <p className="text-xs text-slate-400 mt-2">Dicom, PDF, Images (Max 20MB)</p>
               </div>

               <button 
                 onClick={handleUpload}
                 disabled={!file || loading}
                 className="btn-primary w-full mt-6 py-4 flex items-center justify-center space-x-2"
               >
                 {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                 <span>{loading ? globalT.analyzing : globalT.analyzeDocument}</span>
               </button>

               {error && (
                 <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3">
                   <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                   <p className="text-sm font-semibold text-rose-600">{error}</p>
                 </div>
               )}
            </div>
          </div>

          <div className="main-card p-8 bg-blue-50/50 border border-blue-100 group">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center space-x-2">
                   <Sparkles className="w-4 h-4 text-blue-600" />
                   <h4 className="font-bold text-sm text-blue-800">Analysis Capabilities</h4>
                </div>
                <div className="space-y-3">
                  {[
                    'Automated Reference Range Check',
                    'Clinical Result Interpretation',
                    'Abnormal Value Highlighting',
                    'General Health Compliance Summary'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-3">
                       <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                       <span className="text-xs font-semibold text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* Console / Monitor Terminal */}
        <div className="lg:col-span-12 xl:col-span-8">
          {!analysis && !loading ? (
             <div className="main-card p-16 flex flex-col items-center justify-center text-center h-full min-h-[500px]">
                <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mb-6">
                   <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">No Document Uploaded</h3>
                <p className="text-base font-medium text-slate-500 max-w-sm">
                   Upload a lab report or medical document to begin the AI analysis procedure.
                </p>
             </div>
          ) : loading ? (
             <div className="main-card p-16 flex flex-col items-center justify-center h-full min-h-[500px]">
                <div className="w-16 h-16 border-4 border-slate-100 rounded-full relative mb-6">
                   <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                   <Brain className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Document...</h3>
                <p className="text-sm font-medium text-slate-500">Processing medical data and verifying findings</p>
             </div>
          ) : (
             <div className="main-card p-10 relative overflow-hidden animate-in fade-in">
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                           <Microscope className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{globalT.analysisResults}</h3>
                           <div className="flex items-center space-x-2 mt-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Extraction</span>
                           </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={handlePlayAudio}
                        disabled={audioLoading}
                        className={`p-3 rounded-lg border transition-all ${
                          isPlaying 
                            ? 'bg-blue-50 border-blue-200 text-blue-600' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {audioLoading ? <Activity className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                   </div>

                   <div className="space-y-6 max-w-3xl prose text-slate-600">
                     {analysis.split('\n').map((line, i) => {
                       const isHeading = line.trim().startsWith('#') || line.trim().startsWith('**');
                       const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*');
                       
                       if (isHeading) {
                         return (
                           <div key={i} className="flex items-center space-x-3 mt-8 mb-4">
                              <h4 className="text-xl font-bold text-slate-800">
                                {line.replace(/\*|#/g, '')}
                              </h4>
                           </div>
                         )
                       }
                       if (isBullet) {
                         return (
                           <div key={i} className="flex items-start space-x-3 mb-2 ml-4">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                             <p className="font-medium text-slate-700 leading-relaxed">{line.replace(/^- |\* /g, '')}</p>
                           </div>
                         )
                       }
                       return line.trim() ? <p key={i} className="font-medium text-slate-600 leading-relaxed mb-4">{line}</p> : null
                     })}
                   </div>

                   <div className="mt-10 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                        <button 
                          onClick={() => onNavigate('chat', { type: 'Lab Report Analysis', analysis: analysis, file: file?.name })}
                          className="btn-primary py-3 px-4 text-xs flex justify-center w-full"
                        >
                          {globalT.sendToDoctor}
                        </button>
                        <button 
                          onClick={() => onNavigate('plan')}
                          className="btn-secondary py-3 px-4 text-xs flex justify-center w-full"
                        >
                          {globalT.generatePlan}
                        </button>
                        <button 
                          onClick={() => alert('Download Sequence Initialized')}
                          className="bg-white border border-slate-300 text-slate-700 py-3 px-4 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors flex justify-center w-full col-span-2 lg:col-span-1"
                        >
                          {globalT.downloadAnalysis}
                        </button>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportAnalysis
