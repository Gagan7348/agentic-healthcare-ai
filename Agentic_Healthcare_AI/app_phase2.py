"""
Phase 2 App for Agentic_Healthcare_AI
Loads from YOUR dataset/data/structured/patient_data.csv
Uses YOUR trained models from models/
"""

import streamlit as st
import pandas as pd
import joblib
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# Import your report analyzer
try:
    from reports.report_analyzer import ReportAnalyzer
    ANALYZER_AVAILABLE = True
except:
    ANALYZER_AVAILABLE = False

# Import counterfactual analyzer
try:
    from reasoning.counterfactual import CounterfactualAnalyzer
    COUNTERFACTUAL_AVAILABLE = True
except:
    COUNTERFACTUAL_AVAILABLE = False

# Page config
st.set_page_config(
    page_title="Healthcare AI - Phase 2",
    page_icon="🏥",
    layout="wide"
)

# Title
st.title("🏥 Healthcare AI System - Phase 2")
st.markdown("### Enhanced Analysis with Medical Report Reading")
st.markdown("*Uses your trained models + patient data from Phase 1*")
st.markdown("---")

# Load your patient data
@st.cache_data
def load_patient_data():
    """Load patient data from dataset/data/structured/"""
    try:
        df = pd.read_csv('dataset/data/structured/patient_data.csv')
        return df
    except Exception as e:
        st.error(f"Error loading patient data: {e}")
        st.info("Make sure patient_data.csv exists in dataset/data/structured/")
        return None

# Load your trained models
@st.cache_resource
def load_models():
    """Load your trained models from models/"""
    models = {}
    scalers = {}
    features = {}
    
    # Try to load available models
    model_dir = Path('models')
    
    for disease in ['diabetes', 'heart', 'kidney']:
        model_path = model_dir / f'{disease}_model.pkl'
        scaler_path = model_dir / f'{disease}_scaler.pkl'
        features_path = model_dir / f'{disease}_features.pkl'
        
        if model_path.exists():
            try:
                models[disease] = joblib.load(model_path)
                scalers[disease] = joblib.load(scaler_path)
                features[disease] = joblib.load(features_path)
            except Exception as e:
                st.warning(f"Could not load {disease} model: {e}")
    
    return models, scalers, features

# Load data and models
patient_data = load_patient_data()
models, scalers, feature_names = load_models()

# Sidebar
st.sidebar.header("📊 System Status")
if patient_data is not None:
    st.sidebar.success(f"✅ {len(patient_data)} patients loaded")
else:
    st.sidebar.error("❌ No patient data")

st.sidebar.info(f"✅ {len(models)} models loaded")
for disease in models.keys():
    st.sidebar.write(f"  • {disease.title()}")

st.sidebar.markdown("---")
st.sidebar.header("📋 Mode Selection")

# Mode selection
mode = st.sidebar.radio(
    "Choose mode:",
    ["Patient Selection", "Upload Lab Report", "Manual Entry"],
    index=0
)

