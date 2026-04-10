import axios from "axios";
import { API_URL } from "../config";

console.log("🚀 AGENTIC AI: Stability Patch V8 Active (Gemini Native + Groq Fallback Engine)");

export const languageMap = {
  "en": "English", "hi": "pure Hindi (हिंदी)", "ta": "Tamil", "te": "Telugu",
  "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada",
  "ml": "Malayalam", "pa": "Punjabi"
};

/**
 * Frontend AI Service: Enforces Backend-First Routing to the Groq API.
 * This prevents client-side 429 Errors and keeps API keys secure.
 */
class aiService {
  /**
   * Core Chat Engine: Routes directly to the Groq-powered Backend
   */
  async chatWithAI(message, patientContext = null, history = [], language = "en") {
    console.log(`📡 ROUTING: Clinical Consultation via Gemini/Groq AI Engine (${API_URL})...`);
    
    let safePatientData = null;
    if (patientContext) {
      safePatientData = {
         age: patientContext.age || 45,
         gender: patientContext.gender || 'Unknown',
         ...patientContext
      };
    }

    try {
      const response = await axios.post(`${API_URL}/api/ai/chat`, {
        message: message,
        patient_data: safePatientData,
        history: history.map(msg => ({ 
          role: msg.role === 'assistant' ? 'assistant' : 'user', 
          content: msg.content 
        })),
        language: language
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          response: response.data.response,
          agent_status: response.data.agent_status || "Diagnostic Engine: Groq Llama (Backend)",
          model: response.data.model || "Groq-Llama-3.3"
        };
      }
      throw new Error(response.data.error || "Neural Link Failure");
    } catch (err) {
      console.error("❌ Backend AI routing failed:", err.message);
      return {
        success: false,
        error: `AI Council Error: ${err.response?.data?.error || err.message}`,
        agent_status: "SYSTEM ERROR: Neural Link Offline"
      };
    }
  }

  /**
   * Vision Analysis: Routes medical reports to the Groq-Vision backend
   */
  async analyzeReport(file, fileType, language = "en") {
    console.log(`📡 ROUTING: Vision Analysis via Gemini/Groq Vision Engine...`);
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", language);
        
        const response = await axios.post(`${API_URL}/api/ai/analyze-report`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000 // 5 minutes for deep exhaustive vision synthesis
        });
        
        if (response.data && response.data.success) {
            return {
                success: true,
                analysis: response.data.analysis,
                model: response.data.model || "Groq-Llama-Vision",
                agent_status: response.data.agent_status || "Vision Specialist: Groq Llama"
            };
        }
        throw new Error(response.data.error || "Vision Analysis Failed");
    } catch (err) {
        console.error("❌ Vision routing failed:", err.message);
        return {
            success: false,
            error: `Vision Error: ${err.response?.data?.error || err.message}`,
            agent_status: "SYSTEM ERROR: Vision Engine Offline"
        };
    }
  }

  async generateTreatmentPlan(data, lang = "en") {
    return this.chatWithAI("Generate a persistent treatment plan.", data, [], lang);
  }

  async analyzeASHACase(data, symptoms, lang = "en") {
    return this.chatWithAI(`Triage Symptoms: ${JSON.stringify(symptoms)}`, data, [], lang);
  }

  async explainRisk(disease, risk, data, lang = "en") {
    return this.chatWithAI(`Explain ${Math.round(risk * 100)}% risk of ${disease}.`, data, [], lang);
  }

  async getCollaborativeConsensus(data, lang = "en") {
    // This now hits the Backend endpoint which uses Groq for consensus
    try {
        const response = await axios.post(`${API_URL}/api/ai/consensus`, {
            patient_data: data,
            symptoms: data.symptoms || {},
            predictions: data.predictions || {},
            language: lang
        });
        
        if (response.data && response.data.success) {
            return {
                success: true,
                ...response.data
            };
        }
        throw new Error(response.data.error || "Consensus Failed");
    } catch (err) {
        return {
            success: false,
            error: err.message,
            consensus_summary: "Consensus Engine Offline"
        };
    }
  }
}

export default new aiService();
