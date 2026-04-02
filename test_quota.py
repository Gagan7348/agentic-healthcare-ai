import google.generativeai as genai
import os
from dotenv import load_dotenv
from pathlib import Path

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

for m_name in models_to_test:
    try:
        model = genai.GenerativeModel(m_name)
        response = model.generate_content("Hi", generation_config={"max_output_tokens": 10})
        print(f"✅ {m_name}: {response.text}")
    except Exception as e:
        print(f"❌ {m_name}: {e}")
