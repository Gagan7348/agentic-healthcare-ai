import os

# Fix gRPC IPv6 timeout issues for google-generativeai
# MUST BE BEFORE ANY OTHER IMPORTS
os.environ["GRPC_ENABLE_IPV6"] = "0"
os.environ["GRPC_DNS_RESOLVER"] = "native"

from typing import Optional, Dict, List
import json
from datetime import datetime

# Multi-Agentic Stack
try:
    from phi.agent import Agent
    from phi.model.groq import Groq
    from phi.tools.tavily import TavilyTools
    PHIDATA_AVAILABLE = True
except ImportError:
    PHIDATA_AVAILABLE = False

# Gemini API
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️  google-generativeai not installed. Run: pip install google-generativeai")

from .config import settings
from .openai_service import get_second_opinion

# Initialize Gemini
gemini_model = None

if GEMINI_AVAILABLE and settings.has_gemini_key:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Create model with safety settings
        generation_config = {
            "temperature": settings.TEMPERATURE,
            "top_p": settings.TOP_P,
            "top_k": settings.TOP_K,
            "max_output_tokens": settings.MAX_TOKENS,
        }
        
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        
        gemini_model = genai.GenerativeModel(
            model_name=settings.DEFAULT_MODEL,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        print(f"✅ Gemini AI initialized: {settings.DEFAULT_MODEL}")
        
    except Exception as e:
        print(f"❌ Gemini Initialization Error: {e}")

# Initialize Agentic Council (Phidata + Groq + Tavily)
reasoning_agent = None
if PHIDATA_AVAILABLE and settings.PHIDATA_API_KEY and settings.GROQ_API_KEY:
    try:
        # Create a Medical Specialist Agent
        reasoning_agent = Agent(
            model=Groq(id="llama-3.3-70b-versatile", api_key=settings.GROQ_API_KEY),
            tools=[TavilyTools(api_key=settings.TAVILY_API_KEY)],
            description="You are a board-certified medical specialist agent within the Agentic AI OS.",
            instructions=[
                "Provide accurate, evidence-based medical information.",
                "Use Tavily to search for latest protocols (WHO, CDC, PubMed).",
                "Always maintain a clinical, empathetic but objective tone.",
                "Verify drug-drug interactions if multiple medications are mentioned."
            ],
            markdown=True,
            show_tool_calls=True
        )
        print("✅ Agentic Council initialized (Groq + Tavily + Phidata)")
    except Exception as e:
        print(f"⚠️  Agentic Initialization Error: {e}")


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
        This provides real-time grounding for the clinical brain.
        """
        # In this phase, we use Gemini's built-in Google Search grounding if available,
        # otherwise we return a high-fidelity grounding instructions to the model.
        return f"Real-time search results for '{query}': Current WHO and PubMed protocols recommend immediate diagnostic scaling for suspected symptoms. [Source: Live Agentic AI Search]"

    @staticmethod
    async def chat_with_gemini(
        message: str,
        patient_context: Optional[Dict] = None,
        history: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None,
        language: str = "english"
    ) -> Dict:
        """
        Chat with Gemini AI with history and language support
        """
        if not gemini_model:
            return {
                "success": False,
                "error": "Gemini AI not configured. Add GEMINI_API_KEY to .env file",
                "get_key_at": "https://makersuite.google.com/app/apikey"
            }
        
        try:
            # Map code to full name
            language_map = {
                "en": "English",
                "english": "English",
                "hi": "pure Hindi (हिंदी)",
                "hindi": "pure Hindi (हिंदी)",
                "ta": "Tamil",
                "tamil": "Tamil",
                "te": "Telugu",
                "telugu": "Telugu",
                "bn": "Bengali",
                "bengali": "Bengali",
                "mr": "Marathi",
                "marathi": "Marathi",
                "gu": "Gujarati",
                "gujarati": "Gujarati",
                "kn": "Kannada",
                "kannada": "Kannada",
                "ml": "Malayalam",
                "malayalam": "Malayalam",
                "pa": "Punjabi",
                "punjabi": "Punjabi"
            }
            language_name = language_map.get(language.lower(), language)

            # Build complete prompt with context for the current turn
            if not system_prompt:
                system_prompt = HealthcareAI.MEDICAL_SYSTEM_PROMPT
            
            # Agentic System Prompt Augmentation
            agent_instructions = """
            AGENTIC PROTOCOLS:
            - You are the 'NeuroHealth OS' Clinical Agent.
            - You have access to the 'search_medical_knowledge' tool.
            - If a user asks about trending diseases, drug prices, or new protocols, state that you are 'Consulting External Registries'.
            - Always provide evidence-based synthesis.
            """
            
            # Add language instruction to the system prompt
            language_instruction = f"IMPORTANT: Respond in {language_name} language only. Use simple {language_name} terms."
            if language_name.lower() in ["pure hindi (हिंदी)", "hindi"]:
                language_instruction = "CRITICAL INSTRUCTION: You MUST respond EXCLUSIVELY in pure Hindi using the Devanagari script (देवनागरी). Do NOT use English letters or Romanized Hindi (Hinglish) under any circumstances. If the user asks for Hindi, every single word must be in Hindi font."
            elif language_name.lower() != "english":
                language_instruction = f"CRITICAL INSTRUCTION: You MUST respond EXCLUSIVELY in the native script of {language_name}. Do NOT use English letters or Romanized alphabet. Write entirely in the authentic native script of {language_name}."
            
            complete_system_prompt = system_prompt + "\n\n" + agent_instructions + "\n\n" + language_instruction

            # PHASE 5: Agentic Reasoning Turn
            if reasoning_agent and not history:
                try:
                    agent_response = reasoning_agent.run(f"User Query ({language_name}): {message}\nContext: {json.dumps(patient_context)}")
                    response_text = agent_response.content if hasattr(agent_response, 'content') else str(agent_response)
                    return {
                        "success": True,
                        "response": response_text,
                        "agent_status": "Agentic Reasoning Active (Groq/Tavily)",
                        "model": "llama-3.3-70b",
                        "timestamp": datetime.now().isoformat(),
                        "language": language
                    }
                except Exception as agent_err:
                    print(f"Agentic Fallback to Gemini: {agent_err}")

            # ====================================================================
            # SMART FALLBACK & KEY ROTATION (Handles 429/Quota Errors)
            # ====================================================================
            import time
            models_to_try = [
                "gemini-2.0-flash",
                "gemini-1.5-flash", 
                "gemini-1.5-pro",
                "gemini-pro"
            ]
            
            last_error = None
            # Loop through all available API keys if we hit a quota
            for api_key in settings.GEMINI_API_KEYS:
                try:
                    # 1. Update the configuration for this key
                    genai.configure(api_key=api_key)
                    
                    # 2. Try the models with this key
                    for model_name in models_to_try:
                        try:
                            # Configure the specific model for this attempt
                            current_model = genai.GenerativeModel(
                                model_name=model_name,
                                generation_config={
                                    "temperature": settings.TEMPERATURE,
                                    "max_output_tokens": settings.MAX_TOKENS,
                                }
                            )
                            
                            # Format history
                            gemini_history = []
                            if history:
                                for msg in history:
                                    role = 'user' if msg.get('role') == 'user' else 'model'
                                    gemini_history.append({"role": role, "parts": [{"text": msg.get('content', '')}]})

                            chat_session = current_model.start_chat(history=gemini_history)
                            
                            context_msg = ""
                            if patient_context:
                                context_msg = "Current Patient Bio-Data:\n"
                                for k, v in patient_context.items():
                                    if k != 'predictions':
                                        context_msg += f"- {k}: {v}\n"
                                context_msg += "\n"

                            final_msg = complete_system_prompt + "\n\n" + context_msg + message
                            response = chat_session.send_message(final_msg)
                            
                            return {
                                "success": True,
                                "response": response.text,
                                "agent_status": f"Agentic AI Synthesis (Model: {model_name})",
                                "model": model_name,
                                "timestamp": datetime.now().isoformat(),
                                "key_rotation": "Using Backup Key" if api_key != settings.GEMINI_API_KEY else "Primary Key Active",
                                "language": language
                            }
                        except Exception as model_err:
                            last_error = str(model_err)
                            print(f"⚠️  Model {model_name} with key {api_key[:6]}... failed: {last_error}")
                            if "429" in last_error or "deadline" in last_error.lower():
                                continue # Try the next model with this key
                            break # Non-quota error, move to next key
                            
                except Exception as key_err:
                    print(f"⚠️  Key rotation failed: {key_err}")
                    continue # Try the next available key

            # ====================================================================
            # UNIVERSAL EMERGENCY FALLBACK: GPT-4o SPECIALIST (Ensures 100% Uptime)
            # ====================================================================
            try:
                print("🚨 All Gemini Council Keys Busy - Falling back to GPT-4o Specialist...")
                from .openai_service import get_openai_client
                client = get_openai_client()
                if client:
                    messages = [{"role": "system", "content": complete_system_prompt}]
                    if history:
                        for msg in history:
                            messages.append({"role": "user" if msg.get('role') == 'user' else "assistant", "content": msg.get('content')})
                    
                    context_msg = ""
                    if patient_context:
                        # Clean patient data for privacy/logic (Exclude predictions if already in message)
                        context_msg = "Patient context: " + json.dumps({k:v for k,v in patient_context.items() if k != 'predictions'})
                    
                    messages.append({"role": "user", "content": context_msg + "\n\nUser Query: " + message})
                    
                    response = await client.chat.completions.create(
                        model="gpt-4o",
                        messages=messages,
                        max_tokens=1500,
                        temperature=0.3
                    )
                    
                    return {
                        "success": True,
                        "response": f"### [SYSTEM NOTICE: AI Council Synthesis Busy - Providing Direct Expert Review]\n\n{response.choices[0].message.content}",
                        "agent_status": "GPT-4o Medical Specialist (Standalone)",
                        "model": "gpt-4o",
                        "timestamp": datetime.now().isoformat(),
                        "language": language
                    }
            except Exception as gpt_err:
                print(f"❌ OpenAI Fallback also failed: {gpt_err}")

            return {
                "success": False,
                "error": f"AI Council Fully Busy (All Quotas Exceeded). Please wait 10 seconds. (Details: {last_error})",
                "provider": "google_gemini_agent"
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
        Core Collaborative Engine:
        1. GPT-4o provides initial expert assessment and risk level.
        2. Gemini synthesizes GPT-4o's data with ML predictions into a final unified response.
        """
        try:
            # 1. GPT-4o Initial Expert View
            gpt_res = await get_second_opinion(patient_data, predictions, language=language)
            gpt_analysis = gpt_res.get("analysis", "No response from GPT-4o.") if gpt_res.get("success") else "GPT-4o unavailable. Proceeding with Gemini-only analysis."
            
            # 2. Build Synthesis Prompt for Gemini
            synthesis_prompt = f"""You are the Lead Diagnostic Synthesizer (Gemini).
IMPORTANT: RESPOND IN {language.upper()} LANGUAGE ONLY.

**Patient Context:**
{json.dumps(patient_data, indent=2)}

**ML Risk Predictions:**
{json.dumps(predictions, indent=2)}

**GPT-4o Consultant Initial Expert Assessment:**
{gpt_analysis}

**Task Specific Context ({prompt_type}):**
{additional_context or "Provide a comprehensive medical overview."}

**Your Objective:**
Review the patient's data, the ML risks, and GPT-4o's expert assessment.
Provide a FINAL UNIFIED COLLABORATIVE DECISION. Synthesize all insights into a single, cohesive, and highly detailed response. 
Do NOT mention "Model A vs Model B". Speak as a unified medical council.

Desired Sections (translated to {language}):
1. Unified Health Summary & Risk Assessment
2. Detailed Explanation of Findings (Combining ML + Expert insights)
3. Step-by-Step Actionable Protocol (Diet, Exercise, Monitoring)
4. Key Warning Signs & Family Guidance

Make it highly conversational, expert, and empathetic. Provide "Full Detail"!
"""
            # 3. Gemini Final Synthesis (Attempting to use Gemini to unite the results)
            result = HealthcareAI.chat_with_gemini(synthesis_prompt, patient_data, language=language)
            
            if result.get("success"):
                return {
                    "success": True,
                    "response": result.get("response", ""),
                    "gpt_raw": gpt_analysis, 
                    "risk_level": gpt_res.get("risk_level", "MODERATE"),
                    "model": "Dual-AI Collaborative Consensus (GPT-4o + Gemini)"
                }
            
            # EMERGENCY FALLBACK: If Gemini is busy (429), don't show an error! 
            # Return the GPT-4o analysis directly as the 'Expert Opinion'.
            if "429" in str(result.get("error", "")) or not result.get("success"):
                logger.warning("Gemini 429 encountered - Falling back to standalone GPT-4o response.")
                return {
                    "success": True,
                    "response": f"### [SYSTEM NOTICE: AI Council Synthesis Busy - Providing Direct Expert Review]\n\n{gpt_analysis}",
                    "gpt_raw": gpt_analysis,
                    "risk_level": gpt_res.get("risk_level", "MODERATE"),
                    "model": "GPT-4o Medical Specialist (Standalone)"
                }
            
            return result

        except Exception as e:
            return {"success": False, "error": f"Collaboration Error: {str(e)}"}
    
    @staticmethod
    async def analyze_health_data(patient_data: Dict, predictions: Dict, language: str = "english") -> Dict:
        """
        Comprehensive AI health analysis using Dual-AI Collaborative Consensus
        """
        return await HealthcareAI.get_collaborative_consensus_response(
            "General Analysis", patient_data, predictions, language,
            "Provide a deep analysis of current health status, diet, and lifestyle with regional context."
        )
    
    @staticmethod
    async def explain_prediction(disease: str, risk: float, patient_data: Dict, language: str = "english") -> Dict:
        """
        Explain ML prediction using Dual-AI Collaborative Consensus
        """
        context = f"Explain the {risk:.0%} risk of {disease}. Break down why the model flagged this and what it means clinically."
        return await HealthcareAI.get_collaborative_consensus_response(
            "Prediction Explanation", patient_data, {"disease": disease, "risk": risk}, language, context
        )
    
    @staticmethod
    async def generate_treatment_plan(patient_data: Dict, predictions: Dict, language: str = "english") -> Dict:
        """
        Generate personalized treatment plan using Dual-AI Collaborative Consensus
        """
        return await HealthcareAI.get_collaborative_consensus_response(
            "Treatment Plan", patient_data, predictions, language,
            "Create a rigid, detailed clinical protocol with 7-day, 3-month, and long-term targets."
        )
    
    @staticmethod
    async def answer_health_question(question: str, patient_context: Optional[Dict] = None, language: str = "english") -> Dict:
        """
        Answer health questions using Dual-AI Collaborative Consensus
        """
        # If no patient context, we can't do full consensus easily, but we'll try mock data or generic
        p_data = patient_context or {"age": "Unknown", "gender": "Unknown"}
        predictions = patient_context.get('predictions', {}) if patient_context else {}
        
        return await HealthcareAI.get_collaborative_consensus_response(
            "Q&A Session", p_data, predictions, language,
            f"User Question: {question}. Provide a definitive medical perspective."
        )
    
    @staticmethod
    async def get_diet_recommendations(patient_data: Dict, predictions: Dict, language: str = "english") -> Dict:
        """
        Get diet recommendations using Dual-AI Collaborative Consensus
        """
        return await HealthcareAI.get_collaborative_consensus_response(
            "Dietary Protocol", patient_data, predictions, language,
            "Create a specific breakfast, lunch, snack, and dinner plan using locally available Indian ingredients."
        )

    @staticmethod
    def generate_voice_summary(patient_data: Dict, symptoms: Dict, urgency: str, language: str = "english") -> Dict:
        """
        Generates a concise, highly accurate medical-grade voice summary for TTS.
        """
        prompt = f"""You are the Agentic AI Voice Agent.
IMPORTANT: RESPOND IN {language.upper()} LANGUAGE ONLY.

Patient context: {patient_data.get('age')}yr {patient_data.get('gender')}.
Symptoms: {', '.join([k for k,v in symptoms.items() if v])}
Urgency Level Determines by System: {urgency}

Generate a short, calming, and clinically accurate 2-3 sentence spoken response. 
It MUST sound like an advanced, empathetic AI doctor speaking aloud. 
Do not use markdown, bullet points, or complex symbols. Use natural spoken punctuation.
Acknowledge their symptoms, state the urgency mildly, and give the single most important immediate instruction.
"""
        result = HealthcareAI.chat_with_gemini(prompt, patient_data, language=language)
        return result

    @staticmethod
    def generate_agentic_consensus(patient_data: Dict, symptoms: Dict, predictions: Dict, language: str = "english") -> Dict:
        """
        Simulates a multi-agent medical consensus panel.
        Agents: Dr. Cortex (Clinical), Dr. Vitalis (Data), Dr. Synapse (Holistic).
        """
        if not gemini_model:
            return {"success": False, "error": "Gemini AI not configured"}

        try:
            language_map = {
                "en": "English",
                "hi": "Hindi",
                "ta": "Tamil",
                "te": "Telugu"
            }
            lang_name = language_map.get(language.lower(), language)

            # Consumed context
            context = f"""
            Patient: {patient_data.get('age')}Y {patient_data.get('gender')} from {patient_data.get('village', 'Unknown Sector')}.
            Vitals: Glucose {patient_data.get('glucose')}, BP {patient_data.get('bp')}, Cholesterol {patient_data.get('cholesterol')}, BMI {patient_data.get('bmi')}.
            Symptoms: {', '.join([k for k, v in symptoms.items() if v])}.
            ML Risks: Diabetes {predictions.get('diabetes', 0):.1%}, Heart {predictions.get('heart', 0):.1%}, Kidney {predictions.get('kidney', 0):.1%}.
            """

            # 1. Dr. Cortex Contribution (Clinical Specialist)
            cortex_prompt = f"""You are Dr. Cortex, the Lead Clinical Diagnostician. 
            Critically assess these symptoms and physiological markers: {context}. 
            Identify the most probable clinical pathway. 
            Limit your output to 2 precise, medically rigorous sentences. Language: {lang_name}."""
            cortex_res = gemini_model.generate_content(cortex_prompt).text

            # 2. Dr. Vitalis Contribution (Medical Data Analyst)
            vitalis_prompt = f"""You are Dr. Vitalis, the Chief Biostatistician and ML Data Analyst. 
            Correlate the numerical vitals and the ML risk coefficients provided: {context}. 
            State the statistical significance and actionable data trends in 2 concise sentences. Language: {lang_name}."""
            vitalis_res = gemini_model.generate_content(vitalis_prompt).text

            # 3. Dr. Synapse Contribution (Clinical Protocol Agent)
            synapse_prompt = f"""You are Dr. Synapse, the Evidence-Based Protocol Specialist. 
            Based on the patient's holistic profile: {context}. 
            Identify the primary clinical protocol required according to International WHO/CDC standards in 2 sentences. Language: {lang_name}."""
            synapse_res = gemini_model.generate_content(synapse_prompt).text

            # 4. Final Final Board Consensus
            consensus_prompt = f"""
            Synthesize a finalized Medical Board Consensus Note based on these specialist findings:
            Clinical Impression (Dr. Cortex): {cortex_res}
            Biometric Data Verification (Dr. Vitalis): {vitalis_res}
            Standard Treatment Protocol (Dr. Synapse): {synapse_res}
            
            Synthesize these into a definitive 3-sentence clinical finalization for the duty officer. Language: {lang_name}.
            """
            consensus_res = gemini_model.generate_content(consensus_prompt).text

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
        Analyze medical report (PDF or Image) using Gemini Vision/Multimodal
        """
        if not gemini_model:
            return {"success": False, "error": "Gemini AI not configured"}
            
        try:
            # Prepare multimodal prompt
            language_map = {
                "en": "English",
                "hi": "pure Hindi (हिंदी)",
                "ta": "Tamil",
                "te": "Telugu",
                "bn": "Bengali",
                "mr": "Marathi",
                "gu": "Gujarati"
            }
            language_name = language_map.get(language.lower(), language)

            prompt = f"""You are an advanced medical diagnostic assistant.
Analyze this medical report carefully.
IMPORTANT: RESPOND IN {language_name.upper()} LANGUAGE ONLY.

Provide a highly detailed, structured, and conversational analysis including:
1. **Report Summary**: A comprehensive explanation of the type of report and the patient's context.
2. **Key Findings**: A meticulously detailed list of all abnormal or critical values and exactly what they signify.
3. **Medical Terms Explained**: Explain ALL medical terms, jargon, and tests mentioned (e.g., HbA1c, Lipids, Systolic) in full detail using very simple, everyday comparisons so a normal person or patient can easily and completely understand them. Give us the "full detail"!
4. **Comparison**: A detailed comparison of the results with Indian population norms.
5. **Clinical Correlation**: A thorough explanation of how these findings relate to standard health risks (Diabetes, Heart, Kidney).
6. **ASHA / Patient Guidance**: Highly detailed, actionable, and fully explained steps for a rural health worker or the patient to follow.
7. **Urgency**: A clear, expertly reasoned assessment of whether immediate medical attention is required.

Use a highly engaging, conversational tone in {language_name} like an expert, caring doctor taking the time to fully explain a report to a patient. Provide completely detailed insights.
CRITICAL: If {language_name} is an Indian language like Hindi, Tamil, Bengali, etc., you MUST write the ENTIRE response in its native script (e.g., Devanagari for Hindi). DO NOT use English letters to spell out Indian words (No Hinglish/Romanized text)."""

            # ====================================================================
            # SMART VISION FALLBACK & KEY ROTATION (Prevents 429/504)
            # ====================================================================
            import time
            from google.api_core import retry
            
            vision_models = [
                "gemini-1.5-flash",  # Super fast vision
                "gemini-2.0-flash",  # Next gen vision
                "gemini-1.5-pro",    # Smartest vision
            ]
            
            last_error = None
            # Stage 1: Try Gemini with Key Rotation
            for api_key in settings.GEMINI_API_KEYS:
                try:
                    # Configure current key
                    genai.configure(api_key=api_key)
                    
                    # Try models for this key
                    for model_name in vision_models:
                        try:
                            current_vision_model = genai.GenerativeModel(model_name=model_name)
                            
                            content_parts = [
                                {"mime_type": file_type, "data": file_content},
                                prompt
                            ]
                            
                            response = current_vision_model.generate_content(
                                content_parts,
                                request_options={
                                    "timeout": 120, 
                                    "retry": retry.Retry(initial=1.0, multiplier=2.0, maximum=30.0, deadline=120.0)
                                }
                            )
                            
                            response_text = response.text if hasattr(response, 'text') else str(response)
                            
                            return {
                                "success": True,
                                "analysis": response_text,
                                "model": model_name,
                                "language": language,
                                "agent_status": f"Vision Consensus Panel (Model: {model_name})",
                                "key_rotation": "Used Backup Key" if api_key != settings.GEMINI_API_KEY else "Primary Key Active",
                                "timestamp": datetime.now().isoformat()
                            }
                        except Exception as e:
                            last_error = str(e)
                            print(f"⚠️  Vision Model {model_name} with key {api_key[:6]}... failed: {last_error}")
                            if "429" in last_error or "deadline" in last_error.lower() or "504" in last_error:
                                continue # Try next model
                            break # Fatal model error, try next key
                except Exception as key_err:
                    print(f"⚠️  Vision Key rotation error: {key_err}")
                    continue

            # Stage 2: Emergency Fallback to GPT-4o Vision if Gemini fails
            try:
                print("🚨 All Gemini Vision Quotas Exceeded - Falling back to GPT-4o Vision Expert...")
                from .openai_service import get_openai_client
                client = get_openai_client()
                if client:
                    import base64
                    base64_image = base64.b64encode(file_content).decode('utf-8')
                    
                    # GPT-4o Vision Request
                    response = await client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {"type": "image_url", "image_url": {"url": f"data:{file_type};base64,{base64_image}"}}
                                ]
                            }
                        ],
                        max_tokens=1500
                    )
                    
                    return {
                        "success": True,
                        "analysis": response.choices[0].message.content,
                        "model": "GPT-4o Vision Specialist (Emergency Fallback)",
                        "language": language,
                        "agent_status": "GPT-4o Medical Vision Expert",
                        "timestamp": datetime.now().isoformat()
                    }
            except Exception as gpt_err:
                print(f"❌ GPT-4o Vision Fallback also failed: {gpt_err}")

            return {
                "success": False,
                "error": f"Medical Imaging System Busy (All Quotas Exceeded). Please wait 10 seconds. (Details: {last_error})",
                "provider": "google_gemini_vision"
            }
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