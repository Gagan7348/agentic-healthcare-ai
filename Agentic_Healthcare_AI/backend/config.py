"""
Configuration Management - Healthcare AI System
xAI Grok Integration (Primary)
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
    # Groq CONFIGURATION
    # ========================================
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_VISION_MODEL: str = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
    
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    PHIDATA_API_KEY: str = os.getenv("PHIDATA_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
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
    
    # CORS settings
    CORS_ORIGINS: list = [
        "*",
        "http://localhost:3000",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://agentic-healthcare-ai.onrender.com",
        "https://agentic-healthcare-ui.onrender.com", 
    ]
    
    # ========================================
    # VALIDATION PROPERTIES
    # ========================================
    @property
    def has_groq_key(self) -> bool:
        """Check if Groq API key is configured"""
        key = os.getenv("GROQ_API_KEY", self.GROQ_API_KEY)
        has_key = bool(key and len(key) > 10)
        if __name__ != "__main__":
             print(f"CFG: GROQ_API_KEY Detection Status: {'FOUND' if has_key else 'MISSING'}")
        return has_key

    @property
    def has_xai_key(self) -> bool:
        return self.has_groq_key # Redirect for compatibility

    @property
    def has_gemini_key(self) -> bool:
        """Check if Gemini API key is configured"""
        key = os.getenv("GEMINI_API_KEY", self.GEMINI_API_KEY)
        return bool(key and len(key) > 10)

    @property
    def is_configured(self) -> bool:
        """Check if AI is configured"""
        return self.has_xai_key
    
    def get_config_summary(self) -> dict:
        """Get configuration summary"""
        return {
            "environment": self.ENVIRONMENT,
            "debug": self.DEBUG,
            "xai_configured": self.has_xai_key,
            "tavily_configured": bool(self.TAVILY_API_KEY),
            "phidata_configured": bool(self.PHIDATA_API_KEY),
            "active_model": self.DEFAULT_MODEL,
            "max_tokens": self.MAX_TOKENS,
            "temperature": self.TEMPERATURE
        }

# Create global settings instance
settings = Settings()

# Print configuration status on import
if __name__ != "__main__":
    print("\n" + "="*60)
    print("AGENTIC AI: Configuration Status (Groq Llama Engine)")
    print("="*60)
    
    if settings.has_groq_key:
        print(f"OK: Groq Engine: Configured")
        print(f"   Model: {settings.GROQ_MODEL}")
        print(f"   Status: Ultra-Fast Inference Enabled")
    else:
        print("ERROR: Groq Engine: Not configured")
        print("   Add to backend/.env file: GROQ_API_KEY=gsk-...")
    
    print("="*60 + "\n")