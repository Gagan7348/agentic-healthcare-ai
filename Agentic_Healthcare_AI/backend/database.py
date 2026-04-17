"""
MongoDB Database Layer - Healthcare AI System
PyMongo for persistent patient & diagnosis storage
"""

import os
import random
from datetime import datetime
from typing import Optional, List, Dict

from pymongo import MongoClient
from config import settings

DATABASE_URL = settings.DATABASE_URL

# Initialize MongoDB Client
try:
    client = MongoClient(DATABASE_URL)
    # Extract database name and strip query parameters if present
    db_path = DATABASE_URL.split('//')[-1].split('/')[-1]
    db_name = db_path.split('?')[0] if '?' in db_path else (db_path or "healthcare_ai")
    db = client[db_name]
except Exception as e:
    print(f"ERROR: MongoDB Connection Error: {e}")
    db = None

# ── Dependency ────────────────────────────────────────────────────────────────
def get_db():
    """Dependency: returns the MongoDB database instance"""
    return db

# ── Initialization ────────────────────────────────────────────────────────────
def init_db():
    """Verify connection and create indexes"""
    if db is not None:
        try:
            # Create indexes for performance
            db.patients.create_index("patient_ref", unique=True)
            db.diagnoses.create_index("patient_ref")
            db.consultations.create_index("patient_ref")
            db.pharmacy_inventory.create_index("med_id", unique=True)
            
            # Specialized partitioned collection indexes
            db.patients_critical.create_index("patient_ref", unique=True)
            db.patients_monitoring.create_index("patient_ref", unique=True)
            db.patients_optimal.create_index("patient_ref", unique=True)
            
            print(f"OK: MongoDB Initialized -> {DATABASE_URL}")
        except Exception as e:
            print(f"WARNING: MongoDB Index Creation Failed: {e}")
    else:
        print("ERROR: MongoDB Not Initialized: Connection failed.")

# ── CRUD helpers ──────────────────────────────────────────────────────────────

def save_patient(db_instance, name: str, age: int, gender: str,
                 phone: str = "", email: str = "", patient_ref: str = "") -> Dict:
    """Create or update a patient record"""
    if patient_ref:
        existing = db_instance.patients.find_one({"patient_ref": patient_ref})
        if existing:
            return existing

    patient_ref = patient_ref or f"P{random.randint(1000, 9999)}"
    patient = {
        "patient_ref": patient_ref,
        "name": name,
        "age": age,
        "gender": gender,
        "phone": phone,
        "email": email,
        "created_at": datetime.utcnow()
    }
    
    result = db_instance.patients.insert_one(patient)
    patient["id"] = str(result.inserted_id)
    return patient


def save_diagnosis(db_instance, patient_ref: str, disease: str, risk_score: float,
                   vitals: dict = None) -> Dict:
    """Save a diagnosis prediction result and trigger partitioning"""
    vitals = vitals or {}
    prediction = "Positive" if risk_score > 0.5 else "Negative"
    confidence = round(70 + abs(risk_score - 0.5) * 50, 1)

    diag = {
        "patient_ref": patient_ref,
        "disease": disease,
        "prediction": prediction,
        "confidence": confidence,
        "risk_score": round(risk_score, 4),
        "model_used": "XGBoost Stacking Ensemble",
        "glucose": vitals.get("glucose"),
        "bp": vitals.get("bp"),
        "bmi": vitals.get("bmi"),
        "hba1c": vitals.get("hba1c"),
        "cholesterol": vitals.get("cholesterol"),
        "creatinine": vitals.get("creatinine"),
        "created_at": datetime.utcnow()
    }
    
    result = db_instance.diagnoses.insert_one(diag)
    diag["id"] = str(result.inserted_id)
    
    # Trigger clinical partitioning based on new vitals
    partition_patient(db_instance, patient_ref, vitals)
    
    return diag


def partition_patient(db_instance, patient_ref: str, vitals: dict):
    """
    Categorize patient into specialized collections for high-contrast clinical views.
    Thresholds:
    - Critical (High Risk): Glucose > 180 or HbA1c > 8.0
    - Monitoring (Elevated): Glucose > 120 or HbA1c > 6.5
    - Optimal (Stable): Others
    """
    glucose = vitals.get("glucose") or 0
    hba1c = vitals.get("hba1c") or 0
    
    # Fetch base patient data
    patient = db_instance.patients.find_one({"patient_ref": patient_ref})
    if not patient:
        return

    # Determine clinical target collection
    target_collection = "patients_optimal"
    if glucose > 180 or hba1c > 8.0:
        target_collection = "patients_critical"
    elif glucose > 120 or hba1c > 6.5:
        target_collection = "patients_monitoring"

    # Remove from all specialized collections first (to handle transitions)
    db_instance.patients_critical.delete_one({"patient_ref": patient_ref})
    db_instance.patients_monitoring.delete_one({"patient_ref": patient_ref})
    db_instance.patients_optimal.delete_one({"patient_ref": patient_ref})

    # Add to target collection with latest vitals snapshot
    partitioned_record = patient.copy()
    partitioned_record["latest_glucose"] = glucose
    partitioned_record["latest_hba1c"] = hba1c
    partitioned_record["clinical_status_updated"] = datetime.utcnow()
    
    db_instance[target_collection].insert_one(partitioned_record)
    print(f"📌 Patient {patient_ref} partitioned into {target_collection}")


