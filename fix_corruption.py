
import os

filepath = r'd:\Agentic_Healthcare_AI\frontend\src\components\Prediction.jsx'
with open(filepath, 'rb') as f:
    content = f.read()

# Split lines while keeping line endings
lines = content.splitlines(True)
new_lines = []
found = False

for line in lines:
    if b'cholesterol' in line and b'return (' in line:
        found = True
        # Reconstruct the missing parts cleanly
        replacement = (
            "      cholesterol: 'कोलेस्ट्रॉल',\n"
            "      bloodPressure: 'सिस्टोलिक बीपी',\n"
            "      bmi: 'बीएमआई',\n"
            "      creatinine: 'क्रिएटिनिन',\n"
            "      smoking: 'धूम्रपान की स्थिति',\n"
            "      familyDiabetes: 'मधुमेह का इतिहास',\n"
            "      familyHeart: 'हृदय इतिहास',\n"
            "      high: 'गंभीर जोखिम',\n"
            "      medium: 'सामान्य जोखिम',\n"
            "      low: 'न्यूनतम जोखिम',\n"
            "      explanation: 'एआई के साथ व्याख्या करें',\n"
            "      recommend: 'न्यूरल केयर प्लान'\n"
            "    }\n"
            "  };\n"
            "\n"
            "  const t = labels[language] || labels.en;\n"
            "\n"
            "  return ("
        ).encode('utf-8')
        new_lines.append(replacement)
        # Note: we don't add an extra newline here because the replacement strings already have \n
    else:
        new_lines.append(line)

if found:
    with open(filepath, 'wb') as f:
        f.writelines(new_lines)
    print("Fixed.")
else:
    print("Could not find the target line.")
