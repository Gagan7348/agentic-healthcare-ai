import asyncio
import httpx
import json

GEMINI_API_KEY = "AIzaSyCMzQkm3IS_ujaCj_gvLTrNdKXBZGwpOXA"
BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

async def test():
    messages = [{"role": "user", "content": "Hello"}]
    contents = [{"role": "user", "parts": [{"text": "Hello"}]}]
    payload = {"contents": contents, "generationConfig": {"temperature": 0.3}}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
            json=payload
        )
        print("Status Code:", response.status_code)
        print("Response:", response.text)

asyncio.run(test())
