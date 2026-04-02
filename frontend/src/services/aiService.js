import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuration for AI Council
const DEFAULT_MODEL = "gemini-1.5-flash";
const BACKUP_KEY = "AIzaSyBitVCSzJlSwwaQVrvfx2Qw32flej6yydU";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || BACKUP_KEY;

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
  "en": "English",
  "hi": "pure Hindi (हिंदी)",
  "ta": "Tamil",
  "te": "Telugu",
  "bn": "Bengali",
  "mr": "Marathi",
  "gu": "Gujarati",
  "kn": "Kannada",
  "ml": "Malayalam",
  "pa": "Punjabi"
};

/**
 * Frontend AI Service: Communicates directly with Google Gemini SDK
 * Bypasses backend bottlenecks for 100% stability.
 */
class aiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.models = [
        DEFAULT_MODEL,
        "gemini-1.5-pro",
        "gemini-2.0-flash",
        "gemini-pro"
    ];
  }

  /**
   * Core Chat Engine with model-hopping fallback
   */
  async chatWithAI(message, patientContext = null, history = [], language = "en") {
    const langName = languageMap[language] || "English";
    const languageInstruction = `IMPORTANT: Respond in ${langName} language only. Use simple ${langName} terms.
    If language is Hindi, use ONLY Devanagari script. No Hinglish.`;

    const fullSystemPrompt = MEDICAL_SYSTEM_PROMPT + "\n\n" + languageInstruction;

    let lastError = null;
    
    // Attempt every model in the panel to avoid 429/504
    for (const modelName of this.models) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        
        // Convert history for Gemini SDK
        const geminiHistory = history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        const chat = model.startChat({
          history: geminiHistory,
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.2, // Clinical precision
          },
        });

        const contextMsg = patientContext ? 
            `Patient Bio-Data: ${JSON.stringify(patientContext)}` : "";

        const finalInput = `${fullSystemPrompt}\n\n${contextMsg}\n\nUSER QUERY: ${message}`;
        
        const result = await chat.sendMessage(finalInput);
        const response = await result.response;
        
        return {
          success: true,
          response: response.text(),
          agent_status: `Diagnostic Engine: ${modelName} (Direct-Netlify)`,
          model: modelName
        };
      } catch (err) {
          lastError = err;
          console.warn(`⚠️ Model ${modelName} busy. Trying next...`, err.message);
          if (err.message.includes("429") || err.message.includes("quota") || err.message.includes("deadline")) {
              continue;
          }
          break;
      }
    }

    throw new Error(`AI Council Fully Busy. (Details: ${lastError?.message})`);
  }

  /**
   * Direct Vision Analysis for Medical Reports
   */
  async analyzeReport(file, fileType, language = "en") {
    const langName = languageMap[language] || "English";
    const prompt = `Perform an authoritative clinical analysis of this medical report in ${langName}. 
    Follow the clinical SOAPE structure. Extract vitals, lab values, and primary diagnosis.
    USE CLINICAL MEDICAL TERMINOLOGY.`;

    try {
        // We use the high-speed Flash 1.5 Vision model
        const model = this.genAI.getGenerativeModel({ model: DEFAULT_MODEL });
        
        // Convert Blob/File to base64 for direct transfer
        const base64Data = await this.fileToGenerativePart(file);

        const result = await model.generateContent([
            prompt,
            base64Data
        ]);
        const response = await result.response;

        return {
            success: true,
            analysis: response.text(),
            model: DEFAULT_MODEL,
            agent_status: "Vision Analyst: Flash 1.5 (Netlify)"
        };
    } catch (err) {
        console.error("Vision Error:", err);
        throw err;
    }
  }

  // Helper to convert file contents
  async fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }
}

export default new aiService();
