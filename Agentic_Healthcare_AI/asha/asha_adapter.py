"""
ASHA Adapter for Agentic_Healthcare_AI Project
Converts your Phase 2 analysis into simple guidance for rural health workers
Works with YOUR models and data structure
"""

from typing import Dict, List
from enum import Enum

class UrgencyLevel(Enum):
    """Simple triage levels"""
    RED = "🔴 RED - URGENT"
    YELLOW = "🟡 YELLOW - SOON"
    GREEN = "🟢 GREEN - ROUTINE"

class ASHAAdapter:
    """
    Converts detailed medical analysis into ASHA-friendly format
    Takes predictions from YOUR models and simplifies them
    """
    
    def __init__(self):
        self.danger_thresholds = {
            'glucose': 300,
            'blood_pressure_systolic': 180,
            'creatinine': 2.0
        }
    
    def convert_to_asha_format(self, predictions: Dict, patient_data: Dict = None, symptoms: Dict = None) -> Dict:
        """
        Main conversion function
        
        Args:
            predictions: Dict with disease risks from YOUR models
                        {'diabetes': 0.75, 'heart': 0.65, 'kidney': 0.30}
            patient_data: Optional patient data (lab values, demographics)
            symptoms: Optional symptoms entered by ASHA
            
        Returns:
            ASHA-friendly guidance with triage, actions, call script
        """
        
        # Step 1: Determine urgency (RED/YELLOW/GREEN)
        urgency = self._determine_urgency(predictions, patient_data, symptoms)
        
        # Step 2: Generate immediate actions
        immediate_actions = self._generate_immediate_actions(urgency, predictions)
        
        # Step 3: Create simple family advice
        family_advice = self._create_family_advice(predictions)
        
        # Step 4: Generate call script for PHC doctor
        call_script = self._generate_call_script(predictions, patient_data, symptoms, urgency)
        
        # Step 5: Create follow-up plan
        follow_up_tasks = self._create_follow_up_plan(urgency)
        
        return {
            'urgency_level': urgency.value,
            'urgency_enum': urgency,
            'immediate_actions': immediate_actions,
            'family_advice': family_advice,
            'call_doctor_script': call_script,
            'follow_up_tasks': follow_up_tasks,
            'when_to_see_doctor': self._get_timeframe(urgency)
        }
    
    def _determine_urgency(self, predictions: Dict, patient_data: Dict = None, symptoms: Dict = None) -> UrgencyLevel:
        """Determine RED/YELLOW/GREEN based on predictions and symptoms"""
        
        # Check for danger signs in symptoms
        if symptoms:
            if symptoms.get('chest_pain') or symptoms.get('severe_breathing_difficulty') or symptoms.get('unconscious'):
                return UrgencyLevel.RED
        
        # Check for critical lab values
        if patient_data:
            for test, threshold in self.danger_thresholds.items():
                if test in patient_data and patient_data[test] > threshold:
                    return UrgencyLevel.RED
        
        # Check disease risks from YOUR models
        if predictions:
            max_risk = max(predictions.values()) if predictions else 0
            
            # Any risk > 70% = RED
            if max_risk > 0.7:
                return UrgencyLevel.RED
            
            # Any risk > 50% = YELLOW
            elif max_risk > 0.5:
                return UrgencyLevel.YELLOW
            
            # Any risk > 40% = YELLOW
            elif max_risk > 0.4:
                return UrgencyLevel.YELLOW
        
        # Otherwise GREEN
        return UrgencyLevel.GREEN
    
    def _generate_immediate_actions(self, urgency: UrgencyLevel, predictions: Dict) -> List[str]:
        """Generate immediate actions in Hindi/English"""
        
        if urgency == UrgencyLevel.RED:
            return [
                "🚨 अभी PHC ले जाएं या 108 Ambulance बुलाएं",
                "📞 PHC Doctor को तुरंत फोन करें",
                "👨‍👩‍👧 परिवार को बताएं - गंभीर स्थिति है",
                "📋 सारे test reports साथ रखें"
            ]
        
        elif urgency == UrgencyLevel.YELLOW:
            return [
                "📞 PHC Doctor से appointment लें (24-48 घंटे में)",
                "📋 मरीज के लक्षण लिख लें",
                "💊 अगर पहले की दवाई है तो जारी रखें",
                "📝 रोज़ check करें - बदलाव हो तो तुरंत बताएं"
            ]
        
        else:  # GREEN
            return [
                "🏠 घर पर ही देखभाल करें",
                "📚 परिवार को सही खान-पान बताएं",
                "📅 एक हफ्ते में फिर check करें",
                "💊 स्वस्थ जीवनशैली बनाए रखें"
            ]
    
    def _create_family_advice(self, predictions: Dict) -> str:
        """Create simple family advice in Hindi"""
        
        if not predictions:
            return "स्वस्थ खान-पान और रोज़ व्यायाम करें"
        
        # Find highest risk disease
        max_disease = max(predictions, key=predictions.get)
        max_risk = predictions[max_disease]
        
        if max_risk < 0.3:
            return "✅ सब ठीक है! स्वस्थ रहने के लिए:\n• कम चीनी, कम नमक खाएं\n• रोज़ 30 मिनट टहलें\n• ज्यादा सब्जियां खाएं"
        
        # Disease-specific advice
        advice_templates = {
            'diabetes': {
                'diet': "कम चीनी खाएं, ज्यादा सब्जियां, रोज़ सुबह टहलें",
                'warning': "बहुत प्यास लगे या बार-बार पेशाब आए तो तुरंत बताएं"
            },
            'heart': {
                'diet': "नमक कम करें, तेल-घी कम करें, रोज़ पैदल चलें",
                'warning': "सीने में दर्द हो तो तुरंत PHC ले जाएं"
            },
            'kidney': {
                'diet': "ज्यादा पानी पिएं, नमक कम खाएं, दवाई समय पर लें",
                'warning': "पेशाब कम आए या सूजन हो तो डॉक्टर को दिखाएं"
            }
        }
        
        disease_advice = advice_templates.get(max_disease, {
            'diet': "स्वस्थ खाना खाएं, व्यायाम करें",
            'warning': "किसी भी बदलाव की सूचना दें"
        })
        
        advice = f"⚠️ {max_disease.title()} का खतरा है। परिवार को बताएं:\n\n"
        advice += f"खान-पान: {disease_advice['diet']}\n\n"
        advice += f"चेतावनी: {disease_advice['warning']}"
        
        return advice
    
    def _generate_call_script(self, predictions: Dict, patient_data: Dict, symptoms: Dict, urgency: UrgencyLevel) -> str:
        """Generate exact call script for PHC doctor in Hindi/English"""
        
        script = """
╔══════════════════════════════════════════════════════════╗
║          DOCTOR को फ़ोन करने का SCRIPT                  ║
╚══════════════════════════════════════════════════════════╝

"Namaste Doctor, main [अपना नाम] [गाँव का नाम] से ASHA bol rahi hoon.

PATIENT की जानकारी:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        
        # Add patient demographics
        if patient_data:
            if 'age' in patient_data:
                script += f"• Age: {patient_data['age']} years\n"
            if 'gender' in patient_data:
                script += f"• Gender: {patient_data['gender']}\n"
        
        # Add symptoms if available
        if symptoms and symptoms.get('symptoms_text'):
            script += f"• Main problem: {symptoms['symptoms_text']}\n"
        
        # Add lab results if available
        if patient_data:
            script += "\nTEST RESULTS:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            
            if 'glucose' in patient_data:
                script += f"• Blood Sugar: {patient_data['glucose']:.0f} mg/dL"
                if patient_data['glucose'] > 125:
                    script += " (HIGH)"
                script += "\n"
            
            if 'cholesterol' in patient_data:
                script += f"• Cholesterol: {patient_data['cholesterol']:.0f} mg/dL"
                if patient_data['cholesterol'] > 200:
                    script += " (HIGH)"
                script += "\n"
            
            if 'blood_pressure_systolic' in patient_data or 'blood_pressure' in patient_data:
                bp_val = patient_data.get('blood_pressure_systolic', patient_data.get('blood_pressure', 0))
                script += f"• BP: {bp_val:.0f} mmHg"
                if bp_val > 140:
                    script += " (HIGH)"
                script += "\n"
        
        # Add AI assessment from YOUR models
        if predictions:
            max_disease = max(predictions, key=predictions.get)
            max_risk = predictions[max_disease]
            
            script += f"\nAI SYSTEM का ASSESSMENT:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            script += f"• Main concern: {max_disease.title()} ({max_risk:.0%} risk)\n"
            script += f"• Urgency: {urgency.value}\n"
        
        # Add questions
        script += """
