# Streamlit Apps - Healthcare AI

This directory contains the Streamlit applications for different phases of the Healthcare AI System.

## Apps

### Phase 1 - Basic Predictions
- **File**: `app_phase1.py`
- **Features**: Basic ML predictions for Diabetes, Heart Disease, and Kidney Disease
- **Run**: `streamlit run app_phase1.py`

### Phase 2 - Advanced Features
- **File**: `app_phase2.py`
- **Features**: ASHA Mode, Patient Database, File Upload
- **Run**: `streamlit run app_phase2.py`

### Phase 3 - Gemini AI
- **File**: `app_phase3_gemini.py`
- **Features**: Gemini AI integration, Chat Assistant, Report Analysis, Counterfactual Reasoning
- **Run**: `streamlit run app_phase3_gemini.py`

## Installation

```
bash
# Install Streamlit
pip install streamlit

# Run an app
streamlit run app_phase1.py
```

## Requirements

- streamlit
- pandas
- joblib
- numpy

## Project Structure

```
streamlit_apps/
├── app_phase1.py       # Phase 1 - Basic ML
├── app_phase2.py       # Phase 2 - Advanced Features
├── app_phase3_gemini.py # Phase 3 - Gemini AI
└── README.md           # This file
```

## License

MIT License
