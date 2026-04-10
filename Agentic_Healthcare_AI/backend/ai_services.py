import os
from typing import Optional, Dict, List, Any
import json
import httpx
import base64
from datetime import datetime
from .config import settings

# Professional Clinical Diagnostic Persona (Global)
MEDICAL_SYSTEM_PROMPT = """You are a Board-Certified Senior Medical Specialist within the Agentic AI Hospital OS.
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
✅ EXPLAIN complex physiology concisely.
✅ USE precise medical terminology followed by a parenthetical clarification.
✅ ALWAYS conclude with: "SYSTEM NOTICE: This is an AI-generated clinical impression. Mandatory specialist verification is required." """

class GrokClient:
    """
    High-performance Direct Client for xAI Grok.
    Bypasses unstable Phidata/OpenAI SDK loops for 100% stability.
    """
    BASE_URL = "https://api.x.ai/v1"
    
    @staticmethod
    async def chat_completion(
        messages: List[Dict[str, str]], 
        model: str = "grok-2",
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """Call Grok-2 Chat Completions directly via HTTPX"""
        if not settings.has_xai_key:
            return {"success": False, "error": "XAI_API_KEY not configured"}
            
        headers = {
            "Authorization": f"Bearer {settings.XAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": messages,
            "model": model,
            "temperature": temperature,
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{GrokClient.BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "success": True,
                    "content": data["choices"][0]["message"]["content"],
                    "model": data.get("model", model),
                    "usage": data.get("usage", {})
                }
        except Exception as e:
            print(f"❌ Grok API Direct Error: {str(e)}")
            return {"success": False, "error": f"Grok API Direct Error: {str(e)}"}

    @staticmethod
    async def vision_analysis(
        prompt: str,
        image_bytes: bytes,
        file_type: str,
        language: str = "english"
    ) -> Dict[str, Any]:
        """Call Grok-2-vision directly using Base64 image encoding"""
        if not settings.has_xai_key:
            return {"success": False, "error": "XAI_API_KEY not configured"}
            
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        headers = {
            "Authorization": f"Bearer {settings.XAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{file_type};base64,{base64_image}"
                        }
                    }
                ]
            }
        ]
        
        payload = {
            "messages": messages,
            "model": "grok-2-vision-1212", # Using latest Grok Vision model
            "temperature": 0.2
        }
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{GrokClient.BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "success": True,
                    "content": data["choices"][0]["message"]["content"],
                    "model": "grok-2-vision"
                }
        except Exception as e:
            print(f"❌ Grok Vision Direct Error: {str(e)}")
            return {"success": False, "error": f"Grok Vision Error: {str(e)}"}

