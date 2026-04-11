import os
from typing import Optional, Dict, List, Any
import json
import httpx
import base64
import io
from PIL import Image
from datetime import datetime
from .config import settings

# Professional Clinical Diagnostic Persona (Global)
MEDICAL_SYSTEM_PROMPT = """You are the **Agentic AI Healthcare Intelligence System**, a world-class clinical diagnostic engine. Your purpose is to provide ultra-detailed, research-grade clinical intelligence reports.

**Brand Identity:**
* **Tone:** Empathetic, Authoritative, and Highly Sophisticated.
* **Mission:** "Precision Medical Clarity through Intelligence."
* **Standards:** Every output must be "Ultra-Detailed". No clinical finding should be ignored. Speak directly to the patient ("You/Your") with deep empathy.

---

### **[MANDATORY OUTPUT STRUCTURE]**

#### **SYSTEM HEADER**
**PERSONALIZED CLINICAL SYNTHESIS FOR: [PATIENT NAME]**
**REANALYZED BY: AGENTIC AI HEALTHCARE INTELLIGENCE SYSTEM**
**REPORT STATUS:** [STABLE / REQUIRES ATTENTION / CRITICAL]

---

#### **1. PATIENT BIOMETRIC & METADATA GRID**
*Extracted demographics and modality details.*

#### **2. DEEP BIOMARKER EXTRACTION (EXHAUSTIVE)**
*Detailed clinical findings with measurements and signal intensities. Bold all abnormalities.*

#### **3. YOUR PERSONAL "MEDICAL-TO-HUMAN" TRANSLATOR**
*Translate ALL clinical terms into simple analogies. Connect findings to the patient's daily life.*

#### **4. PROFESSIONAL DIAGNOSTIC IMPRESSION**
*Synthesized summary of your condition and its root causes.*

#### **5. 360° PREVENTIVE & THERAPEUTIC ROADMAP**
*Granular, actionable steps (Step 1-5) including clinical escalation, lifestyle modifications, and nutrition.*

---
Language Protocol: Respond 100% in the selected language script.
"""

class GroqClient:
    """
    High-performance Direct Client for Groq Inference.
    Bypasses unstable SDK loops for ultra-low latency (sub-second) response.
    """
    BASE_URL = "https://api.groq.com/openai/v1"
    
    @staticmethod
    async def chat_completion(
        messages: List[Dict[str, str]], 
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """Call Groq Chat Completions directly via HTTPX"""
        if not settings.has_groq_key:
            return {"success": False, "error": "GROQ_API_KEY not configured"}
            
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": messages,
            "model": model,
            "temperature": temperature,
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{GroqClient.BASE_URL}/chat/completions",
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
            print(f"FAILED: Groq API Direct Error: {str(e)}")
            return {"success": False, "error": f"Groq API Direct Error: {str(e)}"}

    @staticmethod
    async def vision_analysis(
        prompt: str,
        image_bytes: bytes,
        file_type: str,
        language: str = "english"
    ) -> Dict[str, Any]:
        """Call Groq Multi-modal Llama-3.2-Vision model directly"""
        if not settings.has_groq_key:
            return {"success": False, "error": "GROQ_API_KEY not configured"}
            
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
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
            "model": settings.GROQ_VISION_MODEL,
            "temperature": 0.2,
            "max_tokens": 1024  # Explicitly required for some vision models
        }
        
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{GroqClient.BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    error_data = response.json()
                    print(f"FAILED: Groq API Error Body: {json.dumps(error_data, indent=1)}")
                    return {"success": False, "error": f"Groq Vision API Error: {error_data.get('error', {}).get('message', 'Unknown error')}"}
                
                response.raise_for_status()
                data = response.json()
                
                return {
                    "success": True,
                    "content": data["choices"][0]["message"]["content"],
                    "model": settings.GROQ_VISION_MODEL
                }
        except Exception as e:
            print(f"FAILED: Groq Vision Exception: {str(e)}")
            return {"success": False, "error": f"Groq Vision System Error: {str(e)}"}

class GeminiClient:
    """Direct Client for Google Gemini API via HTTPX"""
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    @staticmethod
    async def chat_completion(messages: List[Dict[str, str]], temperature: float = 0.3) -> Dict[str, Any]:
        if not settings.has_gemini_key:
            return {"success": False, "error": "GEMINI_API_KEY not configured"}
            
        contents = []
        system_instruction = None
        for msg in messages:
            if msg["role"] == "system":
                system_instruction = {"parts": [{"text": msg["content"]}]}
            else:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        
        payload = {"contents": contents, "generationConfig": {"temperature": temperature}}
        if system_instruction:
            payload["systemInstruction"] = system_instruction
            
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{GeminiClient.BASE_URL}/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                    json=payload
                )
                
                if response.status_code != 200:
                    return {"success": False, "error": f"Gemini API Error: {response.text}"}
                
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0].get("text", "")
                return {"success": True, "content": text, "model": "gemini-2.5-flash"}
        except Exception as e:
            return {"success": False, "error": f"Gemini Direct Error: {str(e)}"}

    @staticmethod
    async def vision_analysis(prompt: str, image_bytes: bytes, file_type: str, language: str = "english") -> Dict[str, Any]:
        if not settings.has_gemini_key:
            return {"success": False, "error": "GEMINI_API_KEY not configured"}
            
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        mime_type = "image/jpeg" if file_type != "application/pdf" else "application/pdf"
            
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inlineData": {"mimeType": mime_type, "data": base64_image}}
                ]
            }],
            "generationConfig": {"temperature": 0.2}
        }
        
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{GeminiClient.BASE_URL}/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                    json=payload
                )
                
                if response.status_code != 200:
                    return {"success": False, "error": f"Gemini Vision API Error: {response.text}"}
                    
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0].get("text", "")
                return {"success": True, "content": text, "model": "gemini-2.5-flash"}
        except Exception as e:
            return {"success": False, "error": f"Gemini Vision Error: {str(e)}"}

