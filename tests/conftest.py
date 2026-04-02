"""
Pytest Configuration for Healthcare AI Tests
"""

import pytest
import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


@pytest.fixture(scope="session")
def models_dir():
    """Return the models directory path"""
    return Path("ml/models")


@pytest.fixture(scope="session")
def data_dir():
    """Return the data directory path"""
    return Path("dataset/data")


@pytest.fixture
def sample_patient_data():
    """Return sample patient data for testing"""
    return {
        "age": 45,
        "gender": "Male",
        "bmi": 25.0,
        "glucose": 140,
        "cholesterol": 200,
        "blood_pressure_systolic": 120,
        "creatinine": 1.0
    }


@pytest.fixture
def sample_prediction_request():
    """Return sample prediction request data"""
    return {
        "age": 45,
        "gender": "Male",
        "bmi": 25.0,
        "glucose": 140,
        "cholesterol": 200,
        "blood_pressure_systolic": 120,
        "creatinine": 1.0,
        "language": "en"
    }


def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
