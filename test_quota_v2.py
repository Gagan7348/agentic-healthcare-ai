import google.generativeai as genai
import os
from dotenv import load_dotenv
from pathlib import Path
import warnings

warnings.filterwarnings("ignore")

env_path = Path('Agentic_Healthcare_AI/backend/.env')
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

models_to_test = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-pro",
    "gemini-flash-latest"
]

print(f"--- Testing Gemini Models ---")
for m_name in models_to_test:
    try:
        model = genai.GenerativeModel(m_name)
        response = model.generate_content("Say 'OK'")
        if response.candidates:
             print(f"PASS: {m_name}")
        else:
             print(f"FAIL: {m_name} (No candidates)")
    except Exception as e:
        err_msg = str(e).split('\n')[0]
        print(f"ERROR: {m_name} -> {err_msg}")
print(f"--- Finish ---")
