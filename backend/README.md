# Healthcare AI Backend

FastAPI-based REST API for the Agentic Healthcare AI System with Gemini AI integration.

## Features

- **REST API**: Full REST API with FastAPI
- **ML Predictions**: Diabetes, Heart Disease, and Kidney Disease prediction endpoints
- **Gemini AI**: AI-powered chat and medical report analysis
- **Multilingual Support**: Hindi and English support
- **ASHA Mode**: Community health worker decision support
- **Voice I/O**: Voice input and output support
- **Patient Database**: Patient management and analysis

## Installation

1. Install dependencies:
```
bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and add your API keys:
```
bash
cp .env.example .env
```

3. Add your Gemini API key in `.env`:
```
GEMINI_API_KEY=your_api_key_here
```

## Running the Server

### Development
```
bash
python main.py
```

### Production
```
bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check

### Predictions
- `POST /predict/diabetes` - Predict diabetes risk
- `POST /predict/heart` - Predict heart disease risk
- `POST /predict/kidney` - Predict kidney disease risk
- `POST /predict/all` - Predict all diseases

### AI Services
- `POST /chat` - Chat with Gemini AI
- `POST /analyze-report` - Analyze medical report

### Patient Data
- `GET /patients` - Get all patients
- `GET /patients/{patient_id}` - Get patient details

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Request Examples

### Diabetes Prediction
```
json
{
  "age": 45,
  "gender": "Male",
  "bmi": 28.5,
  "glucose": 140,
  "cholesterol": 220,
  "blood_pressure_systolic": 130
}
```

### Chat Request
```
json
{
  "message": "What diet should I follow for diabetes?",
  "language": "en"
}
```

## Project Structure

```
backend/
├── main.py           # FastAPI application
├── config.py         # Configuration management
├── ai_services.py    # Gemini AI services
├── requirements.txt  # Python dependencies
├── .env.example     # Environment template
└── README.md         # This file
```

## Technologies

- **FastAPI**: Modern Python web framework
- **Gemini AI**: Google AI for medical analysis
- **Scikit-learn**: Machine learning models
- **Pydantic**: Data validation

## License

MIT License
