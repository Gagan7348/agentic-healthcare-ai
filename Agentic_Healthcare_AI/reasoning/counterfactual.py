"""
Counterfactual Reasoning - Phase 2
Determines what needs to change to reduce risk
"""

import pandas as pd
import numpy as np
import joblib

class CounterfactualAnalyzer:
    """Analyzes what patient should change to reduce disease risk"""
    
    def __init__(self, disease, model, scaler, features):
        """
        Initialize analyzer for a specific disease
        
        Args:
            disease: Disease name (e.g., 'diabetes')
            model: Trained ML model
            scaler: Feature scaler
            features: List of feature names
        """
        self.disease = disease
        self.model = model
        self.scaler = scaler
        self.features = features
    
    def analyze(self, current_values, num_suggestions=3):
        """
        Find what needs to change to reduce risk
        
        Args:
            current_values: Dict of current patient values
            num_suggestions: Number of suggestions to return
            
        Returns:
            List of suggestions with impact
        """
        suggestions = []
        
        # Get current risk
        current_input = pd.DataFrame([[current_values[f] for f in self.features]], 
                                     columns=self.features)
        current_scaled = self.scaler.transform(current_input)
        current_risk = self.model.predict_proba(current_scaled)[0][1]
        
        # Try different changes for each feature
        for feature in self.features:
            if feature == 'age':
                continue  # Can't change age
            
            current_value = current_values[feature]
            
            # Try different reduction levels
            for reduction_pct in [0.1, 0.2, 0.3]:
                new_value = current_value * (1 - reduction_pct)
                
                # Create new values dict
                new_values = current_values.copy()
                new_values[feature] = new_value
                
                # Predict new risk
                new_input = pd.DataFrame([[new_values[f] for f in self.features]], 
                                        columns=self.features)
                new_scaled = self.scaler.transform(new_input)
                new_risk = self.model.predict_proba(new_scaled)[0][1]
                
                # Calculate impact
                risk_reduction = current_risk - new_risk
                
                if risk_reduction > 0.01:  # Only meaningful changes
                    suggestions.append({
                        'feature': feature,
                        'current_value': current_value,
                        'target_value': new_value,
                        'change_amount': current_value - new_value,
                        'change_percent': reduction_pct * 100,
                        'current_risk': current_risk,
                        'new_risk': new_risk,
                        'risk_reduction': risk_reduction,
                        'impact_score': risk_reduction / reduction_pct  # Efficiency
                    })
        
        # Sort by impact score and return top N
        suggestions.sort(key=lambda x: x['impact_score'], reverse=True)
        return suggestions[:num_suggestions]
    
    def format_suggestions(self, suggestions):
        """
        Format suggestions into readable text
        
        Args:
            suggestions: List of suggestion dicts
            
        Returns:
            List of formatted strings
        """
        formatted = []
        
        feature_names = {
            'glucose': 'Glucose',
            'fasting_glucose': 'Fasting Glucose',
            'bmi': 'BMI',
            'cholesterol': 'Cholesterol',
            'blood_pressure_systolic': 'Blood Pressure',
            'creatinine': 'Creatinine'
        }
        
        feature_units = {
            'glucose': 'mg/dL',
            'fasting_glucose': 'mg/dL',
            'bmi': '',
            'cholesterol': 'mg/dL',
            'blood_pressure_systolic': 'mmHg',
            'creatinine': 'mg/dL'
        }
        
        for i, sug in enumerate(suggestions, 1):
            feature = feature_names.get(sug['feature'], sug['feature'].title())
            unit = feature_units.get(sug['feature'], '')
            
            text = f"{i}. Reduce {feature} from {sug['current_value']:.1f}"
            if unit:
                text += f" {unit}"
            text += f" to {sug['target_value']:.1f}"
            if unit:
                text += f" {unit}"
            text += f" ({sug['change_percent']:.0f}% reduction)"
            text += f"\n   → Risk drops from {sug['current_risk']:.1%} to {sug['new_risk']:.1%}"
            text += f" (saves {sug['risk_reduction']:.1%})"
            
            formatted.append(text)
        
        return formatted


def analyze_all_diseases(patient_values, models_dir='models'):
    """
    Analyze counterfactuals for all diseases
    
    Args:
        patient_values: Dict of patient feature values
        models_dir: Directory containing trained models
        
    Returns:
        Dict of disease -> suggestions
    """
    import os
    
    results = {}
    
    # Find all available models
    model_files = [f for f in os.listdir(models_dir) if f.endswith('_model.pkl')]
    
    for model_file in model_files:
        disease = model_file.replace('_model.pkl', '')
        
        # Load model components
        model = joblib.load(f'{models_dir}/{disease}_model.pkl')
        scaler = joblib.load(f'{models_dir}/{disease}_scaler.pkl')
        features = joblib.load(f'{models_dir}/{disease}_features.pkl')
        
        # Create analyzer
        analyzer = CounterfactualAnalyzer(disease, model, scaler, features)
        
        # Get suggestions
        suggestions = analyzer.analyze(patient_values)
        results[disease] = {
            'suggestions': suggestions,
            'formatted': analyzer.format_suggestions(suggestions)
        }
    
    return results


if __name__ == "__main__":
    # Example usage
    sample_patient = {
        'age': 55,
        'bmi': 30.5,
        'glucose': 150,
        'cholesterol': 240,
        'blood_pressure_systolic': 150,
        'creatinine': 1.5
    }
    
    results = analyze_all_diseases(sample_patient)
    
    for disease, data in results.items():
        print(f"\n{disease.upper()} - What needs to change:")
        print("=" * 50)
        for text in data['formatted']:
            print(text)