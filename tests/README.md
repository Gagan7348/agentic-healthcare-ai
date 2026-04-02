# Healthcare AI Tests

This directory contains tests for the Healthcare AI System.

## Test Files

- `test_api.py` - API endpoint tests
- `test_ml_models.py` - ML model tests
- `conftest.py` - Pytest configuration

## Running Tests

### Run All Tests
```
bash
pytest tests/
```

### Run Specific Test File
```
bash
pytest tests/test_api.py
pytest tests/test_ml_models.py
```

### Run with Verbose Output
```
bash
pytest tests/ -v
```

### Run with Coverage
```
bash
pytest tests/ --cov=backend --cov-report=html
```

## Test Categories

### API Tests
- Root endpoint
- Health check
- Prediction endpoints
- Error handling

### ML Model Tests
- Model loading
- Prediction functionality
- Output validation
- Binary classification

## Requirements

Install test dependencies:
```
bash
pip install pytest pytest-cov httpx
```

## Notes

- Some tests may be skipped if models are not available
- API tests require the backend to be running
- ML model tests require the model files to be present
