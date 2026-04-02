# API Documentation

Complete API documentation for the Healthcare AI Backend.

## Base URL

```
http://localhost:8000
```

## Endpoints

### Health Check

#### GET /
Root endpoint

**Response:**
```
json
{
  "message": "Healthcare AI API",
  "version": "1.0.0",
  "status": "running"
}
```

#### GET /health
Health check endpoint

**Response:**
```
json
{
  "status": "healthy",
  "models_loaded": 3
}
```

### Predictions

#### POST /predict/diabetes
Predict diabetes risk

**Request Body:**
```
json
{
  "age": 45,
  "gender": "Male",
  "bmi": 25.0,
  "glucose": 140,
  "cholesterol": 200,
  "blood_pressure_systolic": 120
}
```

**Response:**
```
json
{
  "disease": "diabetes",
  "probability": 0.65,
  "risk_level": "medium",
  "recommendations": [
    "Control sugar intake",
    "Exercise daily",
    "Consult doctor"
  ]
}
```

#### POST /predict/heart
Predict heart disease risk

**Request Body:**
```
json
{
  "age": 45,
  "gender": "Male",
  "bmi": 25.0,
  "glucose": 140,
  "cholesterol": 200,
  "blood_pressure_systolic": 120
}
```

**Response:**
```
json
{
  "disease": "heart",
  "probability": 0.45,
  "risk_level": "medium",
  "recommendations": [
    "Reduce salt intake",
    "Exercise regularly",
    "Monitor blood pressure"
  ]
}
```

#### POST /predict/kidney
Predict kidney disease risk

**Request Body:**
```
json
{
  "age": 45,
  "gender": "Male",
  "bmi": 25.0,
  "glucose": 140,
  "cholesterol": 200,
  "blood_pressure_systolic": 120,
  "creatinine": 1.0
}
```

**Response:**
```
json
{
  "disease": "kidney",
  "probability": 0.30,
  "risk_level": "low",
  "recommendations": [
    "Stay hydrated",
    "Limit protein intake",
    "Regular checkups"
  ]
}
```

#### POST /predict/all
Predict all diseases at once

**Request Body:**
```
json
{
  "age": 45,
  "gender": "Male",
  "bmi": 25.0,
  "glucose": 140,
  "cholesterol": 200,
  "blood_pressure_systolic": 120,
  "creatinine": 1.0
}
```

**Response:**
```
json
{
  "predictions": [
    {
      "disease": "diabetes",
      "probability": 0.65,
      "risk_level": "medium"
    },
    {
      "disease": "heart",
      "probability": 0.45,
      "risk_level": "medium"
    },
    {
      "disease": "kidney",
      "probability": 0.30,
      "risk_level": "low"
    }
  ]
}
```

### AI Services

#### POST /chat
Chat with Gemini AI

**Request Body:**
```
json
{
  "message": "What diet should I follow for diabetes?",
  "patient_context": {
    "age": 45,
    "glucose": 140
  },
  "language": "en"
}
```

**Response:**
```
json
{
  "response": "For diabetes management, focus on...",
  "language": "en"
}
```

#### POST /analyze-report
Analyze medical report file

**Request:** Multipart form data with file

**Response:**
```
json
{
  "analysis": "Report analysis details...",
  "status": "success"
}
```

### Patient Data

#### GET /patients
Get all patients

**Response:**
```
json
{
  "patients": [
    {
      "patient_id": "P001",
      "age": 45,
      "gender": "Male",
      ...
    }
  ]
}
```

#### GET /patients/{patient_id}
Get specific patient

**Response:**
```
json
{
  "patient_id": "P001",
  "age": 45,
  "gender": "Male",
  "bmi": 25.0,
  ...
}
```

## Error Responses

All endpoints may return error responses:

```
json
{
  "detail": "Error message"
}
```

## Rate Limiting

No rate limiting is currently applied.

## Authentication

Currently no authentication required. Add in production.
