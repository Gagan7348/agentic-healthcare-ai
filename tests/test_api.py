"""
API Tests for Healthcare AI Backend
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()


def test_predict_diabetes():
    """Test diabetes prediction endpoint"""
    response = client.post("/predict/diabetes", json={
        "age": 45,
        "gender": "Male",
        "bmi": 25.0,
        "glucose": 140,
        "cholesterol": 200,
        "blood_pressure_systolic": 120
    })
    assert response.status_code == 200
    data = response.json()
    assert "disease" in data
    assert "probability" in data
    assert "risk_level" in data


def test_predict_heart():
    """Test heart disease prediction endpoint"""
    response = client.post("/predict/heart", json={
        "age": 45,
        "gender": "Male",
        "bmi": 25.0,
        "glucose": 140,
        "cholesterol": 200,
        "blood_pressure_systolic": 120
    })
    assert response.status_code == 200
    data = response.json()
    assert "disease" in data
    assert "probability" in data
    assert "risk_level" in data


def test_predict_kidney():
    """Test kidney disease prediction endpoint"""
    response = client.post("/predict/kidney", json={
        "age": 45,
        "gender": "Male",
        "bmi": 25.0,
        "glucose": 140,
        "cholesterol": 200,
        "blood_pressure_systolic": 120,
        "creatinine": 1.0
    })
    assert response.status_code == 200
    data = response.json()
    assert "disease" in data
    assert "probability" in data
    assert "risk_level" in data


def test_predict_all():
    """Test predict all diseases endpoint"""
    response = client.post("/predict/all", json={
        "age": 45,
        "gender": "Male",
        "bmi": 25.0,
        "glucose": 140,
        "cholesterol": 200,
        "blood_pressure_systolic": 120,
        "creatinine": 1.0
    })
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) == 3


def test_invalid_input():
    """Test with invalid input"""
    response = client.post("/predict/diabetes", json={
        "age": "invalid"
    })
    assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
