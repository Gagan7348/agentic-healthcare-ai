"""
ASHA Mode App for Agentic_Healthcare_AI
Simple interface for rural community health workers
Uses YOUR models from models/ folder
Works with YOUR patient_data.csv
"""

import streamlit as st
import pandas as pd
import joblib
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# Import ASHA adapter
try:
    from asha.asha_adapter import ASHAAdapter, convert_for_asha
    ASHA_AVAILABLE = True
except:
    ASHA_AVAILABLE = False
    st.error("⚠️ ASHA adapter not found. Make sure asha/asha_adapter.py exists")

# Page config
st.set_page_config(
    page_title="ASHA स्वास्थ्य सहायक",
    page_icon="🏥",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
    .big-urgency {
        font-size: 32px;
        font-weight: bold;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        margin: 20px 0;
    }
    .red-urgency {
        background-color: #ffcccc;
        color: #cc0000;
        border: 3px solid #cc0000;
    }
    .yellow-urgency {
        background-color: #ffffcc;
        color: #cc6600;
        border: 3px solid #cc6600;
    }
    .green-urgency {
        background-color: #ccffcc;
        color: #006600;
        border: 3px solid #006600;
    }
</style>
""", unsafe_allow_html=True)

# Title
st.title("🏥 ASHA स्वास्थ्य सहायक")
st.markdown("### Community Health Worker Decision Support System")
st.markdown("*आपके गाँव की सेहत, हमारी ज़िम्मेदारी*")
st.markdown("---")

# Load YOUR models
@st.cache_resource
def load_models():
    """Load YOUR trained models"""
    models = {}
    scalers = {}
    features = {}
    
    model_dir = Path('models')
    
    for disease in ['diabetes', 'heart', 'kidney']:
        try:
            models[disease] = joblib.load(model_dir / f'{disease}_model.pkl')
            scalers[disease] = joblib.load(model_dir / f'{disease}_scaler.pkl')
            features[disease] = joblib.load(model_dir / f'{disease}_features.pkl')
        except:
            pass
    
    return models, scalers, features

# Load YOUR patient data (optional - for quick selection)
@st.cache_data
def load_patient_data():
    """Load patient data for quick selection"""
    try:
        df = pd.read_csv('dataset/data/structured/patient_data.csv')
        return df
    except:
        return None

models, scalers, feature_names = load_models()
patient_data = load_patient_data()

# Sidebar
st.sidebar.header("📋 System Status")
st.sidebar.success(f"✅ {len(models)} AI मॉडल लोड हैं")
for disease in models.keys():
    st.sidebar.write(f"  • {disease.title()}")

if patient_data is not None:
    st.sidebar.info(f"📊 {len(patient_data)} patients available")

st.sidebar.markdown("---")
st.sidebar.header("📋 Mode Selection")

# Mode selection
mode = st.sidebar.radio(
    "क्या करना है?",
    ["🗣️ मरीज की जांच करें", "👤 Patient से Data लें"],
    index=0
)

# MODE 1: Symptom Assessment
if "मरीज की जांच" in mode:
    st.header("🗣️ मरीज की जानकारी")
    
    # Symptom checklist
    st.subheader("मुख्य लक्षण (जो दिख रहे हैं उन्हें tick करें):")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        fever = st.checkbox("🌡️ बुखार")
        cough = st.checkbox("😷 खांसी")
        vomiting = st.checkbox("🤮 उल्टी")
        diarrhea = st.checkbox("💩 दस्त")
    
    with col2:
        breathing_difficulty = st.checkbox("🫁 सांस लेने में दिक्कत")
        chest_pain = st.checkbox("💔 सीने में दर्द")
        not_eating = st.checkbox("🍽️ खाना नहीं खा रहा")
        weakness = st.checkbox("😴 बहुत कमजोरी")
    
    with col3:
        unconscious = st.checkbox("😵 बेहोश है या सोया रहता है")
        severe_bleeding = st.checkbox("🩸 बहुत खून बह रहा")
        very_high_fever = st.checkbox("🌡️ बहुत तेज़ बुखार (>103°F)")
    
    st.markdown("---")
    
    # Patient details
    st.subheader("मरीज की बाकी जानकारी:")
    
    col1, col2 = st.columns(2)
    
    with col1:
        age = st.number_input("उम्र (years):", min_value=0, max_value=120, value=35)
        gender = st.selectbox("लिंग:", ["पुरुष", "महिला", "बच्चा"])
    
    with col2:
        village = st.text_input("गाँव का नाम:", placeholder="उदाहरण: रामपुर")
        days_sick = st.number_input("कितने दिन से बीमार है:", min_value=0, value=2)
    
    # Description
    symptoms_text = st.text_area(
        "बीमारी के बारे में और बताएं:",
        placeholder="उदाहरण: 3 दिन से बुखार है, खाना नहीं खा रहा, बहुत कमजोरी है",
        height=100
    )
    
    # Lab values if available
    with st.expander("अगर कोई test हुआ है तो results यहाँ डालें:"):
        col1, col2, col3 = st.columns(3)
        
        with col1:
            glucose = st.number_input("Blood Sugar:", min_value=0, value=0)
            bp_systolic = st.number_input("BP (ऊपर वाला number):", min_value=0, value=0)
        
        with col2:
            cholesterol = st.number_input("Cholesterol:", min_value=0, value=0)
            creatinine = st.number_input("Creatinine:", min_value=0.0, value=0.0, step=0.1, format="%.1f")
        
        with col3:
            bmi = st.number_input("BMI:", min_value=0.0, value=0.0, step=0.1, format="%.1f")
    
    # Analyze button
    if st.button("🔍 विश्लेषण करें / ANALYZE", type="primary", use_container_width=True):
        if not ASHA_AVAILABLE:
            st.error("ASHA adapter not available. Check installation.")
            st.stop()
        
        with st.spinner("AI विश्लेषण कर रहा है..."):
            
            # Compile symptoms
            symptoms_data = {
                'age': age,
                'gender': gender,
                'village': village,
                'days_sick': days_sick,
                'symptoms_text': symptoms_text,
                'chest_pain': chest_pain,
                'severe_breathing_difficulty': breathing_difficulty,
                'unconscious': unconscious
            }
            
            # Compile patient data
            patient_input = {
                'age': age,
                'gender': gender
            }
            
            if glucose > 0:
                patient_input['glucose'] = glucose
            if bp_systolic > 0:
                patient_input['blood_pressure_systolic'] = bp_systolic
            if cholesterol > 0:
                patient_input['cholesterol'] = cholesterol
            if creatinine > 0:
                patient_input['creatinine'] = creatinine
            if bmi > 0:
                patient_input['bmi'] = bmi
            
            # Make predictions using YOUR models
            predictions = {}
            for disease in models.keys():
                try:
                    feats = feature_names[disease]
                    
                    # Default values
                    default_values = {
                        'age': age,
                        'bmi': bmi if bmi > 0 else 25,
                        'glucose': glucose if glucose > 0 else 100,
                        'cholesterol': cholesterol if cholesterol > 0 else 200,
                        'blood_pressure_systolic': bp_systolic if bp_systolic > 0 else 120,
                        'blood_pressure': bp_systolic if bp_systolic > 0 else 120,
                        'creatinine': creatinine if creatinine > 0 else 1.0
                    }
                    
                    input_vals = [default_values.get(f, 50) for f in feats]
                    input_df = pd.DataFrame([input_vals], columns=feats)
                    input_scaled = scalers[disease].transform(input_df)
                    prob = models[disease].predict_proba(input_scaled)[0][1]
                    
                    predictions[disease] = prob
                except Exception as e:
                    st.warning(f"Could not predict {disease}: {e}")
            
            # Convert to ASHA format
            asha_guidance = convert_for_asha(predictions, patient_input, symptoms_data)
            
            # DISPLAY RESULTS
            
            # 1. URGENCY (Big and prominent!)
            urgency = asha_guidance['urgency_level']
            
            if "RED" in urgency:
                st.markdown(f'<div class="big-urgency red-urgency">{urgency}</div>', unsafe_allow_html=True)
                st.error(f"⏰ {asha_guidance['when_to_see_doctor']}")
            elif "YELLOW" in urgency:
                st.markdown(f'<div class="big-urgency yellow-urgency">{urgency}</div>', unsafe_allow_html=True)
                st.warning(f"⏰ {asha_guidance['when_to_see_doctor']}")
            else:
                st.markdown(f'<div class="big-urgency green-urgency">{urgency}</div>', unsafe_allow_html=True)
                st.success(f"⏰ {asha_guidance['when_to_see_doctor']}")
            
            st.markdown("---")
            
            # 2. IMMEDIATE ACTIONS
            st.subheader("🎯 तुरंत ये करें:")
            for i, action in enumerate(asha_guidance['immediate_actions'], 1):
                st.markdown(f"**{i}.** {action}")
            
            st.markdown("---")
            
            # 3. FAMILY ADVICE
            st.subheader("👨‍👩‍👧 परिवार को ये बताएं:")
            st.info(asha_guidance['family_advice'])
            
            st.markdown("---")
            
            # 4. CALL SCRIPT
            st.subheader("📞 Doctor को फ़ोन करना है तो ये बोलें:")
            st.code(asha_guidance['call_doctor_script'], language="text")
            
            # Download buttons
            col1, col2 = st.columns(2)
            with col1:
                st.download_button(
                    "📥 Call Script Download करें",
                    asha_guidance['call_doctor_script'],
                    file_name=f"doctor_call_script_{village}.txt",
                    mime="text/plain"
                )
            
            st.markdown("---")
            
            # 5. FOLLOW-UP PLAN
            st.subheader("📋 आगे ये काम करने हैं:")
            for task in asha_guidance['follow_up_tasks']:
                st.checkbox(
                    f"{task['task']} ({task['when']})",
                    key=f"task_{task['task'][:20]}"
                )
            
            # Record case
            st.markdown("---")
            if st.button("✅ इस Case को Record करें"):
                st.success(f"✅ Case record हो गया! Patient: {village}, Age: {age}")

# MODE 2: Quick Patient Selection (from YOUR data)
elif "Patient से Data" in mode:
    st.header("👤 Patient Selection")
    
    if patient_data is None:
        st.error("Patient data not found. Make sure dataset/data/structured/patient_data.csv exists")
    else:
        patient_ids = patient_data['patient_id'].tolist() if 'patient_id' in patient_data.columns else patient_data.index.tolist()
        
        selected_patient = st.selectbox(
            "Select Patient:",
            patient_ids,
            format_func=lambda x: f"Patient {x}"
        )
        
        if st.button("🔍 Analyze Patient", type="primary"):
            # Get patient row
            if 'patient_id' in patient_data.columns:
                patient_row = patient_data[patient_data['patient_id'] == selected_patient].iloc[0]
            else:
                patient_row = patient_data.loc[selected_patient]
            
            # Make predictions
            predictions = {}
            for disease in models.keys():
                try:
                    feats = feature_names[disease]
                    input_vals = [patient_row.get(f, 50) for f in feats]
                    input_df = pd.DataFrame([input_vals], columns=feats)
                    input_scaled = scalers[disease].transform(input_df)
                    prob = models[disease].predict_proba(input_scaled)[0][1]
                    predictions[disease] = prob
                except:
                    pass
            
            # Convert to ASHA format
            patient_dict = patient_row.to_dict()
            asha_guidance = convert_for_asha(predictions, patient_dict, {})
            
            # Display (same as above)
            urgency = asha_guidance['urgency_level']
            
            if "RED" in urgency:
                st.markdown(f'<div class="big-urgency red-urgency">{urgency}</div>', unsafe_allow_html=True)
            elif "YELLOW" in urgency:
                st.markdown(f'<div class="big-urgency yellow-urgency">{urgency}</div>', unsafe_allow_html=True)
            else:
                st.markdown(f'<div class="big-urgency green-urgency">{urgency}</div>', unsafe_allow_html=True)
            
            st.markdown("---")
            st.subheader("🎯 तुरंत ये करें:")
            for action in asha_guidance['immediate_actions']:
                st.write(f"• {action}")

# Footer
st.markdown("---")
st.markdown("*ASHA Agent Mode - Phase 2B | Uses your Phase 1 models*")
st.caption("आपके गाँव की सेहत, हमारी ज़िम्मेदारी")