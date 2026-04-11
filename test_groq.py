import asyncio
import httpx
import json
from Agentic_Healthcare_AI.backend.ai_services import GroqClient

async def test_groq():
    print("Testing Groq Connectivity...")
    messages = [{"role": "user", "content": "Briefly describe the importance of healthcare AI."}]
    res = await GroqClient.chat_completion(messages)
    print("Groq Response:", res)

if __name__ == "__main__":
    asyncio.run(test_groq())
