#!/bin/bash

# Run Streamlit App
# Starts a Streamlit application

echo "🚀 Starting Healthcare AI Streamlit App..."

# Check if streamlit is installed
if ! command -v streamlit &> /dev/null; then
    echo "Installing Streamlit..."
    pip install streamlit
fi

# Default to Phase 1
PHASE=${1:-1}

case $PHASE in
    1)
        echo "Starting Phase 1 - Basic ML..."
        streamlit run streamlit_apps/app_phase1.py
        ;;
    2)
        echo "Starting Phase 2 - Advanced Features..."
        streamlit run streamlit_apps/app_phase2.py
        ;;
    3)
        echo "Starting Phase 3 - Gemini AI..."
        streamlit run streamlit_apps/app_phase3_gemini.py
        ;;
    *)
        echo "Starting Phase 1 - Basic ML..."
        streamlit run streamlit_apps/app_phase1.py
        ;;
esac
