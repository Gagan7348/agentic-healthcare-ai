import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { API_URL } from "../config";

// Configuration for AI Council
const DEFAULT_MODEL = "gemini-2.0-flash"; // Upgraded for 2026 Stability
const BACKUP_KEY = "AIzaSyBitVCSzJlSwwaQVrvfx2Qw32flej6yydU";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || BACKUP_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Professional Clinical Diagnostic Persona
const MEDICAL_SYSTEM_PROMPT = `You are a Board-Certified Senior Medical Specialist within the Agentic AI Hospital OS.
Your role:
- Conduct an authoritative clinical synthesis and diagnostic assessment of patient telemetry.
- Provide highly structured medical evidence according to international clinical standards (WHO, CDC, ICD-10).
- Maintain a highly professional, clinical, and precise tone, similar to a lead consultant during hospital rounds.

Clinical Encounter Protocol (Always follow this structure):
1. **SUBJECTIVE**: Detailed summary of reported symptoms, history, and patient experience.
2. **OBJECTIVE**: Direct analysis of numerical vitals (Glucose, BP, Cholesterol, etc.) and ML risk coefficients.
3. **CLINICAL ASSESSMENT (Impression)**: An authoritative synthesis of the Subjective vs Objective data. Identify the primary clinical impression.
4. **RECOMMENDED PROTOCOL (PLAN)**: 
   - Immediate non-negotiable interventions.
   - 7-day monitoring schedule.
   - Long-term preventative metrics.
   - Recommended evidence-based lifestyle adjustments (diet, activity).

Key Guidelines:
✅ CITE standard medical protocols (e.g., 'In accordance with current WHO hypertension guidelines').
✅ EXPLAIN complex physiology concisely - do not simplify to the point of losing clinical accuracy.
✅ USE precise medical terminology followed by a parenthetical clarification for the layperson (e.g., 'Tachycardia (Rapid Heart Rate)').
✅ ALWAYS conclude with a clear warning: "SYSTEM NOTICE: This is an AI-generated clinical impression. Mandatory specialist verification is required for final diagnosis and medication initiation."`;

const languageMap = {
  "en": "English", "hi": "pure Hindi (हिंदी)", "ta": "Tamil", "te": "Telugu",
  "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada",
  "ml": "Malayalam", "pa": "Punjabi"
};

/**
 * Frontend AI Service: Communicates directly with AI SDKs
 */
class aiService {
  constructor() {
    this.genAI = API_KEY ? new GoogleGenerativeAI(API_KEY, { apiVersion: "v1" }) : null;
    this.models = [
        "gemini-2.0-flash",   // Primary — fast & available
        "gemini-1.5-flash",   // Stable fallback
        "gemini-1.5-pro",     // Advanced fallback
        "gemini-1.0-pro"      // Legacy emergency fallback
    ];
    this.workingModel = null;
  }

