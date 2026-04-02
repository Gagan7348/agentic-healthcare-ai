
import os

filepath = r'd:\Agentic_Healthcare_AI\frontend\src\components\Prediction.jsx'
with open(filepath, 'rb') as f:
    content = f.read()

# We want to replace everything from "const labels = {" to the start of the return div
# The start of the return div is "    <div className=\"max-w-7xl mx-auto space-y-16 animate-in fade-in zoom-in duration-1000\">"

start_marker = b'const labels = {'
end_marker = b'<div className="max-w-7xl mx-auto space-y-16 animate-in fade-in zoom-in duration-1000">'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_block = """const labels = {
    en: {
      title: 'Precision Diagnostics',
      subtitle: 'Advanced ML Neuro-Health Risk Assessment',
      vitals: 'Clinical Metrics',
      lifestyle: 'Biometric Variables',
      familyHistory: 'Genetic Markers',
      run: 'Execute Diagnostic Scan',
      results: 'Neural Analysis Response',
      diabetes: 'Type 2 Diabetes',
      heart: 'Heart Disease',
      kidney: 'Kidney Disease',
      age: 'Age',
      gender: 'Gender',
      glucose: 'Glucose',
      hba1c: 'HbA1c',
      cholesterol: 'Cholesterol',
      bloodPressure: 'BP (Systolic)',
      bmi: 'BMI',
      creatinine: 'Creatinine',
      smoking: 'Smoking Status',
      familyDiabetes: 'Diabetes History',
      familyHeart: 'Cardiac History',
      high: 'Critical Risk',
      medium: 'Moderate Risk',
      low: 'Minimal Risk',
      explanation: 'Interpret with AI',
      recommend: 'Neural Care Plan'
    },
    hi: {
      title: 'सटीक निदान',
      subtitle: 'उन्नत ML न्यूरो-हेल्थ जोखिम मूल्यांकन',
      vitals: 'नैदानिक डेटा',
      lifestyle: 'बायोमेट्रिक चर',
      familyHistory: 'जेनेटिक मार्कर्स',
      run: 'नैदानिक स्कैन चलाएं',
      results: 'न्यूरल विश्लेषण प्रतिक्रिया',
      diabetes: 'मधुमेह',
      heart: 'हृदय रोग',
      kidney: 'किडनी रोग',
      age: 'उम्र',
      gender: 'लिंग',
      glucose: 'ग्लूकोज',
      hba1c: 'HbA1c',
      cholesterol: 'कोलेस्ट्रॉल',
      bloodPressure: 'सिस्टोलिक बीपी',
      bmi: 'बीएमआई',
      creatinine: 'क्रिएटिनिन',
      smoking: 'धूम्रपान की स्थिति',
      familyDiabetes: 'मधुमेह का इतिहास',
      familyHeart: 'हृदय इतिहास',
      high: 'गंभीर जोखिम',
      medium: 'सामान्य जोखिम',
      low: 'न्यूनतम जोखिम',
      explanation: 'एआई के साथ व्याख्या करें',
      recommend: 'न्यूरल केयर प्लान'
    }
  };

  const t = labels[language] || labels.en;

  return (
""".replace('\\n', '\n') # Ensure proper newlines if any literal escaped ones were used (not the case here but good practice)

    new_content = content[:start_idx] + new_block.encode('utf-8') + content[end_idx:]
    
    with open(filepath, 'wb') as f:
        f.write(new_content)
    print("Successfully replaced labels object and restored return statement location.")
else:
    print(f"Markers not found. Start: {start_idx}, End: {end_idx}")