def get_patient_history(db_instance, patient_ref: str) -> Dict:
    """Fetch full history for a patient from MongoDB"""
    patient = db_instance.patients.find_one({"patient_ref": patient_ref})
    if not patient:
        return {"found": False}

    def safe_dt(value):
        """Convert datetime or str timestamp to ISO string safely."""
        if value is None:
            return None
        if isinstance(value, str):
            return value  # already ISO string (from legacy seed data)
        try:
            return value.isoformat()
        except Exception:
            return str(value)

    def safe_truncate(text, limit=300):
        """Truncate a text field safely even if it is None."""
        if not text:
            return text
        return text[:limit] + "..." if len(text) > limit else text

    # Fetch diagnoses sorted by date
    diagnoses = list(db_instance.diagnoses.find({"patient_ref": patient_ref}).sort("created_at", -1))
    
    # Fetch latest consultations
    consultations = list(db_instance.consultations.find({"patient_ref": patient_ref}).sort("created_at", -1).limit(20))

    return {
        "found": True,
        "patient": {
            "patient_ref": patient.get("patient_ref"),
            "name": patient.get("name"),
            "age": patient.get("age"),
            "gender": patient.get("gender"),
            "phone": patient.get("phone"),
            "email": patient.get("email"),
            "registered": safe_dt(patient.get("created_at")),
        },
        "diagnoses": [
            {
                "disease": d.get("disease"),
                "prediction": d.get("prediction"),
                "confidence": d.get("confidence"),
                "risk_score": d.get("risk_score"),
                "glucose": d.get("glucose"),
                "bp": d.get("bp"),
                "bmi": d.get("bmi"),
                "date": safe_dt(d.get("created_at")),
            }
            for d in diagnoses
        ],
        "consultations": [
            {
                "message": c.get("message"),
                "response": safe_truncate(c.get("response")),
                "ai_model": c.get("ai_model"),
                "date": safe_dt(c.get("created_at")),
            }
            for c in consultations
        ],
        "total_diagnoses": len(diagnoses),
        "total_consultations": len(consultations),
    }

# ── Pharmacy Helpers ─────────────────────────────────────────────────────────

def get_inventory(db_instance) -> List[Dict]:
    """Fetch entire pharmacy inventory sorted by priority"""
    inventory = list(db_instance.pharmacy_inventory.find({}, {"_id": 0}))
    # Priority sorting: Critical -> Essential -> Important
    priority_map = {"Critical": 0, "Essential": 1, "Important": 2}
    return sorted(inventory, key=lambda x: priority_map.get(x.get("priority", "Important"), 3))


def update_stock(db_instance, med_id: str, quantity_change: int) -> bool:
    """Increment or decrement stock for a specific medicine"""
    result = db_instance.pharmacy_inventory.update_one(
        {"med_id": med_id},
        {"$inc": {"current_stock": quantity_change}, "$set": {"last_updated": datetime.utcnow()}}
    )
    return result.modified_count > 0


def get_stock_recommendations(db_instance, village_name: str) -> List[Dict]:
    """
    Advanced logic to suggest stock based on local village disease trends.
    Compares local diagnosis frequency with current inventory alerts.
    """
    # 1. Get recent diagnoses for this village
    # We first need to get all patients from this village
    patients = list(db_instance.patients.find({"village": village_name}, {"patient_ref": 1}))
    patient_refs = [p["patient_ref"] for p in patients]
    
    # 2. Extract top diseases
    pipeline = [
        {"$match": {"patient_ref": {"$in": patient_refs}}},
        {"$group": {"_id": "$disease", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    disease_trends = list(db_instance.diagnoses.aggregate(pipeline))
    
    # 3. Match with medicine mapping (simulated join)
    inventory = list(db_instance.pharmacy_inventory.find({}, {"_id": 0}))
    recommendations = []
    
    for disease in disease_trends:
        # Find medicines indicated for this disease
        # Note: In a real system, we'd have a many-to-many mapping
        # Here we'll match by 'indication' tag or similar
        related_meds = [m for m in inventory if disease["_id"] in m.get("indications", [])]
        for med in related_meds:
            gap = max(0, med["min_stock"] - med["current_stock"])
            recommendations.append({
                "medicine": med["name"],
                "disease": disease["_id"],
                "frequency": disease["count"],
                "current_stock": med["current_stock"],
                "suggested_add": gap + (disease["count"] * 5) # Heuristic for replenishment
            })
            
    return recommendations