class HealthcareAI:
    """Refactored Healthcare AI Service: Exclusive Direct Grok Integration"""

    @staticmethod
    async def chat_with_gemini(
        message: str,
        patient_context: Optional[Dict] = None,
        history: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None,
        language: str = "english"
    ) -> Dict:
        """
        Primary Diagnostic Interface: Direct Grok API Logic.
        """
        # Map code to full name
        language_map = {
            "en": "English", "hi": "pure Hindi (हिंदी)", "ta": "Tamil", "te": "Telugu",
            "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada",
            "ml": "Malayalam", "pa": "Punjabi"
        }
        language_name = language_map.get(language.lower(), language)
        
        lang_instruction = f"IMPORTANT: Respond in {language_name} language only. Use simple {language_name} terms. Native script ONLY."
        if language_name.lower() in ["pure hindi (हिंदी)", "hindi"]:
            lang_instruction = "CRITICAL: You MUST respond EXCLUSIVELY in pure Hindi using the Devanagari script. No English letters."
        
        full_sys_prompt = (system_prompt or MEDICAL_SYSTEM_PROMPT) + "\n\n" + lang_instruction
        
        messages = [{"role": "system", "content": full_sys_prompt}]
        
        # Add history if present
        if history:
            for msg in history[-5:]: # Keep last 5 messages for context
                messages.append({
                    "role": "assistant" if msg.get("role") == "assistant" else "user",
                    "content": msg.get("content", "")
                })
        
        # Add current context
        context_str = ""
        if patient_context:
            context_str = f"Patient Context: {json.dumps({k:v for k,v in patient_context.items() if k != 'predictions'}, indent=1)}\n\n"
        
        messages.append({"role": "user", "content": f"{context_str}Query: {message}"})
        
        result = await GrokClient.chat_completion(messages, model=settings.XAI_MODEL)
        
        if result["success"]:
            return {
                "success": True,
                "response": result["content"],
                "agent_status": "Grok Diagnostic Engine Active (Direct)",
                "model": result["model"],
                "timestamp": datetime.now().isoformat(),
                "language": language
            }
        return result

    @staticmethod
    async def get_collaborative_consensus_response(
        prompt_type: str,
        patient_data: Dict,
        predictions: Dict,
        language: str = "english",
        additional_context: Optional[str] = None
    ) -> Dict:
        """Sequential Reasoning via Direct Grok API"""
        prompt = f"""Task: {prompt_type}
        Patient Data: {json.dumps(patient_data, indent=1)}
        ML Predictions: {json.dumps(predictions, indent=1)}
        Context: {additional_context or "General synthesis."}
        
        Provide a detailed clinical overview in {language}."""
        
        return await HealthcareAI.chat_with_gemini(prompt, patient_data, language=language)

    @staticmethod
    async def generate_agentic_consensus(patient_data: Dict, symptoms: Dict, predictions: Dict, language: str = "english") -> Dict:
        """Simulate a consensus panel using direct Grok calls with role-play"""
        try:
            context = f"Patient: {json.dumps(patient_data)}. Symptoms: {json.dumps(symptoms)}. Risks: {json.dumps(predictions)}."
            
            # Using simple role-play in prompts since we don't need the Phidata "Agent" class wrapper
            async def get_specialist_view(role_name: str, role_task: str):
                resp = await GrokClient.chat_completion([
                    {"role": "system", "content": f"You are {role_name}. {role_task}"},
                    {"role": "user", "content": f"Assess this case: {context}"}
                ])
                return resp["content"] if resp["success"] else "Consultation Pending..."

            cortex = await get_specialist_view("Dr. Cortex (Diagnostician)", "Provide a 2-sentence clinical diagnosis.")
            vitalis = await get_specialist_view("Dr. Vitalis (Data Analyst)", "Summarize the ML risk factors in 2 sentences.")
            synapse = await get_specialist_view("Dr. Synapse (Protocol Specialist)", "Suggest WHO treatment protocol in 2 sentences.")
            
            # Final Synthesis
            final_resp = await GrokClient.chat_completion([
                {"role": "system", "content": "You are the Lead Clinical Synthesizer. Combine these three specialist views into a 3-sentence final decision."},
                {"role": "user", "content": f"Views: {cortex}, {vitalis}, {synapse}. Case: {context}"}
            ])
            
            return {
                "success": True,
                "agents": [
                    {"name": "Dr. Cortex", "role": "Diagnostician", "message": cortex, "avatar": "cortex"},
                    {"name": "Dr. Vitalis", "role": "Data Analyst", "message": vitalis, "avatar": "vitalis"},
                    {"name": "Dr. Synapse", "role": "Protocol Specialist", "message": synapse, "avatar": "synapse"}
                ],
                "consensus": final_resp["content"] if final_resp["success"] else "Synthesis Error",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    async def analyze_medical_report(file_content: bytes, file_type: str, language: str = "english") -> Dict:
        """Direct Grok Vision Analysis"""
        prompt = f"Analyze this medical report in {language}. Extract key values and provide a clinical summary."
        result = await GrokClient.vision_analysis(prompt, file_content, file_type, language)
        
        if result["success"]:
            return {
                "success": True,
                "analysis": result["content"],
                "model": "grok-2-vision",
                "agent_status": "Grok Vision Specialist (Direct)",
                "timestamp": datetime.now().isoformat()
            }
        return result

# Convenience Wrappers (Kept for compatibility with main.py)
async def chat(message: str, patient_context: Optional[Dict] = None, history: Optional[List[Dict]] = None, language: str = "en") -> Dict:
    return await HealthcareAI.chat_with_gemini(message, patient_context, history, language=language)

async def analyze_report(file_content: bytes, file_type: str, language: str = "en") -> Dict:
    return await HealthcareAI.analyze_medical_report(file_content, file_type, language)

async def consensus(patient_data: Dict, symptoms: Dict, predictions: Dict, language: str = "en") -> Dict:
    return await HealthcareAI.generate_agentic_consensus(patient_data, symptoms, predictions, language=language)

# Optional methods for specific paths (All redirect to the Grok reasoning engine)
async def analyze(patient_data: Dict, predictions: Dict, language: str = "en") -> Dict:
    return await HealthcareAI.get_collaborative_consensus_response("Analysis", patient_data, predictions, language)

async def explain(disease: str, risk: float, patient_data: Dict, language: str = "en") -> Dict:
    return await HealthcareAI.get_collaborative_consensus_response("Explanation", patient_data, {"disease": disease, "risk": risk}, language)

async def plan(patient_data: Dict, predictions: Dict, language: str = "en") -> Dict:
    return await HealthcareAI.get_collaborative_consensus_response("Treatment Plan", patient_data, predictions, language)

async def ask(question: str, patient_context: Optional[Dict] = None, language: str = "en") -> Dict:
    return await HealthcareAI.get_collaborative_consensus_response("Q&A", patient_context or {}, {}, language, f"Question: {question}")

async def diet(patient_data: Dict, predictions: Dict, language: str = "en") -> Dict:
    return await HealthcareAI.get_collaborative_consensus_response("Dietary Recommendations", patient_data, predictions, language)

def voice_summary(patient_data: Dict, symptoms: Dict, urgency: str, language: str = "en") -> Dict:
    # Synchronous wrapper for legacy UI voice triggers
    import asyncio
    prompt = f"Summarize case (Urgency: {urgency}) in 2 sentences."
    return asyncio.run(HealthcareAI.chat_with_gemini(prompt, patient_data, language=language))