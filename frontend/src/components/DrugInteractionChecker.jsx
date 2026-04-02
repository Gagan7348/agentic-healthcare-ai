import React, { useState } from "react";
import { API_URL } from "../config";

const API_BASE = API_URL;

const SEVERITY_CONFIG = {
  HIGH: { color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", icon: "🔴", label: "HIGH RISK" },
  MODERATE: { color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d", icon: "🟡", label: "MODERATE" },
  LOW: { color: "#10b981", bg: "#f0fdf4", border: "#6ee7b7", icon: "🟢", label: "LOW RISK" },
};

export default function DrugInteractionChecker() {
  const [drugs, setDrugs] = useState([""]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drugInfo, setDrugInfo] = useState(null);
  const [selectedDrug, setSelectedDrug] = useState("");

  const addDrug = () => setDrugs([...drugs, ""]);
  const removeDrug = (i) => setDrugs(drugs.filter((_, idx) => idx !== i));
  const updateDrug = (i, val) => {
    const updated = [...drugs];
    updated[i] = val;
    setDrugs(updated);
  };

  const checkInteractions = async () => {
    const validDrugs = drugs.map((d) => d.trim()).filter(Boolean);
    if (!validDrugs.length) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/drug/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugs: validDrugs }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Failed to connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrugInfo = async (drugName) => {
    if (!drugName.trim()) return;
    setSelectedDrug(drugName);
    try {
      const res = await fetch(`${API_BASE}/api/drug/info/${encodeURIComponent(drugName)}`);
      const data = await res.json();
      setDrugInfo(data);
    } catch (e) {
      setDrugInfo({ success: false, error: "Could not fetch drug info" });
    }
  };

  const sev = result ? SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.LOW : null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>💊</div>
          <h1 style={{ color: "#f1f5f9", fontSize: "2rem", fontWeight: 800, margin: 0 }}>
            Drug Interaction Checker
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>
            Powered by <strong style={{ color: "#38bdf8" }}>OpenFDA API</strong> — 120,000+ requests/day · Real FDA adverse event data
          </p>
        </div>

        {/* Input Card */}
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ color: "#e2e8f0", fontSize: "1.1rem", marginBottom: "1rem", fontWeight: 600 }}>
            Enter Drug Names to Check
          </h2>
          {drugs.map((drug, i) => (
            <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "center" }}>
              <span style={{ color: "#64748b", fontSize: "0.9rem", minWidth: 24, textAlign: "right" }}>{i + 1}.</span>
              <input
                value={drug}
                onChange={(e) => updateDrug(i, e.target.value)}
                placeholder={`e.g. ${["Metformin", "Aspirin", "Atorvastatin", "Lisinopril"][i] || "Drug name"}`}
                onKeyDown={(e) => e.key === "Enter" && addDrug()}
                style={{
                  flex: 1, padding: "0.75rem 1rem", borderRadius: 10,
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                  color: "#f1f5f9", fontSize: "1rem", outline: "none"
                }}
              />
              {drugs.length > 1 && (
                <button onClick={() => removeDrug(i)}
                  style={{ background: "rgba(239,68,68,0.2)", border: "none", color: "#f87171", borderRadius: 8, padding: "0.5rem 0.75rem", cursor: "pointer", fontSize: "1.1rem" }}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button onClick={addDrug}
              style={{ padding: "0.5rem 1.25rem", borderRadius: 8, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", cursor: "pointer", fontSize: "0.9rem" }}>
              + Add Drug
            </button>
            <button onClick={checkInteractions} disabled={loading}
              style={{
                padding: "0.65rem 2rem", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "#334155" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                border: "none", color: "#fff", fontWeight: 700, fontSize: "1rem",
                boxShadow: loading ? "none" : "0 4px 15px rgba(99,102,241,0.4)",
                transition: "all 0.3s"
              }}>
              {loading ? "🔍 Checking FDA Database..." : "🔍 Check Adverse Events"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, padding: "1rem", color: "#fca5a5", marginBottom: "1.5rem" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {result && result.success && (
          <div>
            {/* Severity Badge */}
            <div style={{ background: sev.bg, border: `1.5px solid ${sev.border}`, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "2rem" }}>{sev.icon}</span>
              <div>
                <div style={{ color: sev.color, fontWeight: 800, fontSize: "1.25rem" }}>{sev.label}</div>
                <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  Total FDA Adverse Event Reports: <strong style={{ color: sev.color }}>{result.total_adverse_reports?.toLocaleString()}</strong>
                </div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ color: "#475569", fontSize: "0.85rem" }}>Drugs checked</div>
                <div style={{ color: "#1e293b", fontWeight: 800, fontSize: "1.5rem" }}>{result.drugs_checked}</div>
              </div>
            </div>

            {/* Per-Drug Results */}
            <div style={{ display: "grid", gap: "1rem" }}>
              {result.drug_results?.map((drug, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "1.25rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <h3 style={{ color: "#38bdf8", fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                      💊 {drug.drug}
                    </h3>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <span style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", padding: "0.25rem 0.75rem", borderRadius: 20, fontSize: "0.8rem" }}>
                        {drug.total_reports?.toLocaleString() || 0} FDA reports
                      </span>
                      <button onClick={() => fetchDrugInfo(drug.drug)}
                        style={{ background: "rgba(16,185,129,0.2)", color: "#6ee7b7", padding: "0.25rem 0.75rem", borderRadius: 20, fontSize: "0.8rem", border: "none", cursor: "pointer" }}>
                        📋 Drug Info
                      </button>
                    </div>
                  </div>
                  {drug.top_adverse_events?.length > 0 ? (
                    <div>
                      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Top Reported Adverse Events:</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {drug.top_adverse_events.map((ev, j) => (
                          <span key={j} style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", padding: "0.2rem 0.6rem", borderRadius: 8, fontSize: "0.78rem" }}>
                            {ev.term} {ev.count ? `(${ev.count})` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: "#64748b", fontSize: "0.9rem" }}>✅ No significant adverse events found in FDA database</p>
                  )}
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: "1.25rem", background: "rgba(99,102,241,0.1)", borderRadius: 10, padding: "0.85rem 1rem", borderLeft: "3px solid #6366f1" }}>
              <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0 }}>
                ⚠️ <strong style={{ color: "#a5b4fc" }}>Disclaimer:</strong> {result.disclaimer}
              </p>
            </div>
          </div>
        )}

        {/* Drug Info Modal */}
        {drugInfo && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
            <div style={{ background: "#1e293b", borderRadius: 16, padding: "1.5rem", maxWidth: 600, width: "100%", border: "1px solid rgba(255,255,255,0.15)", maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ color: "#38bdf8", margin: 0 }}>💊 {selectedDrug} — Drug Information</h3>
                <button onClick={() => setDrugInfo(null)} style={{ background: "rgba(239,68,68,0.2)", border: "none", color: "#f87171", borderRadius: 8, padding: "0.25rem 0.6rem", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
              </div>
              {drugInfo.success ? (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {[
                    ["Brand Name", drugInfo.brand_name],
                    ["Generic Name", drugInfo.generic_name],
                    ["Manufacturer", drugInfo.manufacturer],
                    ["Indications", drugInfo.indications],
                    ["Warnings", drugInfo.warnings],
                    ["Dosage", drugInfo.dosage],
                  ].map(([label, val]) => val && (
                    <div key={label}>
                      <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                      <div style={{ color: "#e2e8f0", fontSize: "0.9rem", marginTop: "0.2rem" }}>{val}</div>
                    </div>
                  ))}
                  <div style={{ color: "#475569", fontSize: "0.78rem", marginTop: "0.5rem" }}>Source: OpenFDA Drug Label Database</div>
                </div>
              ) : (
                <p style={{ color: "#94a3b8" }}>{drugInfo.error || "No FDA label data found for this drug."}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
