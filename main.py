import os

"""
Healthcare AI System - Complete Backend
xAI Grok Powered
FastAPI REST API with ML + AI Reasoning
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import joblib
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import random
import json

# Resolve base directory relative to this file so paths work regardless of cwd
_BACKEND_DIR = Path(__file__).resolve().parent
_ROOT_DIR = _BACKEND_DIR  # d:\Agentic_Healthcare_AI (Now at root)
_DATASET_DIR = _ROOT_DIR / "dataset" / "data" / "structured"
_PATIENT_CSV = _DATASET_DIR / "patient_data.csv"
_LAB_CSV = _DATASET_DIR / "lab_results.csv"

from config import settings
from ai_services import HealthcareAI, chat, analyze, explain, plan, ask, diet, voice_summary, consensus, dual_consensus_review
from voice_service import text_to_speech

# ── New Advanced Integrations ─────────────────────────────────────────────────
from database import (
    init_db, get_db, save_patient, save_diagnosis, get_patient_history
)
from external_apis import (
    check_drug_interactions, get_drug_info,
    search_icd10,
    get_medlineplus_info, get_who_stats, WHO_INDICATORS
)
from typing import Any
from fastapi import Depends

# Initialize MongoDB database on startup
init_db()


app = FastAPI(
    title="Agentic AI OS - Grok Powered",
    description="Advanced Diagnostic REST API with ML + xAI Grok Reasoning",
    version="4.1.0 (Grok Stability Edition)",
    docs_url="/docs",
    redoc_url="/redoc"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
models = {}
scalers = {}
features = {}

model_files = {
    'diabetes': 'diabetes',
    'heart': 'heart_disease',
    'kidney': 'kidney_disease'
}

_MODELS_DIR = _ROOT_DIR / "models"

for disease, file_prefix in model_files.items():
    try:
        models[disease] = joblib.load(_MODELS_DIR / f"{file_prefix}_model.pkl")
        scalers[disease] = joblib.load(_MODELS_DIR / f"{file_prefix}_scaler.pkl")
        features[disease] = joblib.load(_MODELS_DIR / f"{file_prefix}_features.pkl")
        print(f"[OK] Loaded {disease} model")
    except Exception as e:
        print(f"WARNING: Could not load {disease} model: {e}")

# ============================================================================
# Pydantic Models
# ============================================================================

class PatientData(BaseModel):
    age: int
    gender: str
    glucose: Optional[float] = 100
    hba1c: Optional[float] = 5.4
    cholesterol: Optional[float] = 200
    bp: Optional[float] = 120
    bmi: Optional[float] = 25
    creatinine: Optional[float] = 1.0
    smoking: Optional[int] = 0
    family_history_diabetes: Optional[int] = 0
    family_history_heart: Optional[int] = 0
    language: Optional[str] = "english"

class SymptomData(BaseModel):
    fever: bool = False
    cough: bool = False
    chest_pain: bool = False
    breathing: bool = False
    weakness: bool = False
    vomiting: bool = False
    diarrhea: bool = False
    headache: bool = False
    unconscious: bool = False
    bleeding: bool = False
    swelling: bool = False
    back_pain: bool = False

class ChatMessage(BaseModel):
    message: str
    patient_data: Optional[PatientData] = None
    history: Optional[List[Dict]] = None
    language: Optional[str] = "en"

class QuestionRequest(BaseModel):
    question: str
    patient_context: Optional[Dict] = None
    language: Optional[str] = "english"

class DrugCheckRequest(BaseModel):
    drugs: List[str]
    patient_ref: Optional[str] = None

class SavePatientRequest(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    patient_ref: Optional[str] = ""
    save_predictions: Optional[bool] = True
    patient_data: Optional[PatientData] = None

class SecondOpinionRequest(BaseModel):
    patient_data: PatientData
    language: Optional[str] = "english"

class StockUpdateRequest(BaseModel):
    med_id: str
    change: int

# ============================================================================
# Helper Functions
# ============================================================================

def make_prediction(disease: str, patient_data: PatientData) -> float:
    """Make prediction for a disease with advanced feature mapping"""
    try:
        # Pre-calculate diabetes risk as it's a feature for kidney
        diab_prob = 0.0
        if disease == 'kidney':
            diab_prob = make_prediction('diabetes', patient_data)

        # Parse gender dummy
        gender_val = 1 if str(patient_data.gender).upper().startswith('M') else 0
        
        # Set normal defaults for features not captured by simple UI form
        bp_sys = patient_data.bp or 120
        bp_dia = 80
        hdl = 50
        
        defaults = {
            'age': patient_data.age,
            'gender': gender_val,
            'bmi': patient_data.bmi,
            'blood_pressure_systolic': bp_sys,
            'blood_pressure_diastolic': bp_dia,
            'glucose': patient_data.glucose,
            'cholesterol': patient_data.cholesterol,
            'hdl': hdl,
            'ldl': (patient_data.cholesterol * 0.7) if patient_data.cholesterol else 100,
            'triglycerides': 150,
            'creatinine': patient_data.creatinine,
            'albumin': 4.0,
            'hemoglobin': 14.0,
            'hba1c': patient_data.hba1c,
            'insulin': 50,
            'smoking': patient_data.smoking,
            'physical_activity': 1,
            'family_history_diabetes': patient_data.family_history_diabetes,
            'family_history_heart': patient_data.family_history_heart,
            
            # Engineered features
            'glucose_bmi_ratio': (patient_data.glucose or 100) / max(patient_data.bmi or 1, 1),
            'hba1c_glucose': (patient_data.hba1c or 5.4) * (patient_data.glucose or 100) / 100,
            'pulse_pressure': bp_sys - bp_dia,
            'chol_hdl_ratio': (patient_data.cholesterol or 200) / max(hdl, 1),
            'age_bp': patient_data.age * bp_sys / 1000,
            'creatinine_age': (patient_data.creatinine or 1.0) * patient_data.age,
            'obese': 1 if (patient_data.bmi or 0) > 30 else 0,
            'hypertensive': 1 if bp_sys > 140 else 0,
            'diabetic_glucose': 1 if (patient_data.glucose or 0) > 125 else 0,
            
            'diabetes_risk': 1 if diab_prob > 0.5 else 0
        }
        
        feats = features[disease]
        vals = [defaults.get(f, 0) for f in feats]
        df_in = pd.DataFrame([vals], columns=feats)
        scaled = scalers[disease].transform(df_in)
        prob = models[disease].predict_proba(scaled)[0][1]
        return float(prob)
    except Exception as e:
        print(f"Prediction error for {disease}: {e}")
        return 0.0

def apply_clinical_overrides(predictions: Dict[str, float], patient_data: PatientData) -> Dict[str, float]:
    """
    Apply evidence-based clinical threshold overrides.
    Uses ADA, ACC/AHA, KDIGO guidelines to correct ML model edge cases.
    """
    bp = patient_data.bp or 120
    glucose = patient_data.glucose or 90
    hba1c = patient_data.hba1c or 5.4
    creatinine = patient_data.creatinine or 1.0
    bmi = patient_data.bmi or 22
    cholesterol = patient_data.cholesterol or 180
    age = patient_data.age or 30
    family_dm = patient_data.family_history_diabetes or 0
    family_hrt = patient_data.family_history_heart or 0

    diabetes_risk = predictions.get('diabetes', 0.0)
    heart_risk = predictions.get('heart', 0.0)
    kidney_risk = predictions.get('kidney', 0.0)

    # --- DIABETES OVERRIDES (ADA Guidelines) ---
    if hba1c >= 6.5 or glucose >= 200:
        diabetes_risk = max(diabetes_risk, 0.92)  # Diagnostic threshold
    elif hba1c >= 5.7 or glucose >= 100:
        diabetes_risk = max(diabetes_risk, 0.45)  # Pre-diabetes range
    if family_dm and (hba1c >= 5.7 or glucose >= 100):
        diabetes_risk = max(diabetes_risk, 0.65)  # Family history + pre-diabetes
    if bmi >= 30 and (hba1c >= 6.0 or glucose >= 140):
        diabetes_risk = max(diabetes_risk, 0.75)  # Obesity + elevated glucose

    # --- CARDIOVASCULAR OVERRIDES (ACC/AHA Guidelines) ---
    if bp >= 180:  # Stage 2 Hypertension Crisis
        heart_risk = max(heart_risk, 0.88)
    elif bp >= 160:  # Stage 2 Hypertension
        heart_risk = max(heart_risk, 0.72)
    elif bp >= 140:  # Stage 1 Hypertension
        heart_risk = max(heart_risk, 0.55)
    if cholesterol >= 240:  # High cholesterol
        heart_risk = max(heart_risk, 0.60)
    elif cholesterol >= 200:
        heart_risk = max(heart_risk, 0.40)
    if age >= 65 and bp >= 140:
        heart_risk = max(heart_risk, 0.78)  # Age + hypertension compound risk
    if family_hrt and age >= 45:
        heart_risk = max(heart_risk, 0.55)  # Family history compound
    if bp >= 140 and cholesterol >= 220 and age >= 55:
        heart_risk = max(heart_risk, 0.82)  # Triple compound risk

    # --- KIDNEY OVERRIDES (KDIGO Guidelines) ---
    if creatinine >= 2.0:  # Significantly elevated
        kidney_risk = max(kidney_risk, 0.80)
    elif creatinine >= 1.5:
        kidney_risk = max(kidney_risk, 0.55)
    if diabetes_risk >= 0.7 and creatinine >= 1.2:
        kidney_risk = max(kidney_risk, 0.65)  # Diabetic nephropathy risk
    if bp >= 160 and creatinine >= 1.3:
        kidney_risk = max(kidney_risk, 0.70)  # Hypertensive nephropathy

    return {
        'diabetes': min(diabetes_risk, 0.98),
        'heart': min(heart_risk, 0.98),
        'kidney': min(kidney_risk, 0.98)
    }


def make_all_predictions(patient_data: PatientData) -> Dict[str, float]:
    """Make predictions for all diseases with clinical threshold validation"""
    raw_predictions = {
        'diabetes': make_prediction('diabetes', patient_data),
        'heart': make_prediction('heart', patient_data),
        'kidney': make_prediction('kidney', patient_data)
    }
    # Apply evidence-based overrides to handle ML edge cases
    return apply_clinical_overrides(raw_predictions, patient_data)

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Agentic AI OS - Grok Powered 🚀",
        "version": "4.1.0",
        "ai_provider": "xAI Grok",
        "model": settings.DEFAULT_MODEL,
        "ai_configured": settings.has_xai_key,
        "ml_models_loaded": len(models),
        "features": [
            "ML Disease Predictions (Diabetes, Heart, Kidney)",
            "Grok Agentic Reasoning & Diagnostic Synthesis",

            "3-Agent Specialist Consensus Panel",
            "Regional Indian Language Support",
            "ASHA Rural Health Mode",
        ],
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ml_models_loaded": len(models),
        "ai_configured": settings.has_xai_key,
        "ai_model": settings.DEFAULT_MODEL if settings.has_xai_key else "not_configured",
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# ML PREDICTION ENDPOINTS
# ============================================================================

@app.post("/api/predict")
async def predict(patient: PatientData):
    """
    Advanced disease risk predictions using ML models with confident intervals and feature breakdown
    Returns: Diabetes, Heart, Kidney risk percentages, confidence intervals, and feature importance.
    """
    try:
        predictions = make_all_predictions(patient)
        
        # Simulated Feature Importance logic based on patient stats
        feature_importance = {}
        for disease, prob in predictions.items():
            impacts = []
            if disease == 'diabetes':
                if patient.glucose > 110: impacts.append({"feature": "Glucose", "impact": f"+{min(int((patient.glucose-100)*0.5), 40)}%"})
                if patient.hba1c > 5.7: impacts.append({"feature": "HbA1c", "impact": f"+{min(int((patient.hba1c-5.7)*10), 30)}%"})
                if patient.bmi > 25: impacts.append({"feature": "BMI", "impact": f"+{min(int((patient.bmi-25)*2), 15)}%"})
            elif disease == 'heart':
                if patient.bp > 120: impacts.append({"feature": "Blood Pressure", "impact": f"+{min(int((patient.bp-120)*0.5), 30)}%"})
                if patient.cholesterol > 200: impacts.append({"feature": "Cholesterol", "impact": f"+{min(int((patient.cholesterol-200)*0.2), 25)}%"})
                if patient.smoking > 0: impacts.append({"feature": "Smoking", "impact": "+20%"})
            elif disease == 'kidney':
                if patient.creatinine > 1.2: impacts.append({"feature": "Creatinine", "impact": f"+{min(int((patient.creatinine-1.0)*30), 45)}%"})
                if patient.bp > 130: impacts.append({"feature": "Blood Pressure", "impact": f"+{min(int((patient.bp-130)*0.4), 20)}%"})
                
            # fallback if no obvious high indicators but prob is still there, or just keep it empty
            if not impacts and prob > 0.1:
                impacts.append({"feature": "Age/Baseline", "impact": "+10%"})
                
            feature_importance[disease] = sorted(impacts, key=lambda x: -int(x['impact'].replace('+','').replace('%','')) if '%' in x['impact'] else 0)

        # Confidence intervals (heuristic: extreme probs = higher confidence)
        confidence_intervals = {}
        for disease, prob in predictions.items():
            # if probability is very low (<0.2) or very high (>0.8), model is more confident.
            conf = 70 + (abs(prob - 0.5) * 50) 
            confidence_intervals[disease] = min(round(conf, 1), 99.5)

        return {
            "success": True,
            "predictions": predictions,
            "confidence_intervals": confidence_intervals,
            "feature_importance": feature_importance,
            "patient_id": f"P{random.randint(1000, 9999)}",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ML PREDICTION ENDPOINTS
# ============================================================================

@app.post("/api/predict/all")
async def predict_all_endpoint(patient_data: PatientData):
    """
    Standalone high-speed ML prediction endpoint.
    Used by the frontend to fetch clinical risks for AI synthesis.
    """
    try:
        predictions = make_all_predictions(patient_data)
        return {
            "success": True,
            "predictions": predictions,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# GEMINI AI ENDPOINTS
# ============================================================================

@app.post("/api/ai/chat")
async def ai_chat_endpoint(chat_msg: ChatMessage):
    """
    Chat with Gemini AI about health
    Accepts: message and optional patient data
    Returns: AI response with context-aware advice
    """
    try:
        # Prepare patient context
        patient_context = None
        if chat_msg.patient_data:
            patient_context = chat_msg.patient_data.dict()
            # Get ML predictions for context
            predictions = make_all_predictions(chat_msg.patient_data)
            patient_context['predictions'] = predictions
        
        # Get AI response
        result = await chat(chat_msg.message, patient_context, chat_msg.history, language=chat_msg.language)
        
        # Add predictions if available
        if chat_msg.patient_data:
            result['ml_predictions'] = predictions
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/analyze")
async def ai_analyze_endpoint(patient: PatientData):
    """
    Comprehensive Dual-AI health analysis
    Uses ML predictions + GPT-4o + Gemini AI for deep insights
    """
    try:
        # Get ML predictions
        predictions = make_all_predictions(patient)
        
        # Unified Dual-AI Collaborative Consensus
        result = await analyze(patient.dict(), predictions, language=patient.language)
        
        # Add ML predictions to response
        if result.get("success"):
            result["ml_predictions"] = predictions
            # Ensure 'response' field is set for legacy frontend compatibility
            result["response"] = result.get("response", "")
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/explain/{disease}")
async def ai_explain_endpoint(disease: str, patient: PatientData):
    """
    AI explanation of ML prediction
    Explains WHY the model predicted this risk level
    Returns: Detailed explanation in simple Hindi
    """
    try:
        # Get ML predictions
        predictions = make_all_predictions(patient)
        risk = predictions.get(disease, 0)
        
        # Get AI explanation
        result = await explain(disease, risk, patient.dict(), language=patient.language)
        
        # Add ML predictions
        if result.get("success"):
            result["ml_predictions"] = predictions
            result["disease"] = disease
            result["risk"] = risk
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/treatment-plan")
async def ai_plan_endpoint(patient: PatientData):
    """
    Generate personalized treatment plan
    AI creates comprehensive plan based on ML predictions
    Returns: Structured treatment plan in Hindi
    """
    try:
        # Get ML predictions
        predictions = make_all_predictions(patient)
        
        # Generate AI treatment plan
        result = await plan(patient.dict(), predictions, language=patient.language)
        
        # Add ML predictions
        if result.get("success"):
            result["ml_predictions"] = predictions
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/voice/synthesize")
async def ai_synthesize_endpoint(text: str = Form(...), language: str = Form("english")):
    try:
        from voice_service import text_to_speech
        audio_bytes = text_to_speech(text, language)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/ai/ask")
async def ai_ask_endpoint(request: QuestionRequest):
    """
    Ask any health question
    AI answers in simple Hindi
    Returns: Answer with practical advice
    """
    try:
        result = await ask(request.question, request.patient_context, language=request.language)
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/diet")
async def ai_diet_endpoint(patient: PatientData):
    """
    Get personalized diet recommendations
    AI creates practical diet plan for rural India
    Returns: Detailed diet plan in Hindi
    """
    try:
        # Get ML predictions
        predictions = make_all_predictions(patient)
        
        # Get AI diet recommendations
        result = await diet(patient.dict(), predictions, language=patient.language)
        
        # Add ML predictions
        if result.get("success"):
            result["ml_predictions"] = predictions
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/status")
async def ai_status_endpoint():
    """
    Check AI configuration status
    Returns: Gemini API status and configuration
    """
    return {
        "success": True,
        "ai_provider": "Groq Llama Engine",
        "groq_configured": settings.has_groq_key,
        "model": settings.GROQ_MODEL,
        "max_tokens": settings.MAX_TOKENS,
        "temperature": settings.TEMPERATURE,
        "pricing": {
            "llama-3.3-70b": "Ultra-Fast Inference",
            "llama-3.2-vision": "Deep Vision Synthesis"
        },
        "get_key_at": "https://console.groq.com/keys"
    }

# ============================================================================
# ASHA MODE ENDPOINT
# ============================================================================

@app.post("/api/asha/analyze")
async def asha_analyze(patient: PatientData, symptoms: SymptomData):
    """
    ASHA mode comprehensive analysis
    Combines ML predictions, symptoms, and AI insights
    Returns: Urgency level, actions, AI recommendations
    """
    try:
        # Get ML predictions
        predictions = make_all_predictions(patient)
        max_risk = max(predictions.values())
        
        # Determine urgency based on symptoms and risk
        critical_symptoms = symptoms.chest_pain or symptoms.unconscious or symptoms.bleeding
        moderate_symptoms = symptoms.breathing or symptoms.fever
        
        if critical_symptoms or max_risk > 0.7:
            urgency = "RED"
            urgency_text = "🔴 RED - URGENT / गंभीर"
            timeframe = "0-2 hours / तुरंत"
            actions = [
                "🚨 Take to PHC immediately or call 108 / तुरंत PHC ले जाएं",
                "📞 Call PHC doctor now / अभी डॉक्टर को फोन करें",
                "👨‍👩‍👧 Tell family - critical / परिवार को बताएं",
                "📋 Keep all reports ready / सभी reports तैयार रखें"
            ]
        elif moderate_symptoms or max_risk > 0.4:
            urgency = "YELLOW"
            urgency_text = "🟡 YELLOW - SOON / जल्द"
            timeframe = "24-48 hours / 24-48 घंटे में"
            actions = [
                "📞 Schedule PHC appointment / PHC अपॉइंटमेंट लें",
                "📋 Note all symptoms / लक्षण लिखें",
                "💊 Continue current medicines / दवाई जारी रखें",
                "📝 Monitor daily / रोज़ निगरानी करें"
            ]
        else:
            urgency = "GREEN"
            urgency_text = "🟢 GREEN - ROUTINE / सामान्य"
            timeframe = "1-2 weeks / 1-2 हफ्ते में"
            actions = [
                "🏠 Home care sufficient / घर पर देखभाल",
                "📚 Follow healthy diet / स्वस्थ आहार",
                "📅 Check in one week / हफ्ते में दोबारा जांच",
                "💊 Maintain healthy lifestyle / स्वस्थ जीवनशैली"
            ]
        
        # Get AI analysis for additional insights (Voice optimized)
        ai_analysis = None
        if settings.has_groq_key or settings.has_gemini_key:
            try:
                lang_map = {
                    "hi": "pure Hindi (हिंदी)", "ta": "Tamil", "te": "Telugu",
                    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
                    "kn": "Kannada", "ml": "Malayalam", "pa": "Punjabi", "en": "English"
                }
                lang_name = lang_map.get(patient.language, "English")
                summary_prompt = (
                    f"Provide a brief 2-sentence clinical summary for an ASHA community health worker. "
                    f"Urgency level: {urgency_text}. Focus on the most critical action needed. "
                    f"You MUST respond 100% in {lang_name}."
                )
                # FIX: properly await the async call instead of using asyncio.run inside FastAPI
                ai_result = await HealthcareAI.chat_with_gemini(
                    summary_prompt, patient.dict(), language=patient.language
                )
                if ai_result.get("success"):
                    ai_analysis = ai_result.get("response", "")
            except Exception as e:
                print(f"Voice summary generation failed: {e}")
        
        return {
            "success": True,
            "urgency": urgency,
            "urgency_text": urgency_text,
            "timeframe": timeframe,
            "ml_predictions": predictions,
            "actions": actions,
            "ai_insights": ai_analysis,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# HEALTH TRENDS ENDPOINT (LEGACY - REMOVED)
# @app.get("/api/trends/{patient_id}")
# ...

@app.post("/api/asha/consensus")
async def asha_consensus(patient: PatientData, symptoms: SymptomData):
    """
    ASHA mode multi-agent consensus panel.
    Returns: Specialized insights from 3 AI specialist agents + synthesized consensus.
    """
    try:
        # Get ML predictions
        predictions = make_all_predictions(patient)

        # FIX: consensus() is async — must be awaited
        result = await consensus(patient.dict(), symptoms.dict(), predictions, language=patient.language)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/asha/handover")
async def generate_handover_document(
    patient: PatientData,
    symptoms: SymptomData,
    urgency: str = "GREEN",
    asha_worker_id: str = "",
    asha_worker_name: str = "",
    asha_zone: str = ""
):
    """
    Generate a structured clinical handover document for PHC transfer.
    Used when an ASHA worker needs to refer a patient to a Primary Health Centre.
    Returns: JSON handover object ready for display/print.
    """
    try:
        predictions = make_all_predictions(patient)
        
        # Risk tier labels
        def risk_label(v):
            if v >= 0.7: return "HIGH"
            if v >= 0.4: return "MODERATE"
            return "LOW"

        active_symptoms = [k for k, v in symptoms.dict().items() if v]

        handover = {
            "success": True,
            "document_id": f"ASHA-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "generated_at": datetime.now().isoformat(),
            "asha_worker": {
                "id": asha_worker_id or "ASHA-UNKNOWN",
                "name": asha_worker_name or "Community Health Worker",
                "zone": asha_zone or "Unspecified Zone"
            },
            "patient": {
                "age": patient.age,
                "gender": patient.gender,
                "village": getattr(patient, 'village', 'Unknown'),
            },
            "triage": {
                "urgency": urgency,
                "urgency_display": {
                    "RED": "🚨 CRITICAL — Immediate Referral Required",
                    "YELLOW": "🔶 MODERATE — PHC Visit Within 24–48hrs",
                    "GREEN": "🟢 STABLE — Routine Monitoring"
                }.get(urgency, urgency)
            },
            "clinical_data": {
                "vitals": {
                    "glucose": f"{patient.glucose} mg/dL",
                    "hba1c": f"{patient.hba1c} %",
                    "bp_systolic": f"{patient.bp} mmHg",
                    "bmi": f"{patient.bmi} kg/m²",
                    "cholesterol": f"{patient.cholesterol} mg/dL",
                    "creatinine": f"{patient.creatinine} mg/dL"
                },
                "risk_scores": {
                    "diabetes": {"probability": round(predictions['diabetes'] * 100, 1), "tier": risk_label(predictions['diabetes'])},
                    "heart": {"probability": round(predictions['heart'] * 100, 1), "tier": risk_label(predictions['heart'])},
                    "kidney": {"probability": round(predictions['kidney'] * 100, 1), "tier": risk_label(predictions['kidney'])}
                },
                "active_symptoms": active_symptoms,
                "risk_factors": {
                    "smoking": bool(patient.smoking),
                    "family_history_diabetes": bool(patient.family_history_diabetes),
                    "family_history_heart": bool(patient.family_history_heart)
                }
            },
            "instructions": {
                "RED": ["Immediate transfer to PHC/Hospital", "Call 108 Emergency Ambulance", "Do NOT leave patient alone"],
                "YELLOW": ["Schedule PHC appointment within 48 hours", "Monitor vitals every 4 hours", "Continue prescribed medications"],
                "GREEN": ["Home care sufficient", "Follow-up in 1–2 weeks", "Encourage healthy lifestyle"]
            }.get(urgency, [])
        }

        return handover

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trends/{patient_id}")
async def get_health_trends(patient_id: str, months: int = 6, language: str = "english"):
    """
    Get health trends over time
    Returns: Historical data with AI insights
    """
    try:
        # Generate trend data (in production, load from database)
        dates = [(datetime.now() - timedelta(days=30*i)).strftime('%Y-%m-%d') 
                 for i in range(months)]
        dates.reverse()
        
        trends = {
            'dates': dates,
            'glucose': [random.randint(90, 140) for _ in range(months)],
            'bp_systolic': [random.randint(110, 150) for _ in range(months)],
            'weight': [random.randint(65, 80) for _ in range(months)],
            'bmi': [round(random.uniform(22, 28), 1) for _ in range(months)]
        }
        
        # Calculate insights
        glucose_trend = "increasing" if trends['glucose'][-1] > trends['glucose'][0] else "decreasing"
        bp_trend = "increasing" if trends['bp_systolic'][-1] > trends['bp_systolic'][0] else "decreasing"
        
        avg_glucose = sum(trends['glucose']) / len(trends['glucose'])
        avg_bp = sum(trends['bp_systolic']) / len(trends['bp_systolic'])
        
        # Insights based on language
        if language.lower() == "hindi":
            glucose_msg = "बढ़ रहा है" if glucose_trend == "increasing" else "कम हो रहा है"
            bp_msg = "बढ़ रहा है" if bp_trend == "increasing" else "कम हो रहा है"
            
            insights = [
                f"📊 पिछले {months} महीनों में ग्लूकोज {glucose_msg}",
                f"💓 रक्तचाप {bp_msg}",
                f"📈 औसत ग्लूकोज: {avg_glucose:.0f} mg/dL",
                f"📉 औसत बीपी: {avg_bp:.0f} mmHg",
            ]
            if settings.has_gemini_key and (glucose_trend == "increasing" or bp_trend == "increasing"):
                insights.append("⚠️ बिगड़ते रुझान मिले हैं - व्यक्तिगत सलाह के लिए AI विश्लेषण पर विचार करें")
        else:
            insights = [
                f"📊 Glucose is {glucose_trend} over past {months} months",
                f"💓 Blood pressure is {bp_trend}",
                f"📈 Average glucose: {avg_glucose:.0f} mg/dL",
                f"📉 Average BP: {avg_bp:.0f} mmHg",
            ]
            if settings.has_gemini_key and (glucose_trend == "increasing" or bp_trend == "increasing"):
                insights.append("⚠️ Worsening trends detected - consider AI analysis for personalized advice")
        
        return {
            "success": True,
            "patient_id": patient_id,
            "trends": trends,
            "insights": insights,
            "averages": {
                'glucose': avg_glucose,
                'bp': avg_bp
            },
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# VOICE ENDPOINTS
# ============================================================================

@app.post("/api/voice/synthesize")
async def voice_synthesize(
    text: str = Form("Hello World"),
    language: str = Form("en")
):
    """
    Text-to-Speech synthesis endpoint
    Converts text to speech audio (MP3)
    
    Args:
        text: Text to convert to speech
        language: Language code (en, hi, ta, te, bn, mr, gu)
    
    Returns:
        Audio file (MP3 format)
    """
    try:
        # Get audio data from voice service
        audio_data = text_to_speech(text, language)
        
        # Return audio file
        from fastapi.responses import Response
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.get("/api/patients")
async def get_patients(search: str = "", skip: int = 0, limit: int = 500, grouped: bool = False, db_instance: Any = Depends(get_db)):
    """Get list of patients from MongoDB with optional search, pagination and grouping"""
    try:
        query = {}
        if search:
            query = {
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"patient_ref": {"$regex": search, "$options": "i"}}
                ]
            }
        
        if grouped:
            # Return categorized groups for high-contrast overview
            critical = list(db_instance.patients_critical.find(query).skip(skip).limit(limit//3))
            monitoring = list(db_instance.patients_monitoring.find(query).skip(skip).limit(limit//3))
            optimal = list(db_instance.patients_optimal.find(query).skip(skip).limit(limit//3))
            
            for group in [critical, monitoring, optimal]:
                for p in group:
                    p["_id"] = str(p["_id"])
                    p["patient_id"] = p.get("patient_ref")
                    # Convert datetimes to ISO strings for frontend
                    if "clinical_status_updated" in p and isinstance(p["clinical_status_updated"], datetime):
                        p["clinical_status_updated"] = p["clinical_status_updated"].isoformat()
                    if "created_at" in p and isinstance(p["created_at"], datetime):
                        p["created_at"] = p["created_at"].isoformat()
            
            return {
                "success": True,
                "count": len(critical) + len(monitoring) + len(optimal),
                "total_db_count": db_instance.patients.count_documents(query),
                "partition_counts": {
                    "critical": db_instance.patients_critical.count_documents(query),
                    "monitoring": db_instance.patients_monitoring.count_documents(query),
                    "optimal": db_instance.patients_optimal.count_documents(query)
                },
                "groups": {
                    "critical": critical,
                    "monitoring": monitoring,
                    "optimal": optimal
                }
            }
            
        patients = list(db_instance.patients.find(query).skip(skip).limit(limit))
        total_count = db_instance.patients.count_documents(query)
        
        # Format for frontend (convert ObjectId string)
        for p in patients:
            p["_id"] = str(p["_id"])
            p["patient_id"] = p.get("patient_ref")
            if "clinical_status_updated" in p and isinstance(p["clinical_status_updated"], datetime):
                p["clinical_status_updated"] = p["clinical_status_updated"].isoformat()
            if "created_at" in p and isinstance(p["created_at"], datetime):
                p["created_at"] = p["created_at"].isoformat()

        return {
            "success": True,
            "count": len(patients),
            "total_db_count": total_count,
            "patients": patients
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Database error: {str(e)}"
        }

@app.get("/api/patients/partition/{category}")
async def get_partitioned_patients(category: str, skip: int = 0, limit: int = 100, db_instance: Any = Depends(get_db)):
    """Get patients from specific clinical partitions (critical, monitoring, optimal) with pagination"""
    try:
        collection_name = f"patients_{category}"
        if collection_name not in ["patients_critical", "patients_monitoring", "patients_optimal"]:
             raise HTTPException(status_code=400, detail="Invalid partition category")
             
        patients = list(db_instance[collection_name].find().skip(skip).limit(limit))
        for p in patients:
            p["_id"] = str(p["_id"])
            p["patient_id"] = p.get("patient_ref")
            
        return {
            "success": True,
            "category": category,
            "count": len(patients),
            "patients": patients
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/patients/{patient_id}")
async def get_patient_detail(patient_id: str, db_instance: Any = Depends(get_db)):
    """Get full detail for a specific patient via MongoDB"""
    try:
        data = get_patient_history(db_instance, patient_id)
        if not data.get("found"):
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {
            "success": True,
            "patient": data.get("patient"),
            "history": data.get("diagnoses"), # Mapped to diagnoses for consistency
            "consultations": data.get("consultations")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models/status")
async def models_status():
    """Get ML models loading status"""
    return {
        "success": True,
        "ml_models_loaded": len(models),
        "models": {
            'diabetes': 'diabetes' in models,
            'heart': 'heart' in models,
            'kidney': 'kidney' in models
        },
        "ai_status": {
            "provider": "Google Gemini",
            "configured": settings.has_gemini_key,
            "model": settings.DEFAULT_MODEL if settings.has_gemini_key else "not_configured"
        },
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# ADVANCED INTEGRATIONS — OpenFDA | ICD-10 | MedlinePlus | WHO
# ============================================================================

@app.post("/api/drug/check")
async def drug_interaction_check(request: DrugCheckRequest):
    """
    💊 Drug Interaction & Adverse Event Checker (OpenFDA)
    Input: list of drug names
    Returns: adverse events, total FDA reports, severity rating
    """
    try:
        result = await check_drug_interactions(
            request.drugs,
            api_key=settings.OPENFDA_API_KEY
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/drug/info/{drug_name}")
async def drug_info(drug_name: str):
    """
    💊 Get Drug Label Information (OpenFDA)
    Returns: brand name, generic name, indications, warnings, dosage
    """
    try:
        result = await get_drug_info(drug_name, api_key=settings.OPENFDA_API_KEY)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/icd10/search")
async def icd10_search(terms: str, max_results: int = 10):
    """
    🏥 ICD-10 Disease Code Lookup (NLM ClinicalTables — free, no key)
    Returns: matching ICD-10 codes with descriptions
    """
    try:
        result = await search_icd10(terms, max_results=max_results)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/medlineplus/{disease}")
async def medlineplus_info(disease: str, language: str = "english"):
    """
    📖 Patient-Friendly Disease Info (NLM MedlinePlus — free, no key)
    Returns: plain-language disease summaries, symptoms, treatments, resource links
    """
    try:
        result = await get_medlineplus_info(disease, language=language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/who-stats")
async def who_stats(indicator: str = "life_expectancy", country: str = "IND"):
    """
    🌍 WHO Global Health Statistics (WHO GHO API — free, no key)
    Available indicators: life_expectancy, diabetes_prevalence, hypertension,
    obesity, cardiovascular_mortality, kidney_disease
    """
    try:
        result = await get_who_stats(indicator=indicator, country=country)
        result["available_indicators"] = list(WHO_INDICATORS.keys())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/collaborative-consensus")
async def ai_collaborative_consensus(request: SecondOpinionRequest):
    """
    🤝 Dual-AI Consensus Engine
    Stages: GPT-4o evaluates -> Gemini synthesizes into final consensus
    """
    try:
        predictions = make_all_predictions(request.patient_data)
        
        # 2. Collaborative Consensus
        result = await analyze(request.patient_data.dict(), predictions, language=request.language)
        
        if not result.get("success"):
            return result
            
        return {
            "success": True,
            "risk_level": result.get("risk_level", "MODERATE"),
            "ml_predictions": predictions,
            "gpt_base_analysis": result.get("gpt_raw", ""),
            "consensus_report": result.get("response", ""),
            "model": "Dual-AI Collaborative Consensus (GPT-4o + Gemini)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DATABASE ENDPOINTS — SQLite Persistent Patient Storage
# ============================================================================

@app.post("/api/db/patient")
async def db_save_patient(request: SavePatientRequest, db: Any = Depends(get_db)):
    """
    💾 Save Patient to SQLite Database
    Optionally also saves disease predictions if patient_data is provided
    Returns: patient_ref (use this as ID for future lookups)
    """
    try:
        patient = save_patient(
            db,
            name=request.name,
            age=request.age,
            gender=request.gender,
            phone=request.phone or "",
            email=request.email or "",
            patient_ref=request.patient_ref or ""
        )

        # Also save disease predictions if vitals provided
        saved_diagnoses = []
        if request.save_predictions and request.patient_data:
            predictions = make_all_predictions(request.patient_data)
            vitals = request.patient_data.dict()
            for disease, risk in predictions.items():
                diag = save_diagnosis(db, patient.patient_ref, disease, risk, vitals)
                saved_diagnoses.append({
                    "disease": disease,
                    "risk_score": diag.get("risk_score"),
                    "prediction": diag.get("prediction")
                })

        return {
            "success": True,
            "message": "Patient saved to database",
            "patient_ref": patient.get("patient_ref"),
            "patient_id": patient.get("id"),
            "diagnoses_saved": len(saved_diagnoses),
            "diagnoses": saved_diagnoses,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/db/patient/{patient_ref}/history")
async def db_patient_history(patient_ref: str, db: Any = Depends(get_db)):
    """
    📊 Get Full Patient History from SQLite Database
    Returns: all saved diagnoses, consultations, vitals trend
    """
    try:
        history = get_patient_history(db, patient_ref)
        if not history.get("found"):
            raise HTTPException(status_code=404, detail=f"Patient '{patient_ref}' not found in database")
        return {"success": True, **history}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/db/stats")
async def db_stats(db: Any = Depends(get_db)):
    """
    📈 Database Statistics — overview of all stored data
    """
    try:
        total_patients    = db.patients.count_documents({})
        total_diagnoses   = db.diagnoses.count_documents({})
        total_consults    = db.consultations.count_documents({})
        return {
            "success": True,
            "database": "MongoDB (healthcare_db)",
            "total_patients": total_patients,
            "total_diagnoses": total_diagnoses,
            "total_consultations": total_consults,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pharmacy/inventory")
async def api_get_inventory(db: Any = Depends(get_db)):
    """Fetch current medicine stock from pharmacy across all categories"""
    try:
        from database import get_inventory
        inventory = get_inventory(db)
        return {"success": True, "inventory": inventory}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pharmacy/stock-update")
async def api_update_stock(request: StockUpdateRequest, db: Any = Depends(get_db)):
    """Update stock level for a specific medication (e.g. after dispensing)"""
    try:
        from database import update_stock
        success = update_stock(db, request.med_id, request.change)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/pharmacy/recommendations/{village_name}")
async def api_get_recommendations(village_name: str, db: Any = Depends(get_db)):
    """AI-powered stock recommendations based on village disease prevalence"""
    try:
        from database import get_stock_recommendations
        recs = get_stock_recommendations(db, village_name)
        return {"success": True, "recommendations": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*70)
    print("Healthcare AI System - Gemini Edition")
    print("="*70)
    print(f"ML Models loaded: {len(models)}/3")
    if settings.has_gemini_key:
        print(f"AI Provider: Google Gemini")
        print(f"Model: {settings.DEFAULT_MODEL}")
        print(f"Cost: {'FREE tier!' if 'flash' in settings.DEFAULT_MODEL else '$0.00125/1K chars'}")
    if not settings.has_gemini_key:
        print(f"WARNING: AI not configured - Get free key at:")
        print(f"   https://makersuite.google.com/app/apikey")
    print("Server: http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("Interactive: http://localhost:8000/redoc")
    print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")