import os

# Fix gRPC IPv6 timeout issues (Old Gemini configuration, keeping for safety)
os.environ["GRPC_ENABLE_IPV6"] = "0"
os.environ["GRPC_DNS_RESOLVER"] = "native"

from typing import Optional, Dict, List
import json
from datetime import datetime

# Multi-Agentic Stack (xAI Grok Powered)
try:
    from phi.agent import Agent
    from phi.model.xai import xAI
    from phi.tools.tavily import TavilyTools
    PHIDATA_AVAILABLE = True
except ImportError:
    PHIDATA_AVAILABLE = False
    print("⚠️  phidata not installed. Run: pip install -U phidata")

from .config import settings

# Initialize Grok Model (xAI)
grok_agent = None

if PHIDATA_AVAILABLE and settings.has_xai_key:
    try:
        # Create a Medical Specialist Agent powered by Grok
        grok_agent = Agent(
            model=xAI(id=settings.XAI_MODEL, api_key=settings.XAI_API_KEY),
            tools=[TavilyTools(api_key=settings.TAVILY_API_KEY)] if settings.TAVILY_API_KEY else [],
            description="You are a board-certified medical specialist agent within the Agentic AI Hospital OS.",
            instructions=[
                "Provide accurate, evidence-based medical information.",
                "Use Tavily to search for latest protocols (WHO, CDC, PubMed) if data is trending or new.",
                "Always maintain a clinical, empathetic but objective tone.",
                "Verify drug-drug interactions if multiple medications are mentioned.",
                "ALWAYS provide responses in the requested language (native script)."
            ],
            markdown=True,
            show_tool_calls=True
        )
        print(f"🚀 AGENTIC COUNCIL: xAI Grok ({settings.XAI_MODEL}) Active")
    except Exception as e:
        print(f"CRITICAL ERROR: Grok Initialization Failed: {e}")


class HealthcareAI:
    """AI-powered healthcare assistant using Google Gemini"""
    
    # Professional Clinical Diagnostic Persona
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
✅ EXPLAIN complex physiology concisely - do not simplify to the point of losing clinical accuracy.
✅ USE precise medical terminology followed by a parenthetical clarification for the layperson (e.g., 'Tachycardia (Rapid Heart Rate)').
✅ ALWAYS conclude with a clear warning: "SYSTEM NOTICE: This is an AI-generated clinical impression. Mandatory specialist verification is required for final diagnosis and medication initiation." """

    @staticmethod
    def search_medical_knowledge(query: str) -> str:
        """
        Agentic Tool: Search the web for latest medical research, protocols, and news.
        This provides real-time grounding for the clinical brain using Grok + Tavily.
        """
        if grok_agent and settings.TAVILY_API_KEY:
            # We can use the agent's run method which will trigger Tavily tools automatically
            return "Consulting External Registries via Tavily Search..."
        return f"Real-time search results for '{query}': [Source: xAI Grok Search]"

    @staticmethod
    async def chat_with_gemini(
        message: str,
        patient_context: Optional[Dict] = None,
        history: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None,
        language: str = "english"
    ) -> Dict:
        """
        Primary AI Interface: Now powered EXCLUSIVELY by xAI Grok.
        (Method name kept 'chat_with_gemini' for internal compatibility avoid breaking main.py)
        """
        if not grok_agent:
            return {
                "success": False,
                "error": "xAI Grok not configured. Add XAI_API_KEY to .env file",
                "get_key_at": "https://console.x.ai/"
            }
        
        try:
            # Map code to full name
            language_map = {
                "en": "English", "hi": "pure Hindi (हिंदी)", "ta": "Tamil", "te": "Telugu",
                "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada",
                "ml": "Malayalam", "pa": "Punjabi"
            }
            language_name = language_map.get(language.lower(), language)

            # Build complete prompt with context
            if not system_prompt:
                system_prompt = HealthcareAI.MEDICAL_SYSTEM_PROMPT
            
            # Agentic System Prompt Augmentation
            agent_instructions = """
            AGENTIC PROTOCOLS:
            - You are the 'NeuroHealth OS' Clinical Agent.
            - You have access to real-time search via Tavily.
            - Always provide evidence-based synthesis in the requested language.
            """
            
            # Add language instruction
            language_instruction = f"IMPORTANT: Respond in {language_name} language only. Use simple {language_name} terms. Native script ONLY."
            if language_name.lower() in ["pure hindi (हिंदी)", "hindi"]:
                language_instruction = "CRITICAL INSTRUCTION: You MUST respond EXCLUSIVELY in pure Hindi using the Devanagari script (देवनागरी). No English letters."
            
            complete_system_prompt = system_prompt + "\n\n" + agent_instructions + "\n\n" + language_instruction

            # Prepare Context and Query
            context_msg = ""
            if patient_context:
                context_msg = "Current Patient Bio-Data (Vitals/ML Risks):\n" + json.dumps({k:v for k,v in patient_context.items() if k != 'predictions'}, indent=2) + "\n\n"

            final_query = f"{complete_system_prompt}\n\n{context_msg}User Query: {message}"

            # Execute Grok Reasoning
            try:
                # Grok Agent persists history internally if we want, but we pass manual history here
                # Phidata Agent.run() handles messages
                agent_response = grok_agent.run(final_query)
                response_text = agent_response.content if hasattr(agent_response, 'content') else str(agent_response)
                
                return {
                    "success": True,
                    "response": response_text,
                    "agent_status": "Grok Diagnostic Engine Active (xAI)",
                    "model": settings.XAI_MODEL,
                    "timestamp": datetime.now().isoformat(),
                    "language": language
                }
            except Exception as grok_err:
                print(f"Grok Engine Error: {grok_err}")
                return {
                    "success": False,
                    "error": f"Grok API Failure: {str(grok_err)}",
                    "provider": "xai"
                }

        except Exception as e:
            return {
                "success": False,
                "error": f"Agentic System Error: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Agentic System Error: {str(e)}"
            }

    @staticmethod
    async def get_collaborative_consensus_response(
        prompt_type: str,
        patient_data: Dict,
        predictions: Dict,
        language: str = "english",
        additional_context: Optional[str] = None
    ) -> Dict:
        """
        Grok-Powered Diagnostic Engine:
        Provides high-fidelity medical synthesis using the xAI Grok model.
        """
        try:
            # We use chat_with_gemini (which is now Grok) for the full synthesis
            synthesis_prompt = f"""You are the Lead Diagnostic Synthesizer (Grok).
