# Gemini AI Setup Guide

This guide explains how to set up and configure Gemini AI for the Healthcare AI System.

## Prerequisites

- Google Cloud Account
- Gemini API Key

## Getting Started

### Step 1: Get Gemini API Key

1. Go to Google AI Studio (https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy your API key

### Step 2: Configure API Key

Add your API key to the `.env` file in the `backend` directory:

```
env
GEMINI_API_KEY=your_api_key_here
```

### Step 3: Verify Setup

Test the API key by making a request:

```
bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "language": "en"}'
```

## Gemini Features

### 1. AI Chat Assistant

The chat endpoint provides AI-powered responses to health questions:

```
POST /chat
{
  "message": "What are the symptoms of diabetes?",
  "language": "en"
}
```

### 2. Medical Report Analysis

Analyze medical reports using Gemini AI:

```
POST /analyze-report
```

Upload a file (PDF, TXT, CSV) and Gemini will analyze it.

### 3. Diet Plans

Generate personalized diet plans:

```
POST /chat
{
  "message": "Generate a diet plan for diabetes",
  "patient_context": {"disease": "diabetes", "risk_level": 0.7},
  "language": "en"
}
```

### 4. Counterfactual Reasoning

"What-if" analysis:

```
POST /chat
{
  "message": "What if the patient exercises daily?",
  "patient_context": {"age": 45, "bmi": 28},
  "language": "en"
}
```

## Configuration Options

### Model Selection

In `backend/config.py`:

```
python
GEMINI_MODEL = "gemini-pro"  # or "gemini-pro-vision"
```

### Temperature

Control response creativity:

```
python
GEMINI_TEMPERATURE = 0.7  # 0.0 = focused, 1.0 = creative
```

### Max Tokens

Control response length:

```
python
GEMINI_MAX_TOKENS = 2048
```

## Troubleshooting

### API Key Issues

**Error: "GEMINI_API_KEY not set"**
- Check your `.env` file
- Verify the API key is correct
- Ensure no spaces around the key

### Rate Limiting

**Error: "Rate limit exceeded"**
- Wait a few minutes
- Check Google AI Studio quota

### Response Errors

**Error: "Invalid JSON"**
- Check the request format
- Verify content-type header

## Security Best Practices

1. **Never commit API keys** - Use `.env` files
2. **Rotate keys regularly** - Update in Google AI Studio
3. **Monitor usage** - Check Google Cloud Console

## Advanced Configuration

### Custom Prompts

Edit `backend/ai_services.py` to customize AI behavior:

```
python
prompt = f"""
You are a healthcare AI assistant.
Language: {language}
Patient Context: {context}
User Message: {message}
"""
```

### Multiple Models

Use different models for different tasks:

```
python
model = genai.GenerativeModel('gemini-pro-vision')  # For images
model = genai.GenerativeModel('gemini-pro')  # For text
```

## Cost Management

Gemini AI pricing:
- Free tier available
- Pay per token
- Monitor usage in Google Cloud Console

## Support

- Google AI Documentation: https://cloud.google.com/ai-platform/docs
- API Reference: https://ai.google.dev/docs
