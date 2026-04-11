import asyncio
import base64
from .ai_services import GeminiClient
from .config import settings


async def test_chat():
    messages = [{"role": "user", "content": "Hello, this is a test run."}]
    res = await GeminiClient.chat_completion(messages)
    print("Chat:", res)

async def test_vision():
    valid_jpeg = base64.b64decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=')
    res = await GeminiClient.vision_analysis("Describe the image.", valid_jpeg, "image/jpeg", "english")
    print("Vision:", res)

async def main():
    await test_chat()
    await test_vision()

if __name__ == "__main__":
    asyncio.run(main())
