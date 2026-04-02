import google.generativeai as genai
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path('Agentic_Healthcare_AI/backend/.env')
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")
print(f"Testing with Key: {api_key[:10]}...")

genai.configure(api_key=api_key)

try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error: {e}")
