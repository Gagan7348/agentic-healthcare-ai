import os
import random
from datetime import datetime
from pymongo import MongoClient

# Configure connection (matches database.py logic)
DATABASE_URL = os.getenv("DATABASE_URL", "mongodb+srv://avanidayal:Mongodayal2026*@cluster0.u2zc3jr.mongodb.net/healthcare_db?retryWrites=true&w=majority&appName=Cluster0")

try:
    client = MongoClient(DATABASE_URL)
    db_path = DATABASE_URL.split('//')[-1].split('/')[-1]
    db_name = db_path.split('?')[0] if '?' in db_path else (db_path or "healthcare_ai")
    db = client[db_name]
    print(f"Connected to MongoDB: {db_name}")
except Exception as e:
    print(f"FAILED to connect: {e}")
    exit(1)

# REAL INDIAN MEDICINE DATA (JAN AUSHADHI STYLE)
# Structure: med_id, name, category, indications (disease list), priority, min_stock, current_stock
REAL_MEDS = [
    # ANTI-DIABETIC
    {
        "med_id": "M001", "name": "Metformin 500mg", "category": "Anti-Diabetic",
        "indications": ["Diabetes (मधुमेह)", "diabetes"], "priority": "Essential",
        "min_stock": 1000, "current_stock": 450, "dosage": "1-2 tablets daily"
    },
    {
        "med_id": "M002", "name": "Glimepiride 1mg", "category": "Anti-Diabetic",
        "indications": ["Diabetes (मधुमेह)", "diabetes"], "priority": "Essential",
        "min_stock": 500, "current_stock": 120, "dosage": "1 tablet daily"
    },
    {
        "med_id": "M003", "name": "Vildagliptin 50mg", "category": "Anti-Diabetic",
        "indications": ["Diabetes (मधुमेह)", "diabetes"], "priority": "Important",
        "min_stock": 200, "current_stock": 55, "dosage": "1 tablet twice daily"
    },
    
    # ANTI-HYPERTENSIVE
    {
        "med_id": "H001", "name": "Amlodipine 5mg", "category": "Anti-Hypertensive",
        "indications": ["Hypertension (उच्च रक्तचाप)", "heart"], "priority": "Essential",
        "min_stock": 800, "current_stock": 350, "dosage": "1 tablet at bedtime"
    },
    {
        "med_id": "H002", "name": "Enalapril 5mg", "category": "Anti-Hypertensive",
        "indications": ["Hypertension (उच्च रक्तचाप)", "heart"], "priority": "Essential",
        "min_stock": 400, "current_stock": 90, "dosage": "1 tablet daily"
    },
    {
        "med_id": "H003", "name": "Telmisartan 40mg", "category": "Anti-Hypertensive",
        "indications": ["Hypertension (उच्च रक्तचाप)", "heart"], "priority": "Important",
        "min_stock": 600, "current_stock": 420, "dosage": "1 tablet daily"
    },
    
    # ANTIBIOTICS / INFECTIOUS
    {
        "med_id": "A001", "name": "Amoxicillin 500mg", "category": "Antibiotic",
        "indications": ["Pneumonia (निमोनिया)", "Respiratory Infection (सांस की बीमारी)"], "priority": "Essential",
        "min_stock": 500, "current_stock": 55, "dosage": "1 tablet thrice daily"
    },
    {
        "med_id": "A002", "name": "Azithromycin 500mg", "category": "Antibiotic",
        "indications": ["Typhoid (टाइफ़ाइड)", "Respiratory Infection (सांस की बीमारी)"], "priority": "Essential",
        "min_stock": 300, "current_stock": 210, "dosage": "1 tablet daily for 3 days"
    },
    {
        "med_id": "A003", "name": "Chloroquine 250mg", "category": "Antimalarial",
        "indications": ["Malaria (मलेरिया)"], "priority": "Critical",
        "min_stock": 200, "current_stock": 180, "dosage": "As prescribed"
    },
    
    # ANALGESICS / GENERAL
    {
        "med_id": "G001", "name": "Paracetamol 500mg", "category": "Analgesic",
        "indications": ["Fever", "Headache", "Malaria (मलेरिया)", "Dengue (डेंगी)"], "priority": "Essential",
        "min_stock": 2000, "current_stock": 850, "dosage": "1 tablet SOS"
    },
    {
        "med_id": "G002", "name": "ORS Sachet", "category": "Rehydration",
        "indications": ["Diarrhea (दस्त)", "Cholera (हैजा)", "Dengue (डेंगी)"], "priority": "Critical",
        "min_stock": 500, "current_stock": 45, "dosage": "Dissolve in 1L water"
    },
    {
        "med_id": "G003", "name": "Albendazole 400mg", "category": "Anthelmintic",
        "indications": ["Anemia (खून की कमी)"], "priority": "Important",
        "min_stock": 100, "current_stock": 85, "dosage": "Once in 6 months"
    },
    
    # KIDNEY / RENAL
    {
        "med_id": "K001", "name": "Furosemide 40mg", "category": "Diuretic",
        "indications": ["Kidney Disease (गुर्दा रोग)", "Hypertension (उच्च रक्तचाप)"], "priority": "Essential",
        "min_stock": 300, "current_stock": 65, "dosage": "1 tablet morning"
    },
    {
        "med_id": "K002", "name": "Sodium Bicarbonate", "category": "Alkalinizer",
        "indications": ["Kidney Disease (गुर्दा रोग)"], "priority": "Important",
        "min_stock": 200, "current_stock": 30, "dosage": "1 tablet thrice daily"
    }
]

def seed_pharmacy():
    print("Seeding Pharmacy Inventory...")
    # Clear existing inventory
    db.pharmacy_inventory.delete_many({})
    
    # Add timestamp and index compatibility
    for med in REAL_MEDS:
        med["last_updated"] = datetime.utcnow()
        
    result = db.pharmacy_inventory.insert_many(REAL_MEDS)
    print(f"Successfully seeded {len(result.inserted_ids)} medications.")

if __name__ == "__main__":
    seed_pharmacy()
