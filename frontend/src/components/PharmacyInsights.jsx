import React, { useState, useEffect, useCallback } from "react";
import { API_URL } from "../config";

const API_BASE = API_URL;

// ── Color Palette & Theme ─────────────────────────────────────────────────────
const COLORS = {
  bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
  card: "rgba(255,255,255,0.05)",
  cardBorder: "rgba(255,255,255,0.1)",
  accent: "#38bdf8",
  accentGradient: "linear-gradient(135deg, #3b82f6, #06b6d4)",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
};

// ── Sample Village Data (realistic Indian villages) ───────────────────────────
const VILLAGES = [
  { id: "v1", name: "Rampur", block: "Sadar", district: "Gorakhpur", state: "UP", population: 2340, ashaWorker: "Sunita Devi" },
  { id: "v2", name: "Kothwa", block: "Bansgaon", district: "Gorakhpur", state: "UP", population: 1870, ashaWorker: "Radha Kumari" },
  { id: "v3", name: "Lakhnapur", block: "Gola", district: "Gorakhpur", state: "UP", population: 3210, ashaWorker: "Meena Devi" },
  { id: "v4", name: "Barhalganj", block: "Sahjanwa", district: "Gorakhpur", state: "UP", population: 4560, ashaWorker: "Asha Singh" },
  { id: "v5", name: "Pipraich", block: "Pipraich", district: "Gorakhpur", state: "UP", population: 5120, ashaWorker: "Kamla Devi" },
  { id: "v6", name: "Chauri Chaura", block: "Chauri Chaura", district: "Gorakhpur", state: "UP", population: 6780, ashaWorker: "Savitri Kumari" },
];

// ── Disease Database ──────────────────────────────────────────────────────────
const DISEASE_OPTIONS = [
  "Diabetes (मधुमेह)", "Hypertension (उच्च रक्तचाप)", "Malaria (मलेरिया)",
  "Dengue (डेंगी)", "Typhoid (टाइफ़ाइड)", "Tuberculosis (टीबी)",
  "Diarrhea (दस्त)", "Anemia (खून की कमी)", "Respiratory Infection (सांस की बीमारी)",
  "Skin Infection (चर्म रोग)", "Kidney Disease (गुर्दा रोग)", "Heart Disease (हृदय रोग)",
  "Jaundice (पीलिया)", "Cholera (हैजा)", "Gastritis (गैस्ट्राइटिस)",
  "Arthritis (गठिया)", "Asthma (दमा)", "Conjunctivitis (आँख आना)",
  "UTI (मूत्र संक्रमण)", "Pneumonia (निमोनिया)"
];

