"""
ML Model Tests for Healthcare AI
"""

import pytest
import joblib
from pathlib import Path
import numpy as np


# Model paths
MODELS_DIR = Path("ml/models")


@pytest.fixture
def diabetes_model():
    """Load diabetes model"""
    try:
        return joblib.load(MODELS_DIR / "diabetes_model.pkl")
    except:
        pytest.skip("Diabetes model not found")


@pytest.fixture
def heart_model():
    """Load heart disease model"""
    try:
        return joblib.load(MODELS_DIR / "heart_disease_model.pkl")
    except:
        pytest.skip("Heart disease model not found")


@pytest.fixture
def kidney_model():
    """Load kidney disease model"""
    try:
        return joblib.load(MODELS_DIR / "kidney_disease_model.pkl")
    except:
        pytest.skip("Kidney disease model not found")


def test_diabetes_model_exists(diabetes_model):
    """Test diabetes model exists and loads"""
    assert diabetes_model is not None


def test_heart_model_exists(heart_model):
    """Test heart disease model exists and loads"""
    assert heart_model is not None


def test_kidney_model_exists(kidney_model):
    """Test kidney disease model exists and loads"""
    assert kidney_model is not None


def test_diabetes_prediction(diabetes_model):
    """Test diabetes model prediction"""
    # Sample input: [age, gender, bmi, glucose, cholesterol, bp]
    test_input = [[45, 1, 25.0, 140, 200, 120]]
    
    prediction = diabetes_model.predict(test_input)
    probability = diabetes_model.predict_proba(test_input)
    
    assert prediction is not None
    assert probability is not None
    assert len(probability[0]) == 2  # Binary classification


def test_heart_prediction(heart_model):
    """Test heart disease model prediction"""
    test_input = [[45, 1, 25.0, 140, 200, 120]]
    
    prediction = heart_model.predict(test_input)
    probability = heart_model.predict_proba(test_input)
    
    assert prediction is not None
    assert probability is not None


def test_kidney_prediction(kidney_model):
    """Test kidney disease model prediction"""
    test_input = [[45, 1, 25.0, 140, 200, 120, 1.0]]
    
    prediction = kidney_model.predict(test_input)
    probability = kidney_model.predict_proba(test_input)
    
    assert prediction is not None
    assert probability is not None


def test_prediction_output_shape(diabetes_model):
    """Test prediction output shape"""
    test_input = [[45, 1, 25.0, 140, 200, 120]]
    
    prediction = diabetes_model.predict(test_input)
    
    assert prediction.shape == (1,)


def test_model_returns_binary(diabetes_model):
    """Test model returns binary output"""
    test_input = [[45, 1, 25.0, 140, 200, 120]]
    
    prediction = diabetes_model.predict(test_input)
    
    assert set(np.unique(prediction)).issubset({0, 1})


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