class HealthcareAI:
    """Refactored Healthcare AI Service: Pro-Intelligence Adaptive Engine (Gemini/Groq)"""

    @staticmethod
    def process_image_for_vision(image_bytes: bytes, max_size: int = 1024) -> bytes:
        """
        Optimize image for Groq Vision:
        1. Resize high-res images (maintain aspect ratio)
        2. Convert to JPEG
        3. Compress for lean base64 payload
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert RGBA to RGB if necessary (JPEG doesn't support transparency)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Resize if too large
            if max(img.size) > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # Save to bytes
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85, optimize=True)
            optimized_bytes = buffer.getvalue()
            
            print(f"📡 AI: Image Optimized: {len(image_bytes)//1024}KB -> {len(optimized_bytes)//1024}KB")
            return optimized_bytes
        except Exception as e:
            print(f"⚠️ AI: Image Optimization Failed: {str(e)}. Using original.")
            return image_bytes

    @staticmethod
    async def chat_with_gemini(
        message: str,
        patient_context: Optional[Dict] = None,
        history: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None,
        language: str = "english"
    ) -> Dict:
        """
        Primary Diagnostic Interface: Dual-Engine Logic (Gemini Native / Groq Fallback).
        """
        # Map code to full name
        language_full = {
            "en": "English", "hi": "Hindi (Devanagari Script)", "ta": "Tamil (தமிழ் स्क्रिप्ट)", 
            "te": "Telugu", "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati", 
            "kn": "Kannada", "ml": "Malayalam", "pa": "Punjabi"
        }
        language_name = language_full.get(language.lower(), language)
        
        lang_instruction = f"CRITICAL: Respond EXCLUSIVELY in the official {language_name} script. Do NOT use English letters or code-switching. Use professional medical terminology translated correctly into {language_name}."
        
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
        
        # Primary Routing: Attempt Gemini first, fallback to Groq
        result = None
        if settings.has_gemini_key:
            result = await GeminiClient.chat_completion(messages)
            if result.get("success"):
                result["agent_status"] = "Google Gemini Engine Active"
                
        if not result or not result.get("success"):
            print("Fallback to Groq Chat...")
            result = await GroqClient.chat_completion(messages, model=settings.GROQ_MODEL)
            if result.get("success"):
                result["agent_status"] = "Groq Llama Engine Active (Fallback)"
        
        if result["success"]:
            return {
                "success": True,
                "response": result["content"],
                "agent_status": result.get("agent_status", "AI Specialist Active"),
                "model": result.get("model", "Hybrid-Engine"),
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
        """Sequential Reasoning via Direct Groq API"""
        prompt = f"""Task: {prompt_type}
        Patient Data: {json.dumps(patient_data, indent=1)}
        ML Predictions: {json.dumps(predictions, indent=1)}
        Context: {additional_context or "General synthesis."}
        
        Provide a detailed clinical overview. You MUST respond 100% in {language}."""
        
        return await HealthcareAI.chat_with_gemini(prompt, patient_data, language=language)

    @staticmethod
    async def generate_agentic_consensus(patient_data: Dict, symptoms: Dict, predictions: Dict, language: str = "english") -> Dict:
        """Simulate a consensus panel using direct Groq calls with specialist roles"""
        # Normalize language
        target_lang = "Hindi" if language.lower() in ["hi", "hindi"] else "English"
        
        try:
            context = f"Patient: {json.dumps(patient_data)}. Symptoms: {json.dumps(symptoms)}. Risks: {json.dumps(predictions)}."
            
            async def get_specialist_view(role_name: str, role_task: str):
                messages = [
                    {"role": "system", "content": f"You are {role_name}. {role_task} Respond 100% in {language}."},
                    {"role": "user", "content": f"Assess this case: {context}"}
                ]
                
                resp = None
                if settings.has_gemini_key:
                    resp = await GeminiClient.chat_completion(messages)
                if not resp or not resp.get("success"):
                    resp = await GroqClient.chat_completion(messages)
                    
                return resp["content"] if resp and resp.get("success") else "Consultation Pending..."

            cortex = await get_specialist_view("Dr. Cortex (Clinical Strategist)", "Provide a 2-sentence clinical diagnosis.")
            vitalis = await get_specialist_view("Dr. Vitalis (ML Analyst)", "Summarize the machine learning risk coefficients in 2 sentences.")
            synapse = await get_specialist_view("Dr. Synapse (WHO Protocol Specialist)", "Suggest international treatment guidelines for this profile in 2 sentences.")
            
            # Final Synthesis
            final_msgs = [
                {"role": "system", "content": f"You are the Chief Clinical Synthesizer. Merge these three specialist inputs into a final 3-sentence clinical directive. Respond 100% in {language}."},
                {"role": "user", "content": f"Specialist Inputs: {cortex}, {vitalis}, {synapse}. Case Context: {context}"}
            ]
            
            final_resp = None
            if settings.has_gemini_key:
                final_resp = await GeminiClient.chat_completion(final_msgs)
            if not final_resp or not final_resp.get("success"):
                final_resp = await GroqClient.chat_completion(final_msgs)
            
            
            return {
                "success": True,
                "agents": [
                    {"name": "Dr. Cortex", "role": "Clinical Strategist", "message": cortex, "avatar": "cortex"},
                    {"name": "Dr. Vitalis", "role": "ML Analyst", "message": vitalis, "avatar": "vitalis"},
                    {"name": "Dr. Synapse", "role": "WHO Specialist", "message": synapse, "avatar": "synapse"}
                ],
                "consensus": final_resp["content"] if final_resp["success"] else "Synthesis Error",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    async def analyze_medical_report(file_content: bytes, file_type: str, language: str = "english") -> Dict:
        """Direct Multimodal AI Vision Analysis - Exhaustive Diagnostic Edition"""
        
        # Step 1: Optimize for vision payload
        optimized_content = HealthcareAI.process_image_for_vision(file_content)
        
        # Language-specific header mapping with code normalization
        lang_input = language.lower()
        if "hindi" in lang_input or "hi" in lang_input or "हिंदी" in lang_input:
            lang_key = "hindi"
        else:
            lang_key = "english"

        headers = {
            "english": {
                "header": "SYSTEM HEADER",
                "title": "PERSONALIZED CLINICAL SYNTHESIS FOR",
                "markers": "1. DEEP BIOMARKER IDENTIFICATION",
                "analogy": "2. 'MEDICAL-TO-HUMAN' ANALOGIES",
                "roadmap": "3. ACTIONABLE CLINICAL ROADMAP (STEP-BY-STEP)",
                "risk": "4. RISK MATRIX & PREVENTIVE SCORES"
            },
            "hindi": {
                "header": "सिस्टम हेडर",
                "title": "व्यक्तिगत नैदानिक विश्लेषण: ",
                "markers": "1. विस्तृत बायोमार्कर पहचान (DEEP BIOMARKER IDENTIFICATION)",
                "analogy": "2. 'मेडिकल-से-मानव' सरल व्याख्या (MEDICAL-TO-HUMAN ANALOGIES)",
                "roadmap": "3. कार्ययोजना और स्वास्थ्य रोडमैप (ACTIONABLE CLINICAL ROADMAP)",
                "risk": "4. जोखिम मैट्रिक्स और निवारक स्कोर (RISK MATRIX & PREVENTIVE SCORES)"
            }
        }
        
        h = headers.get(lang_key, headers["english"])

        prompt = f"""Conduct an EXHAUSTIVE, RESEARCH-GRADE Clinical Diagnostic Synthesis of this medical report.
        