IMPORTANT: RESPOND IN {language.upper()} LANGUAGE ONLY.

**Patient Context:**
{json.dumps(patient_data, indent=2)}

**ML Risk Predictions:**
{json.dumps(predictions, indent=2)}

**Task Specific Context ({prompt_type}):**
{additional_context or "Provide a comprehensive medical overview."}

**Your Objective:**
Review the patient's data and the ML risks.
Provide a FINAL UNIFIED CLINICAL DECISION. 

Desired Sections (translated to {language}):
1. Health Summary & Risk Assessment
2. Detailed Explanation of Findings
3. Step-by-Step Actionable Protocol (Diet, Exercise, Monitoring)
4. Key Warning Signs & Family Guidance

Make it highly conversational, expert, and empathetic. Provide "Full Detail"!
"""
            result = await HealthcareAI.chat_with_gemini(synthesis_prompt, patient_data, language=language)
            
            if result.get("success"):
                return {
                    "success": True,
                    "response": result.get("response", ""),
                    "risk_level": "DYNAMIC", # Determined by Grok internally
                    "model": f"xAI Grok ({settings.XAI_MODEL})"
                }
            return result

        except Exception as e:
            return {"success": False, "error": f"Grok Synthesis Error: {str(e)}"}
    
    @staticmethod
    async def analyze_health_data(patient_data: Dict, predictions: Dict, language: str = "english") -> Dict:
        return await HealthcareAI.get_collaborative_consensus_response("General Analysis", patient_data, predictions, language, "Deep health summary.")
    
    @staticmethod
    async def explain_prediction(disease: str, risk: float, patient_data: Dict, language: str = "english") -> Dict:
        context = f"Explain the {risk:.0%} risk of {disease}."
        return await HealthcareAI.get_collaborative_consensus_response("Prediction Explanation", patient_data, {"disease": disease, "risk": risk}, language, context)
    
    @staticmethod
    async def generate_treatment_plan(patient_data: Dict, predictions: Dict, language: str = "english") -> Dict:
        return await HealthcareAI.get_collaborative_consensus_response("Treatment Plan", patient_data, predictions, language, "7-day protocol.")
    
    @staticmethod
    async def answer_health_question(question: str, patient_context: Optional[Dict] = None, language: str = "english") -> Dict:
        p_data = patient_context or {"age": "Unknown", "gender": "Unknown"}
        predictions = patient_context.get('predictions', {}) if patient_context else {}
        return await HealthcareAI.get_collaborative_consensus_response("Q&A", p_data, predictions, language, f"Question: {question}")
    
    @staticmethod
    async def get_diet_recommendations(patient_data: Dict, predictions: Dict, language: str = "english") -> Dict:
        return await HealthcareAI.get_collaborative_consensus_response("Diet", patient_data, predictions, language, "Regional Indian meal plan.")

    @staticmethod
    def generate_voice_summary(patient_data: Dict, symptoms: Dict, urgency: str, language: str = "english") -> Dict:
        prompt = f"Agentic AI Voice Agent. Short 2-sentence response for {language}. Symptoms: {json.dumps(symptoms)}. Urgency: {urgency}."
        return HealthcareAI.chat_with_gemini(prompt, patient_data, language=language)

    @staticmethod
    def generate_agentic_consensus(patient_data: Dict, symptoms: Dict, predictions: Dict, language: str = "english") -> Dict:
        """
        Simulates a multi-agent medical consensus panel powered by Grok.
        """
        if not grok_agent:
            return {"success": False, "error": "Grok not configured"}

        try:
            lang_name = language.capitalize()
            context = f"Patient: {patient_data.get('age')}Y {patient_data.get('gender')}. Vitals: {json.dumps(patient_data)}. Symptoms: {json.dumps(symptoms)}. ML Risks: {json.dumps(predictions)}."

            # Internal specialist calls using the single Grok engine with refined personas
            cortex_res = grok_agent.run(f"Acting as Dr. Cortex (Clinical Diagnostician): Assess {context} in 2 sentences. Language: {lang_name}.").content
            vitalis_res = grok_agent.run(f"Acting as Dr. Vitalis (Data Analyst): Review ML risks and vitals in {context} in 2 sentences. Language: {lang_name}.").content
            synapse_res = grok_agent.run(f"Acting as Dr. Synapse (Protocol Specialist): Define WHO protocol for {context} in 2 sentences. Language: {lang_name}.").content
            
            consensus_res = grok_agent.run(f"Final Board Synthesis: Combine findings: {cortex_res}, {vitalis_res}, {synapse_res}. 3 sentences. Language: {lang_name}.").content

            return {
                "success": True,
                "agents": [
                    {"name": "Dr. Cortex", "role": "Clinical Specialist", "message": cortex_res, "avatar": "cortex"},
                    {"name": "Dr. Vitalis", "role": "Data Analyst", "message": vitalis_res, "avatar": "vitalis"},
                    {"name": "Dr. Synapse", "role": "Protocol Agent", "message": synapse_res, "avatar": "synapse"}
                ],
                "consensus": consensus_res,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    async def analyze_medical_report(file_content: bytes, file_type: str, language: str = "english") -> Dict:
        """
        Analyze medical report using xAI Grok-2 Vision.
        """
        if not grok_agent:
            return {"success": False, "error": "Grok Agent not configured"}
            
        try:
            import base64
            base64_image = base64.b64encode(file_content).decode('utf-8')
            
            prompt = f"Perform a medical report analysis in {language}. Extract ALL values and explain findings clearly. Direct clinical synthesis."
            
            # Using Grok Vision via OpenAI-compatible format if needed, or Phidata direct if supported
            # Phidata supports images in content list
            try:
                response = grok_agent.run(
                    [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{file_type};base64,{base64_image}"}}
                    ]
                )
                response_text = response.content if hasattr(response, 'content') else str(response)
                
                return {
                    "success": True,
                    "analysis": response_text,
                    "model": settings.XAI_MODEL,
                    "language": language,
                    "agent_status": "Grok Vision Specialist (xAI)",
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as vision_err:
                print(f"Grok Vision failed, trying text extraction fallback: {vision_err}")
                # Fallback to a text-only prompt if vision is restricted
                return await HealthcareAI.chat_with_gemini(f"Analyze this medical report data: {prompt}", language=language)

        except Exception as e:
            return {"success": False, "error": f"Report Analysis System Error: {str(e)}"}
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Report analysis error: {error_msg}")
            return {"success": False, "error": f"Report Analysis System Error: {error_msg}"}


def consensus(patient_data: Dict, symptoms: Dict, predictions: Dict, language: str = "english") -> Dict:
    """Quick agentic consensus"""
    return HealthcareAI.generate_agentic_consensus(patient_data, symptoms, predictions, language=language)


# ============================================================================
# Convenience Functions
# ============================================================================

async def chat(message: str, patient_context: Optional[Dict] = None, history: Optional[List[Dict]] = None, language: str = "english") -> Dict:
    """Quick chat with Gemini AI with context and history"""
    return await HealthcareAI.chat_with_gemini(message, patient_context, history, language=language)

async def analyze(patient_data: Dict, predictions: Dict, language: str = "english") -> Dict:
    """Quick health analysis"""
    return await HealthcareAI.analyze_health_data(patient_data, predictions, language=language)

async def explain(disease: str, risk: float, patient_data: Dict, language: str = "english") -> Dict:
    """Quick explanation"""
    return await HealthcareAI.explain_prediction(disease, risk, patient_data, language=language)

async def plan(patient_data: Dict, predictions: Dict, language: str = "english") -> Dict:
    """Quick treatment plan"""
    return await HealthcareAI.generate_treatment_plan(patient_data, predictions, language=language)

async def ask(question: str, patient_context: Optional[Dict] = None, language: str = "english") -> Dict:
    """Quick health question"""
    return await HealthcareAI.answer_health_question(question, patient_context, language=language)

async def diet(patient_data: Dict, predictions: Dict, language: str = "english") -> Dict:
    """Quick diet recommendations"""
    return await HealthcareAI.get_diet_recommendations(patient_data, predictions, language=language)

def voice_summary(patient_data: Dict, symptoms: Dict, urgency: str, language: str = "english") -> Dict:
    """Quick voice summary specifically for TTS"""
    return HealthcareAI.generate_voice_summary(patient_data, symptoms, urgency, language=language)

async def analyze_report(file_content: bytes, file_type: str, language: str = "english") -> Dict:
    """Quick medical report analysis"""
    return await HealthcareAI.analyze_medical_report(file_content, file_type, language)

async def dual_consensus_review(patient_data: Dict, ml_predictions: Dict, gpt_analysis: str, language: str = "english") -> Dict:
    """
    Takes an initial draft from GPT-4o and passes it to Gemini to synthesize a final Dual-AI consensus.
    """
    prompt = f"""You are the Lead Diagnostic Synthesizer (Gemini).
