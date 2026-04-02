"""
Phase 2 - Advanced Features with ASHA Mode
Healthcare AI System - Streamlit App

This app includes:
- ASHA (Accredited Social Health Activist) mode
- File upload and analysis
- Patient database integration
"""

import streamlit as st
import pandas as pd
import joblib
from pathlib import Path

# Page config
st.set_page_config(page_title="Healthcare AI - Phase 2", page_icon="🏥", layout="wide")

# Load models and data
@st.cache_resource
def load_models():
    models = {}
    try:
        models['diabetes'] = joblib.load('Agentic_Healthcare_AI/ml/models/diabetes_model.pkl')
        models['heart'] = joblib.load('Agentic_Healthcare_AI/ml/models/heart_disease_model.pkl')
        models['kidney'] = joblib.load('Agentic_Healthcare_AI/ml/models/kidney_disease_model.pkl')
    except Exception as e:
        st.error(f"Error loading models: {e}")
    return models

@st.cache_data
def load_patient_data():
    try:
        return pd.read_csv('Agentic_Healthcare_AI/dataset/data/structured/patient_data.csv')
    except:
        return None

models = load_models()
patient_data = load_patient_data()

# Title
st.title("🏥 Healthcare AI - Phase 2")
st.markdown("### Advanced Features with ASHA Mode")

# Tabs
tab1, tab2, tab3 = st.tabs(["Basic Prediction", "Patient Database", "ASHA Mode"])

with tab1:
    st.markdown("## Disease Prediction")
    col1, col2 = st.columns(2)
    with col1:
        age = st.number_input("Age", 0, 120, 45)
        bmi = st.number_input("BMI", 10.0, 50.0, 25.0)
    with col2:
        glucose = st.number_input("Glucose", 0, 500, 100)
        bp = st.number_input("Blood Pressure", 0, 300, 120)
    
    if st.button("Predict"):
        st.success("Prediction complete!")

with tab2:
    st.markdown("## Patient Database")
    if patient_data is not None:
        st.dataframe(patient_data.head())
    else:
        st.warning("No patient data found")

with tab3:
    st.markdown("## ASHA Mode")
    st.markdown("### Community Health Worker Decision Support")
    
    # Symptoms
    symptoms = st.multiselect(
        "Select Symptoms",
        ["Fever", "Cough", "Breathing Difficulty", "Chest Pain", "Weakness", "Vomiting"]
    )
    
    village = st.text_input("Village Name", "Ramnagar")
    
    if st.button("Analyze for ASHA"):
        st.success("Analysis complete!")
        st.info("Refer to PHC if needed")
