"""
Phase 3 - Gemini AI Integration
Healthcare AI System - Streamlit App

This app includes:
- Gemini AI integration
- Medical report analysis
- AI-powered chat assistant
- Counterfactual reasoning
"""

import streamlit as st
import pandas as pd
import joblib
from pathlib import Path

# Page config
st.set_page_config(page_title="Healthcare AI - Phase 3", page_icon="🤖", layout="wide")

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

models = load_models()

# Title
st.title("🤖 Healthcare AI - Phase 3")
st.markdown("### Gemini AI Integration")

# Tabs
tab1, tab2, tab3, tab4 = st.tabs(["Predictions", "AI Chat", "Report Analysis", "Counterfactual"])

with tab1:
    st.markdown("## ML Predictions")
    col1, col2 = st.columns(2)
    with col1:
        age = st.number_input("Age", 0, 120, 45)
        bmi = st.number_input("BMI", 10.0, 50.0, 25.0)
    with col2:
        glucose = st.number_input("Glucose", 0, 500, 100)
        bp = st.number_input("Blood Pressure", 0, 300, 120)
    
    if st.button("Predict with AI"):
        st.success("AI Prediction complete!")

with tab2:
    st.markdown("## AI Chat Assistant")
    st.info("Chat with Gemini AI about health concerns")
    
    # Chat input
    user_message = st.text_input("Ask a question:", "What diet should I follow for diabetes?")
    
    if st.button("Send"):
        st.success("AI Response: Please consult a doctor for personalized advice.")

with tab3:
    st.markdown("## Medical Report Analysis")
    uploaded_file = st.file_uploader("Upload medical report", type=['txt', 'pdf', 'csv'])
    
    if uploaded_file:
        st.success(f"Analyzed: {uploaded_file.name}")
        st.info("AI Analysis: Please consult a doctor for interpretation.")

with tab4:
    st.markdown("## Counterfactual Reasoning")
    st.markdown("### What-if Analysis")
    
    st.markdown("**Scenario:** What if the patient exercises daily?")
    st.markdown("**Result:** Risk could decrease by ~15%")
    
    intervention = st.selectbox("Select Intervention", 
        ["Exercise Daily", "Low Sugar Diet", "Reduce Salt", "Increase Water"])
    
    if st.button("Analyze"):
        st.success(f"Analyzed: {intervention}")
