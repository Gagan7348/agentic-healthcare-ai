# Complete Setup Guide

This guide provides detailed setup instructions for the Healthcare AI System.

## System Requirements

### Hardware
- CPU: 4+ cores recommended
- RAM: 8GB+ recommended
- Storage: 10GB+ for models and data

### Software
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

## Project Structure

```
Agentic_Healthcare_AI/
├── backend/           # FastAPI backend
│   ├── main.py        # Main application
│   ├── config.py      # Configuration
│   ├── ai_services.py # Gemini AI services
│   └── requirements.txt
├── frontend/          # React frontend
│   ├── src/          # React components
│   └── package.json
├── streamlit_apps/   # Streamlit apps
├── ml/               # ML models
│   └── models/       # Trained models
├── dataset/          # Data files
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Backend Setup

### 1. Create Virtual Environment

```
bash
cd backend
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate
```

### 2. Install Dependencies

```
bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```
env
GEMINI_API_KEY=your_gemini_api_key
DEBUG=False
API_HOST=0.0.0.0
API_PORT=8000
```

### 4. Download ML Models

Ensure ML models are in `ml/models/`:
- diabetes_model.pkl
- diabetes_scaler.pkl
- diabetes_features.pkl
- heart_disease_model.pkl
- heart_disease_scaler.pkl
- heart_disease_features.pkl
- kidney_disease_model.pkl
- kidney_disease_scaler.pkl
- kidney_disease_features.pkl

### 5. Start Backend

```
bash
python main.py
```

The API will be available at http://localhost:8000

## Frontend Setup

### 1. Install Dependencies

```
bash
cd frontend
npm install
```

### 2. Configure API URL

Update `vite.config.js` if backend runs on different port:

```
javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

### 3. Start Frontend

```
bash
npm run dev
```

The app will be available at http://localhost:3000

## Streamlit Apps Setup

### 1. Install Streamlit

```
bash
pip install streamlit
```

### 2. Run Apps

```
bash
# Phase 1 - Basic
streamlit run streamlit_apps/app_phase1.py

# Phase 2 - Advanced
streamlit run streamlit_apps/app_phase2.py

# Phase 3 - Gemini AI
streamlit run streamlit_apps/app_phase3_gemini.py
```

## Database Setup

### Patient Data

Place patient data CSV in `dataset/data/structured/`:

```
bash
patient_data.csv
```

Required columns:
- patient_id
- age
- gender
- bmi
- glucose
- cholesterol
- blood_pressure_systolic
- creatinine

## Testing

### Run Tests

```
bash
pytest tests/
```

### API Testing

```
bash
# Test health endpoint
curl http://localhost:8000/health

# Test prediction
curl -X POST http://localhost:8000/predict/diabetes \
  -H "Content-Type: application/json" \
  -d '{"age": 45, "gender": "Male", "bmi": 25, "glucose": 140}'
```

## Production Deployment

### Backend (using Gunicorn)

```
bash
pip install gunicorn
gunicorn main:app --workers 4 --bind 0.0.0.0:8000
```

### Frontend (build)

```
bash
npm run build
```

The built files will be in `dist/`

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

## Next Steps

- Configure Gemini AI: [GEMINI_SETUP_GUIDE.md](GEMINI_SETUP_GUIDE.md)
- API Reference: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
