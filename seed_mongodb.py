import pandas as pd
from pymongo import MongoClient
import os
import random
from datetime import datetime

def seed():
    print("Connecting to MongoDB...")
    
    import sys
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))
    try:
        from Agentic_Healthcare_AI.backend.config import settings
        db_url = settings.DATABASE_URL
    except Exception:
        db_url = 'mongodb://localhost:27017/'
        
    client = MongoClient(db_url)
    db = client.get_default_database("healthcare_db")

    patient_file = 'dataset/data/structured/patient_data.csv'
    lab_file = 'dataset/data/structured/lab_results.csv'

    print("Dropping existing collections...")
    db.patients.drop()
    db.diagnoses.drop()

    # Patients
    if not os.path.exists(patient_file):
        print(f"❌ Error: {patient_file} not found.")
        return

    print(f"Reading {patient_file}...")
    df_patients = pd.read_csv(patient_file)

    patients_to_insert = []
    diagnoses_to_insert = []

    print("Preparing patient and diagnosis data...")
    for index, row in df_patients.iterrows():
        pref = str(row.get('patient_id', f"P{random.randint(10000, 99999)}"))
        name = f"{row.get('first_name', 'Unknown')} {row.get('last_name', 'Patient')}"
        
        # Patient Record
        patients_to_insert.append({
            "patient_ref": pref,
            "name": name,
            "age": int(row.get('age', 30)),
            "gender": str(row.get('gender', 'Other')),
            "phone": f"+1-555-{random.randint(1000, 9999)}",
            "email": f"{row.get('first_name', 'no').lower()}.{row.get('last_name', 'email').lower()}@example.com",
            "created_at": datetime.utcnow().isoformat()
        })
        
        # Determine risks from CSV
        disease = "Healthy"
        if row.get('diabetes_risk') == 1: disease = "Diabetes Risk"
        if row.get('heart_disease_risk') == 1: disease = "Heart Disease Risk"
        
        risk_score = 0.5
        if disease != "Healthy": risk_score = 0.85
            
        prediction = "Positive" if disease != "Healthy" else "Negative"

        # Diagnosis Record from Patient Data
        diagnoses_to_insert.append({
            "patient_ref": pref,
            "disease": disease,
            "prediction": prediction,
            "confidence": round(random.uniform(0.70, 0.99), 2),
            "risk_score": risk_score,
            "model_used": "Legacy Screening",
            "glucose": float(row.get('glucose', 90)),
            "bp": f"{row.get('blood_pressure_systolic', 120)}/{row.get('blood_pressure_diastolic', 80)}",
            "bmi": float(row.get('bmi', 25.0)),
            "hba1c": float(row.get('hba1c', 5.5)),
            "cholesterol": float(row.get('cholesterol', 180)),
            "creatinine": float(row.get('creatinine', 1.0)),
            "created_at": datetime.utcnow().isoformat()
        })

    print(f"Inserting {len(patients_to_insert)} patients...")
    if patients_to_insert:
        db.patients.insert_many(patients_to_insert)
        db.patients.create_index("patient_ref", unique=True)
        
    if diagnoses_to_insert:
        print(f"Inserting {len(diagnoses_to_insert)} base diagnoses...")
        db.diagnoses.insert_many(diagnoses_to_insert)
        db.diagnoses.create_index("patient_ref")

    # Lab Results
    if os.path.exists(lab_file):
        print(f"Reading {lab_file}...")
        df_labs = pd.read_csv(lab_file)
        lab_diags = []
        for index, row in df_labs.iterrows():
            pref = str(row.get('patient_id', ""))
            if not pref: continue
            
            lab_diags.append({
                 "patient_ref": pref,
                 "disease": str(row.get('test_type', "Lab Test")),
                 "prediction": "Completed",
                 "confidence": 1.0,
                 "risk_score": 0.0,
                 "model_used": "Lab Hardware",
                 "glucose": float(row.get('glucose', 90) if not pd.isna(row.get('glucose')) else 90.0),
                 "bp": "120/80", 
                 "bmi": 25.0,
                 "hba1c": float(row.get('hba1c', 5.5) if not pd.isna(row.get('hba1c')) else 5.5),
                 "cholesterol": float(row.get('cholesterol_total', 180) if not pd.isna(row.get('cholesterol_total')) else 180.0),
                 "creatinine": float(row.get('creatinine', 1.0) if not pd.isna(row.get('creatinine')) else 1.0),
                 "created_at": datetime.utcnow().isoformat() 
            })
            
        if lab_diags:
            print(f"Inserting {len(lab_diags)} lab diagnoses...")
            db.diagnoses.insert_many(lab_diags)
            
    print("✅ Database seeding complete!")

if __name__ == "__main__":
    seed()
