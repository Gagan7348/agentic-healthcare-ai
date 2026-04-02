import json
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, roc_auc_score
from train_upgraded_models import generate_training_data, add_engineered_features
from sklearn.model_selection import train_test_split

# Generate consistent dataset
df = generate_training_data(n=15000)
df = add_engineered_features(df)

MODELS_DIR = Path('models')

metrics = {}

for disease, label in [("diabetes", 'diabetes_risk'), ("heart_disease", 'heart_disease_risk'), ("kidney_disease", 'kidney_disease_risk')]:
    model = joblib.load(MODELS_DIR / f"{disease}_model.pkl")
    scaler = joblib.load(MODELS_DIR / f"{disease}_scaler.pkl")
    features = joblib.load(MODELS_DIR / f"{disease}_features.pkl")
    
    X = df[features].values
    y = df[label].values
    
    # Same split as training
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    X_test_s = scaler.transform(X_test)
    
    y_pred = model.predict(X_test_s)
    y_prob = model.predict_proba(X_test_s)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_prob)) # RMSE on probabilities
    auc = roc_auc_score(y_test, y_prob)
    
    metrics[disease] = {
        "Test Sample Size": len(y_test),
        "Accuracy": round(acc, 4),
        "Precision": round(prec, 4),
        "Recall": round(rec, 4),
        "F1-Score": round(f1, 4),
        "RMSE": round(rmse, 4),
        "AUC-ROC": round(auc, 4)
    }

print(json.dumps(metrics, indent=4))
