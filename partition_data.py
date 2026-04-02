import sys
import os
from datetime import datetime
from pymongo import MongoClient

# Add project root to sys.path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

try:
    from Agentic_Healthcare_AI.backend.database import partition_patient, init_db
    from Agentic_Healthcare_AI.backend.config import settings
    DATABASE_URL = settings.DATABASE_URL
except ImportError:
    # Fallback for direct execution if module path fails
    DATABASE_URL = "mongodb://localhost:27017/healthcare_db"
    def partition_patient(db, pref, vitals):
        # Re-implement logic if import fails
        glucose = vitals.get("glucose") or 0
        hba1c = vitals.get("hba1c") or 0
        patient = db.patients.find_one({"patient_ref": pref})
        if not patient: return
        target_collection = "patients_optimal"
        if glucose > 180 or hba1c > 8.0: target_collection = "patients_critical"
        elif glucose > 120 or hba1c > 6.5: target_collection = "patients_monitoring"
        db.patients_critical.delete_one({"patient_ref": pref})
        db.patients_monitoring.delete_one({"patient_ref": pref})
        db.patients_optimal.delete_one({"patient_ref": pref})
        rec = patient.copy()
        rec.update({"latest_glucose": glucose, "latest_hba1c": hba1c, "clinical_status_updated": datetime.utcnow()})
        db[target_collection].insert_one(rec)

def migrate_partitioning():
    print(f"🚀 Starting Migration: Partitioning existing data Foundation...")
    client = MongoClient(DATABASE_URL)
    db = client.get_default_database(default="healthcare_db")
    
    # Reset partitioned collections
    print("🧹 Cleaning existing clinical partitions...")
    db.patients_critical.drop()
    db.patients_monitoring.drop()
    db.patients_optimal.drop()
    
    # Re-initialize indexes
    db.patients_critical.create_index("patient_ref", unique=True)
    db.patients_monitoring.create_index("patient_ref", unique=True)
    db.patients_optimal.create_index("patient_ref", unique=True)

    print("🔍 Fetching patients and their latest vitals...")
    patients = list(db.patients.find({}, {"patient_ref": 1}))
    total = len(patients)
    print(f"📦 Total patients to process: {total}")

    count = 0
    for p in patients:
        pref = p["patient_ref"]
        # Find latest diagnosis for this patient
        latest_diag = db.diagnoses.find_one({"patient_ref": pref}, sort=[("created_at", -1)])
        
        if latest_diag:
            vitals = {
                "glucose": latest_diag.get("glucose", 0),
                "hba1c": latest_diag.get("hba1c", 0)
            }
            partition_patient(db, pref, vitals)
        else:
            # If no diagnosis, assume optimal/baseline
            partition_patient(db, pref, {"glucose": 90, "hba1c": 5.4})
        
        count += 1
        if count % 1000 == 0:
            print(f"✅ Processed {count}/{total}...")

    print("\n📊 Partitioning Results:")
    print(f"🔴 Critical: {db.patients_critical.count_documents({})}")
    print(f"🟡 Monitoring: {db.patients_monitoring.count_documents({})}")
    print(f"🟢 Optimal: {db.patients_optimal.count_documents({})}")
    print("\n✅ Data Foundation Partitioning Complete!")

if __name__ == "__main__":
    migrate_partitioning()