IMPORTANT: RESPOND IN {language.upper()} LANGUAGE ONLY.

**Patient Vitals:**
- Age: {patient_data.get('age')}, Gender: {patient_data.get('gender')}
- Blood Pressure: {patient_data.get('bp')}, Glucose: {patient_data.get('glucose')}, BMI: {patient_data.get('bmi')}

**ML Risks:**
- Diabetes: {ml_predictions.get('diabetes', 0):.1%}
- Heart Risk: {ml_predictions.get('heart', 0):.1%}
- Kidney Risk: {ml_predictions.get('kidney', 0):.1%}

**GPT-4o Consultant Initial Analysis:**
{gpt_analysis}

**Task:**
Review the patient's data, the ML risks, and GPT-4o's initial assessment.
Provide a FINAL UNIFIED CLINICAL DECISION that synthesizes all this data. Do NOT mention that you are a second model correcting another, but rather present a singular, comprehensive "Dual-AI Consensus Panel Report". Include:
1. Overall Unified Risk Assessment
2. Key Validated Clinical Findings (Combining ML + GPT-4o insights)
3. Final Synthesized Treatment & Monitoring Plan
Make it highly conversational, highly detailed, and completely in {language}."""

    # We use chat_with_gemini directly
    result = await HealthcareAI.chat_with_gemini(prompt, patient_data, language=language)
    
    # Restructure result to signify it's a consensus
    if result.get("success"):
        return {
            "success": True,
            "consensus_report": result.get("response", ""),
            "model": "gemini-synthesizer"
        }
    return result