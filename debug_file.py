
import os

filepath = r'd:\Agentic_Healthcare_AI\frontend\src\components\Prediction.jsx'
with open(filepath, 'rb') as f:
    data = f.read()

# Print lines that look like text
lines = data.splitlines()
for i, line in enumerate(lines):
    try:
        text = line.decode('utf-8')
        if text.strip():
            print(f"{i+1}: {text}")
    except:
        # If it fails to decode as utf-8, it might be corrupted. 
        # Let's try to print it partially.
        print(f"{i+1}: [CORRUPTED] {repr(line)}")