# Main content
if mode == "Patient Selection" and patient_data is not None:
    st.header("👤 Select Patient from Your Data")
    
    # Patient selector
    patient_ids = patient_data['patient_id'].tolist() if 'patient_id' in patient_data.columns else patient_data.index.tolist()
    
    selected_patient = st.selectbox(
        "Select Patient:",
        patient_ids,
        format_func=lambda x: f"Patient {x}"
    )
    
    if st.button("🔍 Analyze Patient", type="primary", use_container_width=True):
        # Get patient data
        if 'patient_id' in patient_data.columns:
            patient_row = patient_data[patient_data['patient_id'] == selected_patient].iloc[0]
        else:
            patient_row = patient_data.loc[selected_patient]
        
        # Display patient info
        st.subheader("Patient Information")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Patient ID", selected_patient)
            if 'age' in patient_row:
                st.metric("Age", patient_row['age'])
        
        with col2:
            if 'gender' in patient_row:
                st.metric("Gender", patient_row['gender'])
        
        with col3:
            if 'bmi' in patient_row:
                st.metric("BMI", f"{patient_row['bmi']:.1f}")
        
        st.markdown("---")
        
        # Make predictions using YOUR models
        st.subheader("🎯 Disease Risk Predictions")
        
        predictions = {}
        for disease in models.keys():
            try:
                # Get required features
                feats = feature_names[disease]
                
                # Extract patient values
                input_vals = []
                for feat in feats:
                    if feat in patient_row:
                        input_vals.append(patient_row[feat])
                    else:
                        # Use default if feature not available
                        default_values = {
                            'age': 45, 'bmi': 25, 'glucose': 100,
                            'cholesterol': 200, 'blood_pressure': 120,
                            'creatinine': 1.0
                        }
                        input_vals.append(default_values.get(feat, 50))
                
                # Make prediction
                input_df = pd.DataFrame([input_vals], columns=feats)
                input_scaled = scalers[disease].transform(input_df)
                prob = models[disease].predict_proba(input_scaled)[0][1]
                
                predictions[disease] = prob
            
            except Exception as e:
                st.warning(f"Could not predict {disease}: {e}")
        
        # Display predictions
        cols = st.columns(len(predictions))
        for idx, (disease, prob) in enumerate(predictions.items()):
            with cols[idx]:
                # Determine risk level
                if prob > 0.7:
                    risk_level = "HIGH"
                    color = "🔴"
                elif prob > 0.4:
                    risk_level = "MEDIUM"
                    color = "🟡"
                else:
                    risk_level = "LOW"
                    color = "🟢"
                
                st.markdown(f"### {disease.title()}")
                st.metric("Risk", f"{prob:.1%}")
                st.markdown(f"**{color} {risk_level} RISK**")
                st.progress(prob)
        
        # Counterfactual Analysis
        if COUNTERFACTUAL_AVAILABLE and predictions:
            st.markdown("---")
            st.subheader("💡 What Should You Change?")
            st.info("Here are the most effective changes to reduce your disease risk:")
            
            # Create tabs for each disease
            disease_tabs = st.tabs([f"{d.title()}" for d in predictions.keys()])
            
            for idx, disease in enumerate(predictions.keys()):
                with disease_tabs[idx]:
                    if predictions[disease] > 0.3:
                        try:
                            # Create patient input dict
                            patient_inputs = {feat: patient_row.get(feat, 50) for feat in feature_names[disease]}
                            
                            # Get suggestions
                            from reasoning.counterfactual import CounterfactualAnalyzer
                            cf_analyzer = CounterfactualAnalyzer(
                                disease,
                                models[disease],
                                scalers[disease],
                                feature_names[disease]
                            )
                            
                            suggestions = cf_analyzer.analyze(patient_inputs, num_suggestions=3)
                            
                            if suggestions:
                                for i, sug in enumerate(suggestions, 1):
                                    col1, col2 = st.columns([3, 1])
                                    
                                    with col1:
                                        st.markdown(f"**{i}. {sug['feature'].replace('_', ' ').title()}**")
                                        st.write(f"From {sug['current_value']:.1f} to {sug['target_value']:.1f} "
                                               f"({abs(sug['change_percent']):.0f}% reduction)")
                                    
                                    with col2:
                                        st.metric(
                                            "Risk Drop",
                                            f"{sug['risk_reduction']:.1%}",
                                            delta=f"→ {sug['new_risk']:.1%}",
                                            delta_color="inverse"
                                        )
                                    
                                    st.markdown("---")
                            else:
                                st.success("✅ Your values are already in a good range!")
                        
                        except Exception as e:
                            st.error(f"Error calculating suggestions: {e}")
                    else:
                        st.success(f"✅ Low {disease} risk - maintain healthy lifestyle!")
        
        # Check for available reports
        if ANALYZER_AVAILABLE:
            st.markdown("---")
            st.subheader("📄 Available Medical Reports")
            
            analyzer = ReportAnalyzer()
            available = analyzer.list_available_reports(selected_patient)
            
            if available:
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    if available.get('lab_report'):
                        if st.button("📋 View Lab Report"):
                            result = analyzer.read_lab_report_pdf(selected_patient)
                            if result['success']:
                                st.success("Lab report analyzed!")
                                for exp in result['explanations']:
                                    st.write(f"• {exp['test']}: {exp['value']} {exp['unit']} - {exp['status']}")
                
                with col2:
                    if available.get('clinical_note'):
                        if st.button("📝 View Clinical Note"):
                            result = analyzer.read_clinical_note(selected_patient)
                            if result['success']:
                                st.success("Clinical note loaded!")
                                st.text(result['raw_text'][:500] + "...")
                
                with col3:
                    if available.get('radiology'):
                        if st.button("📸 View Radiology"):
                            result = analyzer.read_radiology_report(selected_patient)
                            if result['success']:
                                st.success("Radiology report loaded!")
                                st.write(result['findings'])
                
                with col4:
                    if available.get('discharge_summary'):
                        if st.button("📄 View Discharge"):
                            result = analyzer.read_discharge_summary(selected_patient)
                            if result['success']:
                                st.success("Discharge summary loaded!")
                                st.write(result['content'])
            else:
                st.info("No medical reports found for this patient")

elif mode == "Upload Lab Report":
    st.header("📄 Upload Lab Report PDF")
    
    uploaded_file = st.file_uploader(
        "Choose a lab report PDF from your dataset/data/lab_reports/",
        type=['pdf']
    )
    
    if uploaded_file:
        st.success(f"Uploaded: {uploaded_file.name}")
        st.info("Lab report analysis will be added in next update!")

elif mode == "Manual Entry":
    st.header("✍️ Manual Entry Mode")
    st.info("This mode works like your Phase 1 app")
    
    # Manual input form
    col1, col2, col3 = st.columns(3)
    
    with col1:
        age = st.number_input("Age", min_value=0, max_value=120, value=45)
        glucose = st.number_input("Glucose (mg/dL)", min_value=0, value=100)
    
    with col2:
        gender = st.selectbox("Gender", ["Male", "Female"])
        cholesterol = st.number_input("Cholesterol (mg/dL)", min_value=0, value=200)
    
    with col3:
        bmi = st.number_input("BMI", min_value=10.0, max_value=50.0, value=25.0)
        blood_pressure = st.number_input("Blood Pressure (systolic)", min_value=0, value=120)
    
    if st.button("🔍 Analyze", type="primary", use_container_width=True):
        st.info("Manual entry predictions will match your Phase 1 app!")

# Footer
st.markdown("---")
st.markdown("*Phase 2 - Enhanced Analysis | Integrated with your Phase 1 models and data*")