  /**
   * Core Hybrid Chat Engine: Tries Gemini Council first, falls back to OpenAI
   */
  async chatWithAI(message, patientContext = null, history = [], language = "en") {
    const langName = languageMap[language] || "English";
    const languageInstruction = `IMPORTANT: Respond in ${langName} language only. Use Devanagari script for Hindi.`;
    const fullSystemPrompt = MEDICAL_SYSTEM_PROMPT + "\n\n" + languageInstruction;
    const contextMsg = patientContext ? `Patient Bio-Data: ${JSON.stringify(patientContext)}` : "";
    const finalInput = `${fullSystemPrompt}\n\n${contextMsg}\n\nUSER QUERY: ${message}`;
    
    let lastError = null;

    // NEW STEP 1: Attempt Cloud Backend (FastAPI - Port 8000)
    // This is the preferred method as it uses server-side keys
    console.log("📡 ROUTING: AI Council request via Cloud Backend...");
    try {
      const backendResponse = await axios.post(`${API_URL}/api/ai/chat`, {
        message: message,
        patient_data: patientContext,
        history: history.map(msg => ({ 
          role: msg.role === 'assistant' ? 'assistant' : 'user', 
          content: msg.content 
        })),
        language: language
      });

      if (backendResponse.data && backendResponse.data.success) {
        return {
          success: true,
          response: backendResponse.data.response,
          agent_status: backendResponse.data.agent_status || "Diagnostic Engine: Neural Cloud (Backend)",
          model: backendResponse.data.model || "Backend-AI"
        };
      }
    } catch (backendErr) {
      console.warn("⚠️ Local Backend AI failed. Falling back to direct client-side SDK...", backendErr.message);
      lastError = backendErr;
    }

    // STEP 2: Attempt Direct Gemini Council (Legacy/Fallback)
    if (this.genAI) {
      for (const modelName of this.models) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1" });
          const chat = model.startChat({
            history: history.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            })).filter((_, i) => i > 0 || history[0]?.role === 'user'),
            generationConfig: { maxOutputTokens: 2000, temperature: 0.2 },
          });
          const result = await chat.sendMessage(finalInput);
          const response = await result.response;
          return {
            success: true,
            response: response.text(),
            agent_status: `Diagnostic Engine: ${modelName} (Direct-Client)`,
            model: modelName
          };
        } catch (err) {
          lastError = err;
          console.warn(`⚠️ Gemini ${modelName} failed/leaked. Trying next...`, err.message);
          if (err.message.includes("leaked") || err.message.includes("403")) continue; 
          if (err.message.includes("429") || err.message.includes("404")) continue;
          break;
        }
      }
    }

    // STEP 3: Emergency Fallback to OpenAI (GPT-4o)
    if (OPENAI_API_KEY) {
      console.log("🚑 EMERGENCY FAILOVER: Deploying OpenAI (GPT-4o) Council...");
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: fullSystemPrompt },
              ...history.map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content })),
              { role: "user", content: finalInput }
            ],
            temperature: 0.2
          })
        });
        const data = await response.json();
        if (data.choices && data.choices[0]) {
          return {
            success: true,
            response: data.choices[0].message.content,
            agent_status: "Diagnostic Engine: OpenAI GPT-4o (Emergency Fallback)",
            model: "gpt-4o"
          };
        }
      } catch (openErr) {
        console.error("OpenAI Fallback Error:", openErr);
        lastError = openErr;
      }
    }

    throw new Error(`AI Council Fully Busy or Keys Compromised. (Details: ${lastError?.message || lastError})`);
  }

  /**
   * Specialized Diagnostic Methods (Using the Hybrid Engine)
   */
  async analyzeReport(file, fileType, language = "en") {
    const prompt = "Perform an authoritative clinical analysis of this medical report. Extract vitals and diagnosis.";
    try {
        if (!this.genAI) throw new Error("Gemini Key Missing for Vision");
        // DEFINTIVE FIX: Force stable 'v1' at the model level to bypass v1beta 404s
        const model = this.genAI.getGenerativeModel({ model: DEFAULT_MODEL }, { apiVersion: "v1" });
        
        // Convert Blob/File to base64 for direct transfer
        const base64Data = await this.fileToGenerativePart(file);
        const result = await model.generateContent([prompt, base64Data]);
        const response = await result.response;

        return {
            success: true,
            analysis: response.text(),
            model: DEFAULT_MODEL,
            agent_status: `Vision Analyst: ${DEFAULT_MODEL} (Netlify)`
        };
    } catch (err) {
        return this.chatWithAI(prompt, { type: "Medical Report" }, [], language); // Fallback to text-based if vision fails
    }
  }

  async generateTreatmentPlan(data, lang = "en") {
    return this.chatWithAI("Create a rigid 7-day clinical protocol.", data, [], lang);
  }

  async analyzeASHACase(data, symptoms, lang = "en") {
    return this.chatWithAI(`Triage these symptoms: ${JSON.stringify(symptoms)}`, data, [], lang);
  }

  async explainRisk(disease, risk, data, lang = "en") {
    return this.chatWithAI(`Explain the ${Math.round(risk * 100)}% risk of ${disease}.`, data, [], lang);
  }

  async getCollaborativeConsensus(data, lang = "en") {
    const res = await this.chatWithAI("Generate a Joint Council Consensus in JSON format.", data, [], lang);
    try {
      const jsonStr = res.response.replace(/```json|```/g, "").trim();
      return { success: true, ...JSON.parse(jsonStr) };
    } catch (e) {
      return { success: true, risk_level: "MODERATE", consensus_summary: res.response };
    }
  }

  async fileToGenerativePart(file) {
    const base64 = await new Promise(resolve => {
      const r = new FileReader(); r.onloadend = () => resolve(r.result.split(',')[1]); r.readAsDataURL(file);
    });
    return { inlineData: { data: base64, mimeType: file.type } };
  }
}

export default new aiService();