// ── Mini Bar Chart Component ──────────────────────────────────────────────────
function MiniBarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ minWidth: 180, fontSize: "0.82rem", color: COLORS.textSecondary, textAlign: "right" }}>
            {item.label}
          </div>
          <div style={{ flex: 1, height: 22, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.max((item.count / max) * 100, 2)}%`,
                background: item.color || COLORS.accentGradient,
                borderRadius: 6,
                transition: "width 0.8s ease-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: 8,
              }}
            >
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>
                {item.count}
              </span>
            </div>
          </div>
          <div style={{ minWidth: 45, fontSize: "0.78rem", color: COLORS.accent, fontWeight: 700 }}>
            {((item.count / (data.reduce((s, d) => s + d.count, 0) || 1)) * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Priority Badge ────────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const config = {
    Critical: { bg: "rgba(239,68,68,0.2)", color: "#f87171", icon: "🔴" },
    Essential: { bg: "rgba(59,130,246,0.2)", color: "#60a5fa", icon: "🔵" },
    Important: { bg: "rgba(245,158,11,0.2)", color: "#fbbf24", icon: "🟡" },
  };
  const c = config[priority] || config.Important;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "2px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>
      {c.icon} {priority}
    </span>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function PharmacyInsights() {
  // ── Dynamic Data States ──────────────────────────────────────────────────
  const [villages, setVillages] = useState(VILLAGES);
  const [inventory, setInventory] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [stockUpdateError, setStockUpdateError] = useState(null);

  // Fetch villages and inventory on load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const invRes = await fetch(`${API_BASE}/api/pharmacy/inventory`);
        const invData = await invRes.json();
        if (invData.success) {
          setInventory(invData.inventory);
        }
      } catch (err) {
        console.error("Failed to fetch initial pharmacy data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Handle stock update in backend
  const handleStockUpdate = async (med_id, change) => {
    try {
      setStockUpdateError(null);
      const res = await fetch(`${API_BASE}/api/pharmacy/stock-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ med_id, change }),
      });
      const data = await res.json();
      if (data.success) {
        setInventory(prev => prev.map(item => 
          item.med_id === med_id ? { ...item, current_stock: item.current_stock + change } : item
        ));
      } else {
        setStockUpdateError("Update failed on server");
      }
    } catch (err) {
      setStockUpdateError("Network error during update");
    }
  };

  // ── State ─────────────────────────────────────────────────────────────────
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [villagerRecords, setVillagerRecords] = useState([]);
  const [activeSection, setActiveSection] = useState("collect"); // collect | analysis | pharmacy
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Form state for data collection
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Female",
    disease: DISEASE_OPTIONS[0],
    severity: "Mild",
    symptoms: "",
    duration: "1 week",
    treatment_status: "Untreated",
  });

  // ── Add Record ──────────────────────────────────────────────────────────
  const addRecord = () => {
    if (!selectedVillage || !formData.name || !formData.age) return;
    const record = {
      id: Date.now(),
      village: selectedVillage.name,
      villageId: selectedVillage.id,
      ashaWorker: selectedVillage.ashaWorker,
      ...formData,
      age: parseInt(formData.age),
      timestamp: new Date().toISOString(),
    };
    setVillagerRecords(prev => [...prev, record]);
    setFormData(f => ({ ...f, name: "", age: "", symptoms: "" }));
  };

  // ── Analyze Disease Frequency ───────────────────────────────────────────
  const analyzeData = useCallback(() => {
    if (villagerRecords.length === 0) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      // Count diseases
      const diseaseCount = {};
      const severityMap = {};
      const ageGroups = { "0-18": 0, "19-35": 0, "36-55": 0, "56+": 0 };
      const genderCount = { Male: 0, Female: 0 };

      villagerRecords.forEach(r => {
        diseaseCount[r.disease] = (diseaseCount[r.disease] || 0) + 1;
        if (!severityMap[r.disease]) severityMap[r.disease] = { Mild: 0, Moderate: 0, Severe: 0 };
        severityMap[r.disease][r.severity] = (severityMap[r.disease][r.severity] || 0) + 1;

        const age = r.age;
        if (age <= 18) ageGroups["0-18"]++;
        else if (age <= 35) ageGroups["19-35"]++;
        else if (age <= 55) ageGroups["36-55"]++;
        else ageGroups["56+"]++;

        genderCount[r.gender] = (genderCount[r.gender] || 0) + 1;
      });

      // Sort by frequency
      const sorted = Object.entries(diseaseCount)
        .sort((a, b) => b[1] - a[1])
        .map(([disease, count], i) => ({
          disease,
          count,
          percentage: ((count / villagerRecords.length) * 100).toFixed(1),
          severity: severityMap[disease],
          rank: i + 1,
          color: [
            "linear-gradient(135deg, #ef4444, #f97316)",
            "linear-gradient(135deg, #f59e0b, #eab308)",
            "linear-gradient(135deg, #3b82f6, #6366f1)",
            "linear-gradient(135deg, #10b981, #14b8a6)",
            "linear-gradient(135deg, #8b5cf6, #a855f7)",
            "linear-gradient(135deg, #ec4899, #f43f5e)",
          ][i % 6],
        }));

      setAnalysisResult({
        totalRecords: villagerRecords.length,
        totalDiseases: Object.keys(diseaseCount).length,
        topDiseases: sorted,
        ageDistribution: ageGroups,
        genderDistribution: genderCount,
        mostCommon: sorted[0]?.disease || "N/A",
        criticalDiseases: sorted.filter(d => d.severity?.Severe > 0),
      });

      setIsAnalyzing(false);
      setActiveSection("analysis");
    }, 1500);
  }, [villagerRecords]);

  // ── Generate AI Pharmacy Recommendations ────────────────────────────────
  const generatePharmacyRecommendation = useCallback(async () => {
    if (!analysisResult || !selectedVillage) return;
    setIsLoadingAI(true);
    setActiveSection("pharmacy");

    try {
      const res = await fetch(`${API_BASE}/api/pharmacy/recommendations/${selectedVillage.name}`);
      const data = await res.json();
      
      if (data.success) {
        // Combine backend recs with medicine details from inventory
        const richRecs = data.recommendations.map(rec => {
          const medInfo = inventory.find(inv => inv.name === rec.medicine);
          return {
            ...rec,
            category: medInfo?.category || "General",
            priority: medInfo?.priority || "Important"
          };
        });

        setAiRecommendation({
          recommendations: richRecs, // Flattened for display
          consolidatedMedicines: richRecs, // Simplified for this logic
          aiInsight: null, // We can add separate AI explain later
          generatedAt: new Date().toISOString(),
          village: selectedVillage.name,
          population: selectedVillage.population,
        });
      }
    } catch (e) {
      console.log("Failed to fetch backend recommendations:", e);
    } finally {
      setIsLoadingAI(false);
    }
  }, [analysisResult, selectedVillage, inventory]);

  // ── Load demo data ──────────────────────────────────────────────────────
  const loadDemoData = () => {
    if (!selectedVillage) return;
    const demoRecords = [];
    const names = ["Ramesh", "Sunita", "Mohan", "Geeta", "Rajesh", "Kamla", "Suresh", "Lakshmi", "Dinesh", "Parvati", "Anil", "Savitri", "Gopal", "Meera", "Vijay", "Asha", "Ravi", "Suman", "Deepak", "Nirmala", "Bhola", "Durga", "Manoj", "Sita", "Pramod"];
    const weights = [5, 4, 3, 3, 2, 2, 1, 1, 1, 1, 1, 1]; // Weighted disease distribution
    const severities = ["Mild", "Mild", "Mild", "Moderate", "Moderate", "Severe"];
    const durations = ["1 week", "2 weeks", "1 month", "3 months", "6 months"];

    for (let i = 0; i < 25; i++) {
      // Weighted random disease selection (some diseases are more common)
      let diseaseIdx = 0;
      let roll = Math.random() * weights.reduce((s, w) => s + w, 0);
      for (let j = 0; j < weights.length; j++) {
        roll -= weights[j];
        if (roll <= 0) { diseaseIdx = j; break; }
      }

      demoRecords.push({
        id: Date.now() + i,
        village: selectedVillage.name,
        villageId: selectedVillage.id,
        ashaWorker: selectedVillage.ashaWorker,
        name: names[i % names.length],
        age: 15 + Math.floor(Math.random() * 60),
        gender: Math.random() > 0.45 ? "Female" : "Male",
        disease: DISEASE_OPTIONS[diseaseIdx % DISEASE_OPTIONS.length],
        severity: severities[Math.floor(Math.random() * severities.length)],
        symptoms: "Common symptoms reported",
        duration: durations[Math.floor(Math.random() * durations.length)],
        treatment_status: Math.random() > 0.5 ? "Untreated" : "Under Treatment",
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    setVillagerRecords(prev => [...prev, ...demoRecords]);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🏥</div>
          <h1 style={{ color: COLORS.textPrimary, fontSize: "2rem", fontWeight: 800, margin: 0 }}>
            Village Pharmacy Intelligence
          </h1>
          <p style={{ color: COLORS.textSecondary, marginTop: "0.5rem", maxWidth: 600, margin: "0.5rem auto 0" }}>
            ASHA worker data collection → Disease frequency analysis → AI-powered medicine recommendations for rural pharmacies
          </p>
        </div>

        {/* ── Village Selector ──────────────────────────────────────────── */}
        <div style={{ background: COLORS.card, borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem", border: `1px solid ${COLORS.cardBorder}` }}>
          <h2 style={{ color: COLORS.textPrimary, fontSize: "1.1rem", marginBottom: "1rem", fontWeight: 600 }}>
            📍 Select Village
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
            {VILLAGES.map(v => (
              <button
                key={v.id}
                onClick={() => { setSelectedVillage(v); setVillagerRecords([]); setAnalysisResult(null); setAiRecommendation(null); }}
                style={{
                  padding: "0.9rem",
                  borderRadius: 12,
                  border: selectedVillage?.id === v.id ? "2px solid #3b82f6" : `1px solid ${COLORS.cardBorder}`,
                  background: selectedVillage?.id === v.id ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: "0.95rem" }}>{v.name}</div>
                <div style={{ color: COLORS.textMuted, fontSize: "0.75rem", marginTop: 2 }}>👥 Pop: {v.population.toLocaleString()}</div>
                <div style={{ color: COLORS.accent, fontSize: "0.72rem", marginTop: 2 }}>ASHA: {v.ashaWorker}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedVillage && (
          <>
            {/* ── Tab Navigation ──────────────────────────────────────── */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {[
                { key: "collect", label: "📋 Data Collection", desc: "ASHA Worker Input" },
                { key: "analysis", label: "📊 Disease Analysis", desc: `${villagerRecords.length} records`, disabled: villagerRecords.length === 0 },
                { key: "pharmacy", label: "💊 AI Recommendations", desc: "Predictive Stock", disabled: !analysisResult },
                { key: "inventory", label: "📦 Current Inventory", desc: `${inventory.length} items`, disabled: inventory.length === 0 },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => !tab.disabled && setActiveSection(tab.key)}
                  disabled={tab.disabled}
                  style={{
                    padding: "0.85rem 1.5rem",
                    borderRadius: 12,
                    border: activeSection === tab.key ? "2px solid #3b82f6" : `1px solid ${COLORS.cardBorder}`,
                    background: activeSection === tab.key ? "rgba(59,130,246,0.15)" : COLORS.card,
                    cursor: tab.disabled ? "not-allowed" : "pointer",
                    opacity: tab.disabled ? 0.4 : 1,
                    transition: "all 0.25s",
                    textAlign: "left",
                  }}
                >
                  <div style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: "0.95rem" }}>{tab.label}</div>
                  <div style={{ color: COLORS.textMuted, fontSize: "0.72rem", marginTop: 2 }}>{tab.desc}</div>
                </button>
              ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 1: DATA COLLECTION
            ═══════════════════════════════════════════════════════════════ */}
            {activeSection === "collect" && (
              <div>
                {/* Village Info Banner */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.1))",
                  borderRadius: 14,
                  padding: "1.25rem",
                  marginBottom: "1.5rem",
                  border: "1px solid rgba(59,130,246,0.2)",
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                  alignItems: "center",
                }}>
                  <div>
                    <h3 style={{ color: COLORS.accent, margin: 0, fontSize: "1.2rem" }}>🏘️ {selectedVillage.name}</h3>
                    <p style={{ color: COLORS.textSecondary, margin: "4px 0 0", fontSize: "0.85rem" }}>
                      Block: {selectedVillage.block} · District: {selectedVillage.district} · ASHA: {selectedVillage.ashaWorker}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: COLORS.accent, fontSize: "1.5rem", fontWeight: 800 }}>{selectedVillage.population.toLocaleString()}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: "0.7rem" }}>POPULATION</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "#10b981", fontSize: "1.5rem", fontWeight: 800 }}>{villagerRecords.filter(r => r.villageId === selectedVillage.id).length}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: "0.7rem" }}>RECORDS</div>
                    </div>
                  </div>
                </div>

                {/* Input Form */}
                <div style={{ background: COLORS.card, borderRadius: 16, padding: "1.5rem", border: `1px solid ${COLORS.cardBorder}`, marginBottom: "1.5rem" }}>
                  <h3 style={{ color: COLORS.textPrimary, fontSize: "1rem", marginBottom: "1.25rem", fontWeight: 600 }}>
                    👩‍⚕️ ASHA Worker — Patient Data Entry
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                    {/* Name */}
                    <div>
                      <label style={{ color: COLORS.textMuted, fontSize: "0.78rem", display: "block", marginBottom: 4 }}>Patient Name *</label>
                      <input
                        value={formData.name}
                        onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Ramesh Kumar"
                        style={inputStyle}
                      />
                    </div>
                    {/* Age */}
                    <div>
                      <label style={{ color: COLORS.textMuted, fontSize: "0.78rem", display: "block", marginBottom: 4 }}>Age *</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={e => setFormData(f => ({ ...f, age: e.target.value }))}
                        placeholder="e.g. 45"
                        style={inputStyle}
                      />
                    </div>
                    {/* Gender */}
                    <div>
                      <label style={{ color: COLORS.textMuted, fontSize: "0.78rem", display: "block", marginBottom: 4 }}>Gender</label>
                      <select
                        value={formData.gender}
                        onChange={e => setFormData(f => ({ ...f, gender: e.target.value }))}
                        style={inputStyle}
                      >
                        <option value="Male">Male / पुरुष</option>
                        <option value="Female">Female / महिला</option>
                        <option value="Other">Other / अन्य</option>
                      </select>
                    </div>
                    {/* Disease */}
                    <div>
                      <label style={{ color: COLORS.textMuted, fontSize: "0.78rem", display: "block", marginBottom: 4 }}>Disease / बीमारी *</label>
                      <select
                        value={formData.disease}
                        onChange={e => setFormData(f => ({ ...f, disease: e.target.value }))}
                        style={inputStyle}
                      >
                        {DISEASE_OPTIONS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    {/* Severity */}
                    <div>
                      <label style={{ color: COLORS.textMuted, fontSize: "0.78rem", display: "block", marginBottom: 4 }}>Severity / गंभीरता</label>
                      <select
                        value={formData.severity}
                        onChange={e => setFormData(f => ({ ...f, severity: e.target.value }))}
                        style={inputStyle}
                      >
                        <option value="Mild">Mild / सामान्य</option>
                        <option value="Moderate">Moderate / मध्यम</option>
                        <option value="Severe">Severe / गंभीर</option>
                      </select>
                    </div>
                    {/* Duration */}
                    <div>
                      <label style={{ color: COLORS.textMuted, fontSize: "0.78rem", display: "block", marginBottom: 4 }}>Duration / अवधि</label>
                      <select
                        value={formData.duration}
                        onChange={e => setFormData(f => ({ ...f, duration: e.target.value }))}
                        style={inputStyle}
                      >
                        <option value="1 week">1 Week / 1 हफ्ता</option>
                        <option value="2 weeks">2 Weeks / 2 हफ्ते</option>
                        <option value="1 month">1 Month / 1 महीना</option>
                        <option value="3 months">3 Months / 3 महीने</option>
                        <option value="6 months">6+ Months / 6+ महीने</option>
                      </select>
                    </div>
                    {/* Treatment Status */}
                    <div>
                      <label style={{ color: COLORS.textMuted, fontSize: "0.78rem", display: "block", marginBottom: 4 }}>Treatment Status</label>
                      <select
                        value={formData.treatment_status}
                        onChange={e => setFormData(f => ({ ...f, treatment_status: e.target.value }))}
                        style={inputStyle}
                      >
                        <option value="Untreated">Untreated / अनुपचारित</option>
                        <option value="Under Treatment">Under Treatment / इलाज चालू</option>
                        <option value="Recovered">Recovered / ठीक</option>
                      </select>
                    </div>
                    {/* Symptoms */}
                    <div>
                      <label style={{ color: COLORS.textMuted, fontSize: "0.78rem", display: "block", marginBottom: 4 }}>Symptoms / लक्षण</label>
                      <input
                        value={formData.symptoms}
                        onChange={e => setFormData(f => ({ ...f, symptoms: e.target.value }))}
                        placeholder="e.g. Fever, cough, weakness"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
                    <button onClick={addRecord} style={btnPrimary}>
                      ➕ Add Patient Record
                    </button>
                    <button onClick={loadDemoData} style={btnSecondary}>
                      📥 Load Demo Data (25 records)
                    </button>
                    {villagerRecords.length > 0 && (
                      <button onClick={analyzeData} style={btnSuccess}>
                        {isAnalyzing ? "🔄 Analyzing..." : `📊 Analyze ${villagerRecords.length} Records`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Records Table */}
                {villagerRecords.length > 0 && (
                  <div style={{ background: COLORS.card, borderRadius: 16, padding: "1.5rem", border: `1px solid ${COLORS.cardBorder}` }}>
                    <h3 style={{ color: COLORS.textPrimary, fontSize: "1rem", marginBottom: "1rem", fontWeight: 600 }}>
                      📋 Collected Records ({villagerRecords.length})
                    </h3>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            {["#", "Name", "Age", "Gender", "Disease", "Severity", "Duration", "Status"].map(h => (
                              <th key={h} style={{ padding: "8px 12px", color: COLORS.textMuted, fontSize: "0.75rem", textAlign: "left", borderBottom: `1px solid ${COLORS.cardBorder}`, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {villagerRecords.slice(-15).map((r, i) => (
                            <tr key={r.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                              <td style={tdStyle}>{i + 1}</td>
                              <td style={{ ...tdStyle, color: COLORS.textPrimary, fontWeight: 600 }}>{r.name}</td>
                              <td style={tdStyle}>{r.age}</td>
                              <td style={tdStyle}>{r.gender}</td>
                              <td style={{ ...tdStyle, color: COLORS.accent }}>{r.disease.split("(")[0].trim()}</td>
                              <td style={tdStyle}>
                                <span style={{
                                  padding: "2px 8px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 600,
                                  background: r.severity === "Severe" ? "rgba(239,68,68,0.2)" : r.severity === "Moderate" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)",
                                  color: r.severity === "Severe" ? "#f87171" : r.severity === "Moderate" ? "#fbbf24" : "#6ee7b7",
                                }}>
                                  {r.severity}
                                </span>
                              </td>
                              <td style={tdStyle}>{r.duration}</td>
                              <td style={tdStyle}>
                                <span style={{
                                  padding: "2px 8px", borderRadius: 8, fontSize: "0.72rem",
                                  background: r.treatment_status === "Untreated" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                                  color: r.treatment_status === "Untreated" ? "#fca5a5" : "#6ee7b7",
                                }}>
                                  {r.treatment_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {villagerRecords.length > 15 && (
                        <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", marginTop: "0.5rem", textAlign: "center" }}>
                          Showing last 15 of {villagerRecords.length} records
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 2: DISEASE ANALYSIS
            ═══════════════════════════════════════════════════════════════ */}
            {activeSection === "analysis" && analysisResult && (
              <div>
                {/* Stats Overview */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                  {[
                    { label: "Total Records", value: analysisResult.totalRecords, icon: "📋", color: "#3b82f6" },
                    { label: "Diseases Found", value: analysisResult.totalDiseases, icon: "🦠", color: "#f59e0b" },
                    { label: "Most Common", value: analysisResult.mostCommon.split("(")[0].trim(), icon: "⚠️", color: "#ef4444" },
                    { label: "Severe Cases", value: analysisResult.criticalDiseases.length, icon: "🚨", color: "#dc2626" },
                  ].map((stat, i) => (
                    <div key={i} style={{
                      background: COLORS.card,
                      borderRadius: 14,
                      padding: "1.25rem",
                      border: `1px solid ${COLORS.cardBorder}`,
                      borderLeft: `3px solid ${stat.color}`,
                    }}>
                      <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{stat.icon}</div>
                      <div style={{ color: stat.color, fontSize: "1.5rem", fontWeight: 800 }}>{stat.value}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Disease Frequency Chart */}
                <div style={{ background: COLORS.card, borderRadius: 16, padding: "1.5rem", border: `1px solid ${COLORS.cardBorder}`, marginBottom: "1.5rem" }}>
                  <h3 style={{ color: COLORS.textPrimary, fontSize: "1.1rem", marginBottom: "1.25rem", fontWeight: 600 }}>
                    📊 Disease Frequency Distribution — {selectedVillage.name}
                  </h3>
                  <MiniBarChart
                    data={analysisResult.topDiseases.map(d => ({
                      label: d.disease.split("(")[0].trim(),
                      count: d.count,
                      color: d.color,
                    }))}
                  />
                </div>

                {/* Demographics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  {/* Age Distribution */}
                  <div style={{ background: COLORS.card, borderRadius: 16, padding: "1.5rem", border: `1px solid ${COLORS.cardBorder}` }}>
                    <h4 style={{ color: COLORS.textPrimary, fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>👤 Age Distribution</h4>
                    <MiniBarChart
                      data={Object.entries(analysisResult.ageDistribution).map(([group, count]) => ({
                        label: `${group} years`,
                        count,
                        color: "linear-gradient(135deg, #8b5cf6, #a855f7)",
                      }))}
                    />
                  </div>
                  {/* Gender Distribution */}
                  <div style={{ background: COLORS.card, borderRadius: 16, padding: "1.5rem", border: `1px solid ${COLORS.cardBorder}` }}>
                    <h4 style={{ color: COLORS.textPrimary, fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>⚥ Gender Distribution</h4>
                    <MiniBarChart
                      data={Object.entries(analysisResult.genderDistribution).map(([gender, count]) => ({
                        label: gender,
                        count,
                        color: gender === "Male" ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "linear-gradient(135deg, #ec4899, #f43f5e)",
                      }))}
                    />
                  </div>
                </div>

                {/* Severity Breakdown per Disease */}
                <div style={{ background: COLORS.card, borderRadius: 16, padding: "1.5rem", border: `1px solid ${COLORS.cardBorder}`, marginBottom: "1.5rem" }}>
                  <h3 style={{ color: COLORS.textPrimary, fontSize: "1rem", marginBottom: "1.25rem", fontWeight: 600 }}>
                    🏥 Disease Severity Breakdown
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                    {analysisResult.topDiseases.slice(0, 6).map(d => (
                      <div key={d.disease} style={{
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: 12,
                        padding: "1rem",
                        border: `1px solid ${COLORS.cardBorder}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                          <span style={{ color: COLORS.accent, fontWeight: 700, fontSize: "0.88rem" }}>
                            {d.disease.split("(")[0].trim()}
                          </span>
                          <span style={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>
                            {d.count} cases · {d.percentage}%
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {["Mild", "Moderate", "Severe"].map(sev => (
                            <span key={sev} style={{
                              padding: "3px 10px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 600,
                              background: sev === "Severe" ? "rgba(239,68,68,0.2)" : sev === "Moderate" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)",
                              color: sev === "Severe" ? "#f87171" : sev === "Moderate" ? "#fbbf24" : "#6ee7b7",
                            }}>
                              {sev}: {d.severity?.[sev] || 0}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action: Generate Pharmacy Recommendation */}
                <div style={{ textAlign: "center" }}>
                  <button onClick={generatePharmacyRecommendation} style={{
                    ...btnPrimary,
                    fontSize: "1rem",
                    padding: "0.85rem 2.5rem",
                    boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
                  }}>
                    {isLoadingAI ? "🔄 Generating AI Recommendations..." : "💊 Generate Pharmacy Stock Recommendations →"}
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 3: PHARMACY RECOMMENDATIONS
            ═══════════════════════════════════════════════════════════════ */}
            {activeSection === "pharmacy" && (
              <div>
                {isLoadingAI ? (
                  <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem", animation: "pulse 1.5s infinite" }}>💊</div>
                    <h3 style={{ color: COLORS.textPrimary, fontWeight: 700 }}>Analyzing Disease Data & Generating Recommendations...</h3>
                    <p style={{ color: COLORS.textSecondary }}>AI is calculating optimal medicine stock for {selectedVillage?.name}</p>
                    <div style={{ width: 200, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 4, margin: "1.5rem auto", overflow: "hidden" }}>
                      <div style={{ width: "60%", height: "100%", background: COLORS.accentGradient, borderRadius: 4, animation: "loading 1.5s ease-in-out infinite" }} />
                    </div>
                  </div>
                ) : aiRecommendation ? (
                  <>
                    {/* Pharmacy Header */}
                    <div style={{
                      background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.1))",
                      borderRadius: 16,
                      padding: "1.5rem",
                      marginBottom: "1.5rem",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                        <div>
                          <h2 style={{ color: "#10b981", margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>
                            💊 Pharmacy Stock Plan — {aiRecommendation.village}
                          </h2>
                          <p style={{ color: COLORS.textSecondary, margin: "4px 0 0", fontSize: "0.85rem" }}>
                            Generated at {new Date(aiRecommendation.generatedAt).toLocaleString()} · Population: {aiRecommendation.population?.toLocaleString()}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ color: "#10b981", fontSize: "1.4rem", fontWeight: 800 }}>{aiRecommendation.consolidatedMedicines.length}</div>
                            <div style={{ color: COLORS.textMuted, fontSize: "0.7rem" }}>MEDICINES</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ color: COLORS.accent, fontSize: "1.4rem", fontWeight: 800 }}>{aiRecommendation.recommendations.length}</div>
                            <div style={{ color: COLORS.textMuted, fontSize: "0.7rem" }}>DISEASES</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Consolidated Medicine Stock List */}
                    <div style={{ background: COLORS.card, borderRadius: 16, padding: "1.5rem", border: `1px solid ${COLORS.cardBorder}`, marginBottom: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                        <h3 style={{ color: COLORS.textPrimary, fontSize: "1.1rem", margin: 0, fontWeight: 600 }}>
                          📦 AI-Driven Stock Recommendations
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>Comparison with current inventory status</span>
                      </div>
                      
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              {["Medicine", "Trending Disease", "Frequency", "Current Stock", "Min Required", "Gap / Add"].map(h => (
                                <th key={h} style={{
                                  padding: "10px 12px", color: COLORS.textMuted, fontSize: "0.72rem", textAlign: "left",
                                  borderBottom: `1px solid ${COLORS.cardBorder}`, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1,
                                }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {aiRecommendation.recommendations.map((rec, i) => (
                              <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                                <td style={{ ...tdStyle, color: COLORS.textPrimary, fontWeight: 600 }}>{rec.medicine}</td>
                                <td style={tdStyle}>
                                  <span style={{ background: "rgba(56,189,248,0.1)", color: COLORS.accent, padding: "2px 8px", borderRadius: 6, fontSize: "0.72rem" }}>
                                    {rec.disease}
                                  </span>
                                </td>
                                <td style={tdStyle}>{rec.frequency} cases</td>
                                <td style={{ ...tdStyle, color: rec.current_stock < 100 ? COLORS.danger : COLORS.textPrimary }}>
                                  {rec.current_stock} units
                                </td>
                                <td style={tdStyle}>{rec.frequency * 10} units</td>
                                <td style={{ ...tdStyle, color: COLORS.success, fontWeight: 700 }}>
                                  +{rec.suggested_add} units
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div style={{
                      background: "rgba(245,158,11,0.1)",
                      borderRadius: 12,
                      padding: "1rem 1.25rem",
                      borderLeft: "3px solid #f59e0b",
                    }}>
                      <p style={{ color: COLORS.textSecondary, fontSize: "0.82rem", margin: 0 }}>
                        ⚠️ <strong style={{ color: "#fbbf24" }}>Clinical Alert:</strong> These recommendations are calculated using real-time village health trends vs current pharmacy levels. 
                        Critical medicines for {selectedVillage.name} are prioritized based on prevalence.
                      </p>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
                    <h3 style={{ color: COLORS.textPrimary }}>Run Disease Analysis First</h3>
                    <p style={{ color: COLORS.textSecondary }}>Collect patient data and analyze disease frequency to generate pharmacy recommendations.</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 4: CURRENT INVENTORY
            ═══════════════════════════════════════════════════════════════ */}
            {activeSection === "inventory" && (
              <div style={{ background: COLORS.card, borderRadius: 16, padding: "1.5rem", border: `1px solid ${COLORS.cardBorder}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ color: COLORS.textPrimary, fontSize: "1.1rem", margin: 0, fontWeight: 600 }}>
                    📦 Managed Pharmacy Inventory ({inventory.length} SKUs)
                  </h3>
                  {stockUpdateError && <span style={{ color: COLORS.danger, fontSize: "0.8rem" }}>{stockUpdateError}</span>}
                </div>
                
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Med ID", "Medicine Name", "Category", "Priority", "Current Stock", "Min Stock", "Actions"].map(h => (
                          <th key={h} style={{
                            padding: "10px 12px", color: COLORS.textMuted, fontSize: "0.72rem", textAlign: "left",
                            borderBottom: `1px solid ${COLORS.cardBorder}`, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1,
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <tr key={item.med_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ ...tdStyle, fontFamily: "monospace" }}>{item.med_id}</td>
                          <td style={{ ...tdStyle, color: COLORS.textPrimary, fontWeight: 700 }}>{item.name}</td>
                          <td style={tdStyle}>{item.category}</td>
                          <td style={tdStyle}><PriorityBadge priority={item.priority} /></td>
                          <td style={{ ...tdStyle, color: item.current_stock < item.min_stock ? COLORS.danger : COLORS.success, fontWeight: 800 }}>
                            {item.current_stock}
                          </td>
                          <td style={tdStyle}>{item.min_stock}</td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                onClick={() => handleStockUpdate(item.med_id, 100)}
                                style={{ background: "rgba(16,185,129,0.15)", border: "none", color: COLORS.success, padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: "0.7rem" }}
                              >
                                +100
                              </button>
                              <button 
                                onClick={() => handleStockUpdate(item.med_id, -50)}
                                style={{ background: "rgba(239,68,68,0.15)", border: "none", color: COLORS.danger, padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: "0.7rem" }}
                              >
                                -50
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* No Village Selected */}
        {!selectedVillage && (
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📍</div>
            <h3 style={{ color: COLORS.textPrimary, fontSize: "1.3rem" }}>Select a Village to Begin</h3>
            <p style={{ color: COLORS.textSecondary, maxWidth: 500, margin: "0.5rem auto" }}>
              Choose a village above to start collecting patient data through ASHA workers,
              analyze disease patterns, and generate pharmacy stock recommendations.
            </p>
          </div>
        )}
      </div>

      {/* ── Keyframe animations ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

// ── Shared Styles ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  borderRadius: 10,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#f1f5f9",
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
};

const tdStyle = {
  padding: "8px 12px",
  color: "#94a3b8",
  fontSize: "0.82rem",
};

const btnPrimary = {
  padding: "0.65rem 1.75rem",
  borderRadius: 10,
  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
  border: "none",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.9rem",
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
  transition: "all 0.3s",
};

const btnSecondary = {
  padding: "0.65rem 1.75rem",
  borderRadius: 10,
  background: "rgba(99,102,241,0.15)",
  border: "1px solid rgba(99,102,241,0.3)",
  color: "#a5b4fc",
  fontWeight: 600,
  fontSize: "0.9rem",
  cursor: "pointer",
  transition: "all 0.3s",
};

const btnSuccess = {
  padding: "0.65rem 1.75rem",
  borderRadius: 10,
  background: "linear-gradient(135deg, #10b981, #059669)",
  border: "none",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.9rem",
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(16,185,129,0.3)",
  transition: "all 0.3s",
};
