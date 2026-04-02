import { useState, useEffect, Fragment } from 'react'
import axios from 'axios'
import { Users, Search, Filter, Plus, MoreVertical, Activity, Heart, ShieldCheck, ChevronRight, User, Calendar, Clock, ArrowLeft, History, Microscope, Clipboard, UserCircle } from 'lucide-react'

import { API_URL } from '../config'

function PatientRegistry({ language = 'en', selectedPatient = null, onSelectPatient, onNavigate = () => {} }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all') // all, critical, monitoring, optimal
  const [page, setPage] = useState(0)
  const [itemsPerPage] = useState(25)
  const [groupedPatients, setGroupedPatients] = useState(null)
  const [totalDbCount, setTotalDbCount] = useState(0)
  const [partitionCounts, setPartitionCounts] = useState({ critical: 0, monitoring: 0, optimal: 0 })
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [patientDetail, setPatientDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [search, activeTab, page])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const skip = page * itemsPerPage
      let url = `${API_URL}/api/patients?search=${search}&skip=${skip}`
      
      if (activeTab === 'all') {
        url += `&grouped=true&limit=${itemsPerPage * 3}`
      } else {
        url = `${API_URL}/api/patients/partition/${activeTab}?skip=${skip}&limit=${itemsPerPage}`
      }
      
      const response = await axios.get(url)
      if (response.data && response.data.success) {
         setTotalDbCount(response.data.total_db_count || 0)
         if (response.data.partition_counts) {
           setPartitionCounts(response.data.partition_counts)
         }
         
         if (activeTab === 'all') {
           setGroupedPatients(response.data.groups)
           setPatients([]) // empty individual patients
         } else {
           setPatients(response.data.patients)
           setGroupedPatients(null)
         }
      } else {
        setPatients([])
        setGroupedPatients(null)
      }
    } catch (error) {
      console.error("Fetch patients error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetail = async (id) => {
    try {
      setLoadingDetail(true)
      setSelectedPatientId(id)
      const response = await axios.get(`${API_URL}/api/patients/${id}`)
      setPatientDetail(response.data)
      if (onSelectPatient && response.data.patient) {
        onSelectPatient(response.data.patient)
      }
    } catch (error) {
      console.error("Fetch detail error:", error)
    } finally {
      setLoadingDetail(false)
    }
  }

  if (selectedPatientId && patientDetail) {
    const p = patientDetail.patient
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
        <button 
          onClick={() => {setSelectedPatientId(null); setPatientDetail(null);}}
          className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 font-semibold text-sm transition-colors group mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Patient Registry</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Patient Bio-Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
               <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full bg-blue-50 border-4 border-white shadow-lg flex items-center justify-center text-blue-600 text-5xl font-bold mb-6">
                    {p.name.charAt(0)}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{p.name}</h3>
                  <div className="px-4 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
                    ID: {p.patient_ref || p.patient_id}
                  </div>

                  <div className="w-full grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Age</p>
                      <p className="text-xl font-bold text-slate-800">{p.age} <span className="text-sm font-medium text-slate-500">yrs</span></p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Gender</p>
                      <p className="text-xl font-bold text-slate-800">{(p.gender === 0 || p.gender === 'Male' || p.gender === 'M') ? 'Male' : 'Female'}</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                 <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                 Vitals & Telemetry
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Heart Rate', val: p.heart_rate || 72, unit: 'bpm', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
                  { label: 'Blood Glucose', val: Math.round(p.glucose || 100), unit: 'mg/dL', icon: Microscope, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                  { label: 'Blood Pressure', val: `${Math.round(p.bp_systolic || 120)}/${Math.round(p.bp_diastolic || 80)}`, unit: 'mmHg', icon: Heart, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-600">{stat.label}</span>
                    </div>
                    <div className="text-right">
                       <span className="font-bold text-slate-800 text-lg">{stat.val}</span>
                       <span className="text-xs font-semibold text-slate-400 ml-1">{stat.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-100 space-y-3">
                 <button 
                  onClick={() => {
                    onNavigate('workflow')
                    window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: 'workflow' } }))
                  }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-colors"
                 >
                   <Activity className="w-4 h-4" />
                   <span>Start Diagnostic Workflow</span>
                 </button>
                 <button 
                  onClick={() => {
                    onNavigate('plan')
                    window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: 'plan' } }))
                  }}
                  className="w-full py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-colors"
                 >
                   <Clipboard className="w-4 h-4" />
                   <span>Generate Treatment Plan</span>
                 </button>
              </div>
            </div>
          </div>

          {/* Clinical History */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                       <History className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-slate-800">Clinical Timeline</h3>
                       <p className="text-slate-500 font-medium text-sm mt-0.5">Historical patient records and lab results</p>
                    </div>
                 </div>
                 <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center space-x-2 transition-colors shadow-sm">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                 </button>
              </div>

              <div className="p-8 flex-1 overflow-auto">
                 {patientDetail.history && patientDetail.history.length > 0 ? (
                   <div className="space-y-4">
                   {patientDetail.history.map((h, i) => (
                     <div key={i} className="group p-6 bg-white border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between hover:border-blue-200 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-start sm:items-center space-x-6 mb-4 sm:mb-0">
                           <div className="text-center w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center shrink-0">
                             <p className="text-[10px] font-bold text-slate-500 uppercase flex-1 flex items-end justify-center pb-0.5">MAR</p>
                             <p className="text-xl font-bold text-slate-800 flex-1 leading-none pt-0.5">12</p>
                           </div>
                           <div>
                             <h4 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">Lab Results & Vitals</h4>
                             <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                               <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                 <Clock className="w-3.5 h-3.5" />
                                 <span>14:32</span>
                               </div>
                               <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                                 <ShieldCheck className="w-3.5 h-3.5" />
                                 <span>Verified</span>
                               </div>
                             </div>
                           </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-0 sm:space-x-8 pl-22 sm:pl-0">
                           <div className="flex flex-col sm:items-end">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                              <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-700">
                                 Normal Range
                              </div>
                           </div>
                           <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                              <ChevronRight className="w-5 h-5" />
                           </div>
                        </div>
                     </div>
                   ))}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                      <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6">
                         <Clipboard className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">No Clinical History</h3>
                      <p className="text-sm font-medium text-slate-500 max-w-sm">There are no documented lab results or historical procedures for this patient.</p>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const riskGroups = ['CRITICAL_RISK', 'MONITORING_ACTIVE', 'OPTIMAL_SEQ'];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500 relative flex flex-col">
      {/* Header */}
      <div className="p-6 sm:p-10 border-b border-slate-100 flex flex-col xl:flex-row items-start xl:items-center justify-between bg-slate-50 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center space-x-3 tracking-tight">
            <div className="p-3 bg-blue-600 rounded-xl shadow-sm">
               <UserCircle className="w-7 h-7 text-white" />
            </div>
            <span>{language === 'hi' ? 'रोगी रजिस्ट्री' : 'Patient Registry'}</span>
          </h2>
          <p className="text-slate-500 font-semibold text-sm mt-3 ml-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Active Clinical Database • Protected
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto items-center gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search by ID or Patient Name..."
              value={search}
              onChange={(e) => {setSearch(e.target.value); setPage(0);}}
              className="w-full bg-white border border-slate-300 text-slate-700 font-medium rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex w-full sm:w-auto space-x-3">
             <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
               {[
                 { id: 'all', label: 'All Operations', color: 'text-slate-600', count: totalDbCount, active: 'bg-white text-blue-600 shadow-sm' },
                 { id: 'critical', label: 'Critical', color: 'text-rose-600', count: partitionCounts.critical, active: 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm' },
                 { id: 'monitoring', label: 'Monitoring', color: 'text-amber-600', count: partitionCounts.monitoring, active: 'bg-amber-50 text-amber-600 border border-amber-200 shadow-sm' },
                 { id: 'optimal', label: 'Optimal', color: 'text-emerald-600', count: partitionCounts.optimal, active: 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm' }
               ].map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => {setActiveTab(tab.id); setPage(0);}}
                   className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all relative flex flex-col items-center min-w-[90px] ${activeTab === tab.id ? tab.active : `${tab.color} hover:bg-slate-200/50`}`}
                 >
                   <span>{tab.label}</span>
                   <span className="text-[10px] opacity-70 leading-none mt-0.5">{tab.count.toLocaleString()}</span>
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-10 space-y-12 bg-white flex-1 overflow-auto">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-slate-100 rounded-full relative mb-6">
                 <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                 <Users className="absolute inset-0 m-auto w-6 h-6 text-blue-600" />
              </div>
              <p className="text-slate-600 font-bold">Loading Patient Database...</p>
           </div>
        ) : (patients?.length === 0) ? (
           <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6">
                 <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Patients Found</h3>
              <p className="text-sm font-medium text-slate-500 max-w-sm">No records match the current search criteria.</p>
           </div>
        ) : (
          <div className="space-y-12">
            {activeTab === 'all' && groupedPatients ? (
              ['critical', 'monitoring', 'optimal'].map(category => (
                <div key={category} className="space-y-4">
                  <PatientGroupSection 
                    title={category.toUpperCase()} 
                    count={groupedPatients[category]?.length || 0}
                    patients={groupedPatients[category] || []}
                    category={category}
                    fetchDetail={fetchDetail}
                    selectedId={selectedPatient?.patient_id}
                  />
                </div>
              ))
            ) : (
              <PatientGroupSection 
                title={activeTab.toUpperCase()} 
                count={patients.length} 
                patients={patients}
                category={activeTab}
                fetchDetail={fetchDetail}
                selectedId={selectedPatient?.patient_id}
              />
            )}
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm">
         <p className="font-bold text-slate-500 flex items-center gap-4">
           <span>Total Scan Status: <span className="text-slate-800">{patients?.length || (groupedPatients ? (groupedPatients.critical.length + groupedPatients.monitoring.length + groupedPatients.optimal.length) : 0)} Records Displayed</span></span>
           <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
           <span>Database Total: <span className="text-blue-600">{totalDbCount.toLocaleString()} Patients Registered</span></span>
         </p>
         <div className="flex items-center space-x-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm">
              Page {page + 1}
            </div>
            <button 
              disabled={(page + 1) * itemsPerPage >= (activeTab === 'all' ? totalDbCount : partitionCounts[activeTab])}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
         </div>
      </div>
    </div>
  )
}

// Atomic Component for reusable group section
function PatientGroupSection({ title, count, patients, category, fetchDetail, selectedId }) {
  if (patients.length === 0) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-2 px-2">
        <div className={`w-3 h-3 rounded-full ${
          category === 'critical' ? 'bg-rose-500 animate-pulse' : 
          category === 'monitoring' ? 'bg-amber-500' : 
          category === 'optimal' ? 'bg-emerald-500' : 'bg-blue-500'
        }`}></div>
        <h3 className={`text-sm font-bold uppercase tracking-widest ${
          category === 'critical' ? 'text-rose-600' : 
          category === 'monitoring' ? 'text-amber-600' : 
          category === 'optimal' ? 'text-emerald-600' : 'text-blue-600'
        }`}>
          {title} PATIENTS ({count})
        </h3>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse bg-white">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-5">Patient Identifier</th>
              <th className="px-6 py-5 hidden md:table-cell">Clinical Rank</th>
              <th className="px-6 py-5 hidden sm:table-cell">Bio-Data</th>
              <th className="px-6 py-5">Glucose</th>
              <th className="px-6 py-5 hidden lg:table-cell">Last Sync</th>
              <th className="px-6 py-5 text-right w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p) => {
              const statusLabel = category.toUpperCase();
              return (
                <tr 
                  key={p.patient_ref || p.patient_id} 
                  onClick={() => fetchDetail(p.patient_id || p.patient_ref)}
                  className={`hover:bg-blue-50/50 transition-colors group cursor-pointer ${selectedId === (p.patient_id || p.patient_ref) ? 'bg-blue-50/80' : ''}`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors text-lg uppercase shadow-sm">
                        {p.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-base group-hover:text-blue-700 transition-colors tracking-tight leading-tight">{p.name || 'Unknown Patient'}</span>
                        <span className="text-[11px] font-black text-slate-400 uppercase mt-0.5 block tracking-widest leading-none">{p.patient_ref || p.patient_id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      category === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-sm' :
                      category === 'monitoring' ? 'bg-amber-50 text-amber-600 border border-amber-100 shadow-sm' :
                      'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                    }`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-5 hidden sm:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{p.age} Years</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{(p.gender === 0 || p.gender === 'Male' || p.gender === 'M') ? 'Male' : 'Female'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl border ${category === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : category === 'monitoring' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                         <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-xl tracking-tighter">{Math.round(p.glucose || 100)}</span>
                        <span className="text-[10px] font-black text-slate-400 ml-1 uppercase">mg/dL</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden lg:table-cell">
                    <div className="flex items-center space-x-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                       <Clock className="w-4 h-4" />
                       <span className="leading-none">{p.clinical_status_updated ? new Date(p.clinical_status_updated).toLocaleDateString('en-GB') : 'Sync Pending'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right relative">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors group-hover:text-blue-600 text-slate-400">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 rounded-l-full opacity-0 group-hover:opacity-100 transition-all scale-y-50 group-hover:scale-y-100"></div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PatientRegistry
