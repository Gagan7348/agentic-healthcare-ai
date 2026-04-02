"""
Configuration Management - Healthcare AI System
Google Gemini AI Integration
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
    # GOOGLE GEMINI AI API KEY
    # ========================================
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    PHIDATA_API_KEY: str = os.getenv("PHIDATA_API_KEY", "")
    GOOGLE_CLOUD_API_KEY: str = os.getenv("GOOGLE_CLOUD_API_KEY", "")
    OPENFDA_API_KEY: str = os.getenv("OPENFDA_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./healthcare_ai.db")
    
    # ========================================
    # GEMINI MODEL CONFIGURATION
    # ========================================
    # Available Gemini models
    GEMINI_PRO: str = "gemini-1.5-pro"          # Most capable - $0.00125/1K chars
    GEMINI_FLASH: str = "gemini-1.5-flash"      # Fastest - $0.000075/1K chars
    GEMINI_PRO_VISION: str = "gemini-1.5-pro-vision"  # For images
    
    # Default model to use
    DEFAULT_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")  # Free tier!
    
    # ========================================
    # AI PARAMETERS
    # ========================================
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "8000"))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    TOP_P: float = float(os.getenv("TOP_P", "0.95"))
    TOP_K: int = int(os.getenv("TOP_K", "40"))
    
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
        "http://localhost:8501",  # Streamlit
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3004",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8501",
    ]
    
    # ========================================
    # SAFETY SETTINGS
    # ========================================
    # Gemini safety settings
    SAFETY_SETTINGS = {
        "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
        "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
        "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
        "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
    }
    
    # ========================================
    # VALIDATION PROPERTIES
    # ========================================
    @property
    def has_gemini_key(self) -> bool:
        """Check if Gemini API key is configured"""
        return bool(self.GEMINI_API_KEY and len(self.GEMINI_API_KEY) > 10)

    @property
    def has_openfda_key(self) -> bool:
        return bool(self.OPENFDA_API_KEY and len(self.OPENFDA_API_KEY) > 5)

    @property
    def has_openai_key(self) -> bool:
        return bool(self.OPENAI_API_KEY and len(self.OPENAI_API_KEY) > 10)
    
    @property
    def is_configured(self) -> bool:
        """Check if AI is configured"""
        return self.has_gemini_key
    
    def get_config_summary(self) -> dict:
        """Get configuration summary"""
        return {
            "environment": self.ENVIRONMENT,
            "debug": self.DEBUG,
            "gemini_configured": self.has_gemini_key,
            "groq_configured": bool(self.GROQ_API_KEY),
            "tavily_configured": bool(self.TAVILY_API_KEY),
            "phidata_configured": bool(self.PHIDATA_API_KEY),
            "active_model": self.DEFAULT_MODEL,
            "max_tokens": self.MAX_TOKENS,
            "temperature": self.TEMPERATURE,
            "top_p": self.TOP_P,
            "top_k": self.TOP_K
        }

# Create global settings instance
settings = Settings()

# Print configuration status on import
if __name__ != "__main__":
    print("\n" + "="*60)
    print("🔧 Healthcare AI - Configuration Status (Gemini)")
    print("="*60)
    
    if settings.has_gemini_key:
        print(f"✅ Google Gemini AI: Configured")
        print(f"   Model: {settings.DEFAULT_MODEL}")
        print(f"   Max Tokens: {settings.MAX_TOKENS}")
        print(f"   Temperature: {settings.TEMPERATURE}")
        
        # Show pricing info
        if settings.DEFAULT_MODEL == "gemini-1.5-flash":
            print(f"   💰 Cost: FREE tier (15 RPM)")
            print(f"   💰 Paid: $0.000075/1K chars")
        elif settings.DEFAULT_MODEL == "gemini-1.5-pro":
            print(f"   💰 Cost: $0.00125/1K chars")
    else:
        print("❌ Google Gemini AI: Not configured")
        print("   Get free API key at: https://makersuite.google.com/app/apikey")
        print("   Add to backend/.env file: GEMINI_API_KEY=your-key")
    
    print("="*60 + "\n")