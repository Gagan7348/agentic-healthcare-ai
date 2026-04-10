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
    # xAI GROK CONFIGURATION
    # ========================================
    XAI_API_KEY: str = os.getenv("XAI_API_KEY", "")
    XAI_MODEL: str = os.getenv("XAI_MODEL", "grok-2")
    
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    PHIDATA_API_KEY: str = os.getenv("PHIDATA_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./healthcare_ai.db")
    
    # Default model for common tasks
    DEFAULT_MODEL: str = XAI_MODEL
    
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
    def has_xai_key(self) -> bool:
        """Check if xAI API key is configured"""
        key = os.getenv("XAI_API_KEY", self.XAI_API_KEY)
        has_key = bool(key and len(key) > 5)
        # Log status (Safe)
        if __name__ != "__main__":
             print(f"📡 CFG: XAI_API_KEY Detection Status: {'FOUND' if has_key else 'MISSING'}")
        return has_key

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
    print("🚀 AGENTIC AI: Configuration Status (xAI Grok)")
    print("="*60)
    
    if settings.has_xai_key:
        print(f"OK: xAI Grok: Configured")
        print(f"   Model: {settings.XAI_MODEL}")
        print(f"   Status: Exclusive Diagnostic Engine Active")
    else:
        print("ERROR: xAI Grok: Not configured")
        print("   Add to backend/.env file: XAI_API_KEY=xai-...")
    
    print("="*60 + "\n")