MERA SAWAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Kya ghar pe treatment ho sakta hai?
2. PHC aana padega kya?
3. Koi emergency hai?
4. Kya medicine shuru karoon?

Dhanyavaad Doctor."

╔══════════════════════════════════════════════════════════╗
║  इस script को पढ़कर Doctor को बोलें                     ║
╚══════════════════════════════════════════════════════════╝
"""
        
        return script
    
    def _create_follow_up_plan(self, urgency: UrgencyLevel) -> List[Dict]:
        """Create follow-up checklist"""
        
        if urgency == UrgencyLevel.RED:
            return [
                {'task': 'PHC में admit हुआ या नहीं - confirm करें', 'when': 'Same day'},
                {'task': 'Doctor ने क्या कहा - note करें', 'when': 'Same day'},
                {'task': 'Medicine मिली या नहीं - check करें', 'when': 'Next day'},
                {'task': 'Patient की हालत - daily check', 'when': 'Daily for 1 week'}
            ]
        
        elif urgency == UrgencyLevel.YELLOW:
            return [
                {'task': 'Doctor appointment हुई या नहीं', 'when': 'Day 2-3'},
                {'task': 'Medicine शुरू की या नहीं', 'when': 'Day 3-4'},
                {'task': 'Health में सुधार हुआ या नहीं', 'when': 'Day 7'},
                {'task': 'Follow-up test की ज़रूरत', 'when': 'Week 2'}
            ]
        
        else:  # GREEN
            return [
                {'task': 'परिवार को advice दी या नहीं', 'when': 'Day 1'},
                {'task': 'Diet changes शुरू हुए या नहीं', 'when': 'Day 3'},
                {'task': 'Exercise कर रहे हैं या नहीं', 'when': 'Day 7'},
                {'task': 'कोई नई problem तो नहीं', 'when': 'Week 2'}
            ]
    
    def _get_timeframe(self, urgency: UrgencyLevel) -> str:
        """When to see doctor"""
        
        timeframes = {
            UrgencyLevel.RED: "तुरंत (0-2 घंटे में)",
            UrgencyLevel.YELLOW: "जल्द (24-48 घंटे में)",
            UrgencyLevel.GREEN: "Routine (1-2 हफ्ते में या ज़रूरत हो तो)"
        }
        
        return timeframes.get(urgency, "जल्द")


# Helper function
def convert_for_asha(predictions: Dict, patient_data: Dict = None, symptoms: Dict = None) -> Dict:
    """
    Quick function to convert YOUR model predictions to ASHA format
    
    Args:
        predictions: {'diabetes': 0.75, 'heart': 0.65, 'kidney': 0.30}
        patient_data: Optional patient lab values
        symptoms: Optional ASHA symptom input
        
    Returns:
        ASHA guidance with triage, actions, call script
    """
    adapter = ASHAAdapter()
    return adapter.convert_to_asha_format(predictions, patient_data, symptoms)


if __name__ == "__main__":
    # Example usage with YOUR model predictions
    
    sample_predictions = {
        'diabetes': 0.78,
        'heart': 0.45,
        'kidney': 0.25
    }
    
    sample_patient_data = {
        'age': 52,
        'gender': 'Female',
        'glucose': 165,
        'cholesterol': 230,
        'blood_pressure_systolic': 145
    }
    
    sample_symptoms = {
        'symptoms_text': 'बहुत प्यास लगती है, थकान रहती है'
    }
    
    # Convert to ASHA format
    asha_guidance = convert_for_asha(sample_predictions, sample_patient_data, sample_symptoms)
    
    print("ASHA GUIDANCE:")
    print("="*70)
    print(f"Urgency: {asha_guidance['urgency_level']}")
    print(f"Timeframe: {asha_guidance['when_to_see_doctor']}")
    print("\nImmediate Actions:")
    for action in asha_guidance['immediate_actions']:
        print(f"  {action}")
    print("\nFamily Advice:")
    print(asha_guidance['family_advice'])
    print("\nCall Script:")
    print(asha_guidance['call_doctor_script'])