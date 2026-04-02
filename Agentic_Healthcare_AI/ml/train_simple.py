import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
import json

def train_models():
    os.makedirs("models", exist_ok=True)

    patient_df = pd.read_csv(r"d:\Agentic_Healthcare_AI\dataset\data\structured\patient_data.csv")
    lab_df = pd.read_csv(r"d:\Agentic_Healthcare_AI\dataset\data\structured\lab_results.csv")

    if 'patient_id' in patient_df.columns and 'patient_id' in lab_df.columns:
        lab_latest = lab_df.sort_values('test_date').groupby('patient_id').last().reset_index()
        df = patient_df.merge(lab_latest,on='patient_id', how='left')
    else:
        df = patient_df

    print(f"Total patients: {len(df)}")

    cols = df.columns.str.lower()

    def find(col):
        return next((c for c in df.columns if col in c.lower()), None)

    age = find("age")
    bmi = find("bmi")
    glucose = find("glucose")
    hba1c = find("hba1c")
    cholesterol = find("cholesterol")
    bp = find("blood_pressure_systolic")
    creatinine = find("creatinine")
    smoking = find("smoking")
    family_diabetes = find("family_history_diabetes")
    family_heart = find("family_history_heart")
    weight = find("weight")
    diabetes = find("diabetes_risk")
    heart = find("heart_disease_risk")
    kidney = find("kidney_disease_risk")

    disease_configs = {}

    if all([age, bmi, glucose, weight, hba1c, family_diabetes, diabetes]):
        disease_configs["diabetes"] = ([glucose, hba1c, age, bmi, weight, family_diabetes], diabetes)

    if all([age, bmi, bp, cholesterol,diabetes, smoking, family_heart, heart]):
        disease_configs["heart_disease"] = ([age, bp, bmi, cholesterol, smoking, diabetes, family_heart], heart)

    if all([age, bp, creatinine, diabetes, family_diabetes, kidney]):
        disease_configs["kidney_disease"] = ([creatinine, age, bp, diabetes, family_diabetes], kidney)

    if not disease_configs:
        print("❌ No valid targets found.")
        return

    accuracies = {}
    trained_models = []

    for disease, (features, target) in disease_configs.items():
        print(f"\nTraining {disease}")

        X = df[features].fillna(df[features].mean())
        y = df[target]

        if y.dtype == "object":
            y = (y.str.lower() == "high").astype(int)
 
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)

        model = RandomForestClassifier(
            n_estimators=500, 
            max_depth=15,
            min_samples_split=5,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train, y_train)

        train_acc = model.score(X_train, y_train)
        test_acc = model.score(X_test, y_test)

        joblib.dump(model, f"models/{disease}_model.pkl")
        joblib.dump(scaler, f"models/{disease}_scaler.pkl")
        joblib.dump(features, f"models/{disease}_features.pkl")

        accuracies[disease] = test_acc
        trained_models.append(disease)

        print(f"✔ {disease} trained | Test accuracy: {test_acc:.2%}")

    summary = {
        "total_patients": len(df),
        "models_trained": trained_models,
        "accuracies": accuracies
    }

    with open("models/training_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print("\n✅ training_summary.json created")
    print(json.dumps(summary, indent=2))
    print("\nRun command:")
    print("streamlit run app_simple.py")


if __name__ == "__main__":
    train_models()
