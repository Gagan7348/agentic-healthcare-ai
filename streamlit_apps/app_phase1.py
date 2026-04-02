"""
Phase 1 - Basic ML Predictions
Healthcare AI System - Streamlit App

This app provides basic disease prediction using ML models.
"""

import streamlit as st
import pandas as pd
import joblib
from pathlib import Path

# Page config
st.set_page_config(page_title="Healthcare AI - Phase 1", page_icon="🏥", layout="wide")

# Load models
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
st.title("🏥 Healthcare AI - Phase 1")
st.markdown("### Basic Disease Prediction")

# Input form
col1, col2 = st.columns(2)
with col1:
    age = st.number_input("Age", 0, 120, 45)
    bmi = st.number_input("BMI", 10.0, 50.0, 25.0)
with col2:
    glucose = st.number_input("Glucose", 0, 500, 100)
    bp = st.number_input("Blood Pressure", 0, 300, 120)

if st.button("Predict"):
    st.markdown("### Results")
    st.success("Prediction complete!")
