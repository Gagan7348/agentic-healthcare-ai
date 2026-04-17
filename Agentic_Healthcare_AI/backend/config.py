"""
Configuration Management - Healthcare AI System
Dual-Engine: Gemini 1.5 Pro (Primary) + Groq Llama-3.3-70B (Secondary)
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    """Application settings and configuration"""

    # ========================================
    # API KEYS — NEVER hardcode values here.
    # All keys must come from .env file.
    # ========================================
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_VISION_MODEL: str = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    PHIDATA_API_KEY: str = os.getenv("PHIDATA_API_KEY", "")
    OPENFDA_API_KEY: str = os.getenv("OPENFDA_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./healthcare_ai.db")

    # Default model for common tasks
    DEFAULT_MODEL: str = GROQ_MODEL

    # ========================================
    # AI PARAMETERS
    # ========================================
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "8000"))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    TOP_P: float = float(os.getenv("TOP_P", "0.95"))

    # ========================================
    # APPLICATION SETTINGS
    # ========================================
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # CORS settings — allow localhost for dev + production URLs
    CORS_ORIGINS: list = [
        "*",
        "http://localhost:3000",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://agentic-healthcare-ai.onrender.com",
        "https://agentic-healthcare-ui.onrender.com",
        "https://agentic-healthcare-ui.netlify.app",
    ]

    # ========================================
    # VALIDATION PROPERTIES
    # ========================================
    @property
    def has_groq_key(self) -> bool:
        """Check if Groq/Llama API key is configured"""
        key = os.getenv("GROQ_API_KEY", self.GROQ_API_KEY)
        has_key = bool(key and len(key) > 10)
        print(f"CFG: GROQ_API_KEY: {'[OK] FOUND' if has_key else '[X] MISSING'}")
        return has_key

    @property
    def has_xai_key(self) -> bool:
        """Compatibility alias for has_groq_key"""
        return self.has_groq_key

    @property
    def has_gemini_key(self) -> bool:
        """Check if Google Gemini API key is configured"""
        key = os.getenv("GEMINI_API_KEY", self.GEMINI_API_KEY)
        return bool(key and len(key) > 10)

    @property
    def has_elevenlabs_key(self) -> bool:
        """Check if ElevenLabs API key is configured for neural TTS"""
        key = os.getenv("ELEVENLABS_API_KEY", self.ELEVENLABS_API_KEY)
        return bool(key and len(key) > 10)

    @property
    def is_configured(self) -> bool:
        """True if at least one primary AI engine is configured"""
        return self.has_groq_key or self.has_gemini_key

    def get_config_summary(self) -> dict:
        """Used by /api/health to expose system readiness"""
        return {
            "environment": self.ENVIRONMENT,
            "debug": self.DEBUG,
            "groq_configured": self.has_groq_key,
            "gemini_configured": self.has_gemini_key,
            "elevenlabs_configured": self.has_elevenlabs_key,
            "tavily_configured": bool(self.TAVILY_API_KEY),
            "phidata_configured": bool(self.PHIDATA_API_KEY),
            "active_model": self.DEFAULT_MODEL,
            "max_tokens": self.MAX_TOKENS,
            "temperature": self.TEMPERATURE,
        }


# ── Global singleton ───────────────────────────────────────────────────────────
settings = Settings()

# Print configuration status on import
print("\n" + "=" * 60)
print("AGENTIC AI: Configuration Status")
print("=" * 60)
print(f"  Gemini 1.5 Pro : {'[OK] CONFIGURED' if settings.has_gemini_key else '[X] MISSING (add GEMINI_API_KEY to .env)'}")
print(f"  Groq Llama-70B : {'[OK] CONFIGURED' if settings.has_groq_key else '[X] MISSING (add GROQ_API_KEY to .env)'}")
print(f"  ElevenLabs TTS : {'[OK] CONFIGURED' if settings.has_elevenlabs_key else '~ Not set (gTTS fallback active)'}")
print(f"  Environment    : {settings.ENVIRONMENT}")
print(f"  Ready          : {'[OK] YES' if settings.is_configured else '[X] NO -- add at least one AI key'}")
print("=" * 60 + "\n")