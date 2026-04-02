# Quick Start Guide

Get up and running with the Healthcare AI System in 3 minutes!

## Prerequisites

- Python 3.8+
- Node.js 16+
- API keys (Gemini AI)

## Step 1: Clone/Setup

```
bash
# Navigate to project
cd Agentic_Healthcare_AI
```

## Step 2: Install Dependencies

### Backend
```
bash
cd backend
pip install -r requirements.txt
```

### Frontend
```
bash
cd frontend
npm install
```

## Step 3: Configure API Keys

Copy `.env.example` to `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

## Step 4: Run the Application

### Option A: Streamlit (Easiest)
```
bash
# Run Phase 1
streamlit run streamlit_apps/app_phase1.py

# Or Phase 2 with ASHA mode
streamlit run streamlit_apps/app_phase2.py

# Or Phase 3 with Gemini AI
streamlit run streamlit_apps/app_phase3_gemini.py
```

### Option B: FastAPI Backend + React Frontend
```
bash
# Terminal 1: Start backend
cd backend
python main.py

# Terminal 2: Start frontend
cd frontend
npm run dev
```

## Step 5: Access the Application

- Streamlit: http://localhost:8501
- FastAPI: http://localhost:8000
- React: http://localhost:3000

## Quick Test

1. Open the app in your browser
2. Enter patient data (Age: 45, Glucose: 140, etc.)
3. Click "Predict"
4. View the risk assessment

## Troubleshooting

- If models don't load, check `ml/models/` directory
- If API errors, verify your `.env` file has the correct API key
- Restart the server after making changes

## Next Steps

- Read the [Complete Setup Guide](COMPLETE_SETUP.md) for more details
- Check [API Documentation](API_DOCUMENTATION.md) for API endpoints
- See [Gemini Setup Guide](GEMINI_SETUP_GUIDE.md) for AI features
