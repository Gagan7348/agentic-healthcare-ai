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
MEDICAL_SYSTEM_PROMPT = """You are the Senior Chief Medical Consultant of the Agentic AI Hospital OS.
Your role:
- Conduct an **Exhaustive Level 4 Clinical Synthesis** of all patient biomarkers and imaging findings.
- Provide a deep physiological interpretation of findings, explaining the 'Mechanism of Action' for any abnormalities.
- Maintain an authoritative, professional, and empathetic clinical persona.

Strict Output Protocol:
1. **EXHAUSTIVE EXTRACTION**: Identify every single clinical biomarker, signal, and anomaly.
2. **PHYSIOLOGICAL CONTEXT**: Explain what each finding means for the patient's long-term health.
3. **DIFFERENTIAL SUMMARY**: Synthesize the findings into a highly detailed clinical impression.
4. **CHIEF ACTION PLAN**: Provide non-negotiable medical next-steps and preventive roadmaps.

Language Protocol:
- If a native language (e.g., Hindi, Tamil) is selected, you MUST respond **100% in that native script**.
- ZERO English words or letters should be used in the native response. Translate medical terms into clear native equivalents.
- Ensure the tone is 'Prashasnik' (Administrative/Authoritative) and 'Vaigyanik' (Scientific).

ALWAYS conclude with: "SYSTEM NOTICE: This is an exhaustive AI-generated clinical synthesis. Mandatory verification by a human medical specialist is required before intervention." """

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

class HealthcareAI:
    """Refactored Healthcare AI Service: Exclusive Direct Groq Llama Integration"""

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
        Primary Diagnostic Interface: Direct Groq Llama Logic.
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
        
        result = await GroqClient.chat_completion(messages, model=settings.GROQ_MODEL)
        
        if result["success"]:
            return {
                "success": True,
                "response": result["content"],
                "agent_status": "Groq Llama Engine Active (Direct)",
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
        """Sequential Reasoning via Direct Groq API"""
        prompt = f"""Task: {prompt_type}
        Patient Data: {json.dumps(patient_data, indent=1)}
        ML Predictions: {json.dumps(predictions, indent=1)}
        Context: {additional_context or "General synthesis."}
        
        Provide a detailed clinical overview in {language}."""
        
        return await HealthcareAI.chat_with_gemini(prompt, patient_data, language=language)

    @staticmethod
    async def generate_agentic_consensus(patient_data: Dict, symptoms: Dict, predictions: Dict, language: str = "english") -> Dict:
        """Simulate a consensus panel using direct Groq calls with specialist roles"""
        try:
            context = f"Patient: {json.dumps(patient_data)}. Symptoms: {json.dumps(symptoms)}. Risks: {json.dumps(predictions)}."
            
            async def get_specialist_view(role_name: str, role_task: str):
                resp = await GroqClient.chat_completion([
                    {"role": "system", "content": f"You are {role_name}. {role_task}"},
                    {"role": "user", "content": f"Assess this case: {context}"}
                ])
                return resp["content"] if resp["success"] else "Consultation Pending..."

            cortex = await get_specialist_view("Dr. Cortex (Clinical Strategist)", "Provide a 2-sentence clinical diagnosis.")
            vitalis = await get_specialist_view("Dr. Vitalis (ML Analyst)", "Summarize the machine learning risk coefficients in 2 sentences.")
            synapse = await get_specialist_view("Dr. Synapse (WHO Protocol Specialist)", "Suggest international treatment guidelines for this profile in 2 sentences.")
            
            # Final Synthesis
            final_resp = await GroqClient.chat_completion([
                {"role": "system", "content": "You are the Chief Clinical Synthesizer. Merge these three specialist inputs into a final 3-sentence clinical directive."},
                {"role": "user", "content": f"Specialist Inputs: {cortex}, {vitalis}, {synapse}. Case Context: {context}"}
            ])
            
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
        """Direct Groq Llama-4-Scout Vision Analysis (Exhaustive Edition)"""
        
        # Step 1: Optimize for vision payload
        optimized_content = HealthcareAI.process_image_for_vision(file_content)
        
        prompt = f"""Conduct an EXHAUSTIVE Clinical Diagnostic Synthesis of this medical report.
        Target Language: {language}

        REQUIRED SECTIONS (In {language} script):
        1. **PATIENT METRICS**: Extract name, age, and ID if present in extreme detail.
        2. **DETAILED BIOMARKER EXTRACTION**: Identify absolutely ALL anatomical findings, dimensions, and numerical values. Do not miss any detail.
        3. **CLINICAL PHYSIOLOGY (LAYMAN ANALOGIES)**: Explain the physiological meaning of EVERY SINGLE finding. You MUST explain complex medical terms using VERY SIMPLE, everyday analogies (e.g., 'like a water pipe getting clogged' or 'like a pillow losing its cushioning'). Make it understandable for someone with zero medical background.
        4. **SPECIALIST IMPRESSION**: A deep-dive clinical assessment and exact diagnosis.
        5. **PREVENTIVE ROADMAP**: Step-by-step actions, dietary advice, and lifestyle changes for the patient.
        6. **AGENTIC AI IMPACT**: Explain exactly how this analysis connects to the 'Agentic Healthcare AI System'. Mention how this AI analysis prevents diagnostic errors in rural areas, assists ASHA workers in triaging this specific condition, and enables multi-agent clinical consensus.

        CRITICAL INSTRUCTIONS: 
        - Provide AT LEAST 800 - 1000 words of extreme clinical detail. 
        - Be highly descriptive. 
        - DO NOT cut sentences short. 
        - No English letters in native script outputs."""
        
        result = await GroqClient.vision_analysis(prompt, optimized_content, "image/jpeg", language)
        
        if result["success"]:
            return {
                "success": True,
                "analysis": result["content"],
                "model": "llama-3.2-vision",
                "agent_status": "Groq Vision Engine Active (Direct)",
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
    prompt = f"Provide a brief 2-sentence clinical summary. Urgency: {urgency}."
    return asyncio.run(HealthcareAI.chat_with_gemini(prompt, patient_data, language=language))

async def dual_consensus_review(patient_data: Dict, ml_predictions: Dict, gpt_analysis: str, language: str = "en") -> Dict:
    """Consensus Review using Groq Llama-3.3-70B"""
    prompt = f"Synthesize a final consensus report based on ML risks and previous consultant draft: {gpt_analysis}"
    return await HealthcareAI.chat_with_gemini(prompt, patient_data, language=language)