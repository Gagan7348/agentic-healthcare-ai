import streamlit as st
import joblib
import pandas as pd
import os
import json

st.set_page_config(
    page_title="Healthcare Risk Prediction Models Trainer",
    layout="wide"
)

st.title("Healthcare Risk Prediction Models Trainer")
st.markdown("""
This application predicts health risks such as **Diabetes**, **Heart Disease**, and **Kidney Disease**
using pre-trained machine learning models based on patient data and lab results.
""")

MODEL_DIR = "ml/models"

disease_icons = {
    "diabetes": "🩸",
    "heart_disease": "❤️",
    "kidney_disease": "🩺"
}

disease_names = {
    "diabetes": "Diabetes",
    "heart_disease": "Heart Disease",
    "kidney_disease": "Kidney Disease"
}

if not os.path.exists(MODEL_DIR):
    st.error("Models directory not found.")
    st.stop()

try:
    with open(os.path.join(MODEL_DIR, "training_summary.json"), "r") as f:
        training_summary = json.load(f)
        available_models = training_summary.get("models_trained", [])
        st.sidebar.success(
            f"Available Trained Models: {', '.join(available_models)}"
        )
except Exception:
    st.error("training_summary.json not found.")
    st.stop()

@st.cache_resource
def load_models():
    models = {}
    scalers = {}
    features = {}

    for disease in available_models:
        try:
            models[disease] = joblib.load(f"{MODEL_DIR}/{disease}_model.pkl")
            scalers[disease] = joblib.load(f"{MODEL_DIR}/{disease}_scaler.pkl")
            features[disease] = joblib.load(f"{MODEL_DIR}/{disease}_features.pkl")
        except Exception as e:
            st.error(f"Error loading model for {disease}: {e}")

    return models, scalers, features


models, scalers, feature_names = load_models()

all_features = set()
for feat_list in feature_names.values():
    all_features.update(feat_list)

st.sidebar.header("Input Patient Data")
st.sidebar.markdown("Provide patient data to predict health risks.")

feature_configs = {
    "age": {"label": "Age (years)", "min": 0, "max": 100, "default": 30, "step": 1},
    "bmi": {"label": "BMI (kg/m²)", "min": 10.0, "max": 50.0, "default": 22.0, "step": 0.1},
    "glucose": {"label": "Glucose (mg/dL)", "min": 50, "max": 300, "default": 100, "step": 1},
    "cholesterol": {"label": "Cholesterol (mg/dL)", "min": 100, "max": 400, "default": 180, "step": 1},
    "blood_pressure_systolic": {"label": "Systolic BP (mm Hg)", "min": 80, "max": 200, "default": 120, "step": 1},
    "creatinine": {"label": "Creatinine (mg/dL)", "min": 0.1, "max": 10.0, "default": 1.0, "step": 0.1},
    "fasting_glucose": {"label": "Fasting Glucose (mg/dL)", "min": 50, "max": 300, "default": 90, "step": 1},
}

patient_input = {}

st.sidebar.subheader("Lab Values")

for feature in sorted(all_features):
    cfg = feature_configs.get(
        feature,
        {"label": feature.replace("_", " ").title(), "min": 0.0, "max": 1000.0, "default": 50.0, "step": 1.0},
    )

    patient_input[feature] = st.sidebar.number_input(
        label=cfg["label"],
        min_value=cfg["min"],
        max_value=cfg["max"],
        value=cfg["default"],
        step=cfg["step"],
    )

analyze_button = st.sidebar.button("Analyze Health Risks")

def get_risk_level(prob):
    if prob > 0.7:
        return "High"
    elif prob > 0.4:
        return "Medium"
    else:
        return "Low"

if analyze_button:
    st.markdown("## Health Risk Predictions")

    with st.spinner("Analyzing..."):
        predictions = {}

        for disease in available_models:
            disease_features = feature_names.get(disease, [])

            input_df = pd.DataFrame(
                [[patient_input[f] for f in disease_features]],
                columns=disease_features,
            )

            input_scaled = scalers[disease].transform(input_df)
            prob = models[disease].predict_proba(input_scaled)[0][1]
            predictions[disease] = prob

    cols = st.columns(len(predictions))

    for idx, (disease, prob) in enumerate(predictions.items()):
        with cols[idx]:
            risk_level = get_risk_level(prob)
            st.markdown(f"### {disease_icons[disease]} {disease_names[disease]}")
            st.metric(
                label="Risk Level",
                value=risk_level,
                delta=f"{prob * 100:.1f}% probability",
            )
            st.progress(prob)

    st.markdown("## Overall Assessment")

    max_risk = max(predictions.values())
    max_disease = max(predictions, key=predictions.get)

    if max_risk > 0.7:
        st.error(
            f"High overall risk detected for **{disease_names[max_disease]}** "
            f"({max_risk * 100:.1f}%). Consult a healthcare professional."
        )
    else:
        st.success("Overall Low to Medium risk detected. Maintain a healthy lifestyle.")

    summary_df = pd.DataFrame({
        "Disease": [disease_names[d] for d in predictions.keys()],
        "Risk Probability": [f"{p * 100:.1f}%" for p in predictions.values()],
        "Risk Level": [get_risk_level(p) for p in predictions.values()],
    })

    st.dataframe(summary_df, use_container_width=True)

    with st.expander("View Input Values"):
        input_df = pd.DataFrame.from_dict(
            patient_input, orient="index", columns=["Value"]
        )
        st.dataframe(input_df, use_container_width=True)

else:
    st.info("Enter patient information in the sidebar and click **Analyze Health Risks**.")

    st.markdown("## About This System")
    st.markdown("""
This AI-based system predicts health risks using machine learning models trained on
anonymized patient data. It is **not a diagnostic tool** and should not replace
professional medical advice.
""")

    for disease in available_models:
        features = ", ".join(
            [f.replace("_", " ").title() for f in feature_names.get(disease, [])]
        )
        st.markdown(f"### {disease_icons[disease]} {disease_names[disease]}")
        st.markdown(f"**Features Used:** {features}")

    if "accuracies" in training_summary:
        acc_df = pd.DataFrame([
            {
                "Disease": disease_names.get(d, d.title()),
                "Accuracy": f"{training_summary['accuracies'].get(d, 0) * 100:.2f}%"
            }
            for d in available_models
        ])
        st.dataframe(acc_df, use_container_width=True)
    st.markdown("""
**Disclaimer:** This system is for educational purposes only. Always consult a healthcare professional for medical advice""")