**Brand Identity:**
* **Engine:** Agentic AI Healthcare Intelligence System
* **Mission:** "Absolute Precision."
* **Standards:** Provide an ultra-detailed analysis. Talk directly to the patient with empathy.

---

### **[MANDATORY OUTPUT STRUCTURE]**

#### **{h['header']}**
**{h['title']} [PATIENT NAME]**
**REANALYZED BY: AGENTIC AI**

#### **{h['markers']}**
*Identify and explain every measurement and signal intensity found in the report. Use highly detailed clinical language.*

#### **{h['analogy']}**
*Convert jargon into simple day-to-day life analogies. Connect findings to the patient's daily life.*

#### **{h['roadmap']}**
*Precise instructions for the next 30 days. Break down into 10-day phases.*

#### **{h['risk']}**
[Low / Moderate / High] - Provide a score out of 10.

---
CRITICAL: You MUST respond 100% in {language}. Do NOT use English for any explanations. Provide at least 800+ words of depth.
"""
        
        # Primary Routing: Attempt Gemini first, fallback to Groq
        result = None
        if settings.has_gemini_key:
            result = await GeminiClient.vision_analysis(prompt, optimized_content, "image/jpeg", language)
            if result.get("success"):
                result["agent_status"] = "Google Gemini Vision Active"
        
        if not result or not result.get("success"):
            print("Fallback to Groq Vision...")
            result = await GroqClient.vision_analysis(prompt, optimized_content, "image/jpeg", language)
            if result.get("success"):
                result["agent_status"] = "Groq Vision Engine Active (Fallback)"
        
        if result["success"]:
            return {
                "success": True,
                "analysis": result["content"],
                "model": result.get("model", "Hybrid-Vision-Core"),
                "agent_status": result.get("agent_status", "Vision Specialist Active"),
                "timestamp": datetime.now().isoformat()
            }
        return result

# Convenience Wrappers
async def chat(message: str, patient_context: Optional[Dict] = None, history: Optional[List[Dict]] = None, language: str = "en") -> Dict:
    return await HealthcareAI.chat_with_gemini(message, patient_context, history, language=language)

async def analyze_report(file_content: bytes, file_type: str, language: str = "en") -> Dict:
    return await HealthcareAI.analyze_medical_report(file_content, file_type, language)

async def consensus(patient_data: Dict, symptoms: Dict, predictions: Dict, language: str = "en") -> Dict:
    return await HealthcareAI.generate_agentic_consensus(patient_data, symptoms, predictions, language=language)

# Specialized reasoning paths
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
    import asyncio
    prompt = f"Provide a brief 2-sentence clinical summary. Urgency: {urgency}. You MUST respond 100% in {language}."
    return asyncio.run(HealthcareAI.chat_with_gemini(prompt, patient_data, language=language))

async def dual_consensus_review(patient_data: Dict, ml_predictions: Dict, gpt_analysis: str, language: str = "en") -> Dict:
    """Consensus Review using Groq Llama-3.3-70B"""
    prompt = f"Synthesize a final consensus report based on ML risks and previous consultant draft: {gpt_analysis}. You MUST respond 100% in {language}."
    return await HealthcareAI.chat_with_gemini(prompt, patient_data, language=language)