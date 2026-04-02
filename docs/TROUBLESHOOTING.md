# Troubleshooting Guide

Common issues and their solutions for the Healthcare AI System.

## Backend Issues

### Port Already in Use

**Error:** `Error: [Errno 10048] Only one usage of each socket address is normally permitted`

**Solution:**
1. Find the process using the port:
   - Windows: `netstat -ano | findstr 8000`
   - Linux/Mac: `lsof -i :8000`
2. Kill the process or use a different port

### Module Not Found

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```
bash
pip install -r requirements.txt
```

### API Key Issues

**Error:** `GEMINI_API_KEY not set`

**Solution:**
1. Create a `.env` file in the backend directory
2. Add `GEMINI_API_KEY=your_api_key`
3. Restart the server

## Frontend Issues

### CORS Errors

**Error:** `Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**
1. Check backend CORS configuration in `main.py`
2. Ensure `allow_origins=["*"]` is set

### Build Errors

**Error:** `Error: Cannot find module 'some-module'`

**Solution:**
```
bash
rm -rf node_modules
npm install
```

### Port Conflicts

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```
bash
# Find process
netstat -ano | findstr 3000
# Kill process
taskkill /PID <process_id> /F
```

## ML Model Issues

### Model Files Not Found

**Error:** `FileNotFoundError: [Errno 2] No such file or directory: 'ml/models/diabetes_model.pkl'`

**Solution:**
1. Ensure model files are in the correct directory
2. Check the path in the code matches the actual location
3. Models should be in: `Agentic_Healthcare_AI/ml/models/`

### Model Loading Errors

**Error:** `AttributeError: 'NoneType' object has no attribute 'predict_proba'`

**Solution:**
1. Check if model loaded successfully
2. Verify model file is not corrupted
3. Retrain the model if needed

## Streamlit Issues

### Streamlit Not Installed

**Error:** `ModuleNotFoundError: No module named 'streamlit'`

**Solution:**
```
bash
pip install streamlit
```

### Page Not Found

**Error:** `Streamlit page not found`

**Solution:**
1. Run from the correct directory
2. Check file path is correct

## Data Issues

### CSV File Not Found

**Error:** `FileNotFoundError: [Errno 2] No such file or directory: 'dataset/data/structured/patient_data.csv'`

**Solution:**
1. Check the data directory exists
2. Ensure CSV file is present
3. Verify file path in code

### Data Format Issues

**Error:** `KeyError: 'some_column'`

**Solution:**
1. Check CSV column names match expected names
2. Verify data format is correct

## Voice/Audio Issues

### Microphone Not Available

**Error:** `AttributeError: 'NoneType' object has no attribute 'Microphone'`

**Solution:**
1. Install SpeechRecognition: `pip install SpeechRecognition`
2. Install pyaudio: `pip install pyaudio`
3. Check microphone permissions

### gTTS Issues

**Error:** `ModuleNotFoundError: No module named 'gtts'`

**Solution:**
```
bash
pip install gtts
```

## Gemini AI Issues

### API Quota Exceeded

**Error:** `429 Resource exhausted`

**Solution:**
1. Wait for quota to reset
2. Check Google Cloud Console for usage
3. Consider upgrading plan

### Invalid API Key

**Error:** `401 Unauthorized`

**Solution:**
1. Verify API key is correct
2. Check API key is enabled
3. Regenerate key in Google AI Studio

## General Issues

### Python Version Issues

**Error:** `SyntaxError: invalid syntax` (with new Python features)

**Solution:**
1. Check Python version: `python --version`
2. Upgrade Python to 3.8+
3. Use virtual environment

### Virtual Environment Issues

**Error:** `Module not found` even after installation

**Solution:**
1. Activate virtual environment
2. Reinstall requirements
3. Check PYTHONPATH

### Permission Errors

**Error:** `PermissionError: [Errno 13] Permission denied`

**Solution:**
1. Run terminal as administrator
2. Check file permissions
3. Change file ownership

## Getting Help

If you encounter issues not listed here:
1. Check the logs for detailed error messages
2. Search for the error message online
3. Check GitHub issues
4. Ask in the community

## Debug Mode

Enable debug mode for more information:

```
python
# In backend/.env
DEBUG=True
```

This will show detailed error messages and stack traces.
