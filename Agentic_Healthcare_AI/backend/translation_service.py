"""
Translation Service - Multilingual Support
Supports 7 Languages: English + 6 Indian Languages
Uses: Google Translate API (googletrans)
"""

import logging
from typing import Optional, Dict, List

# Translation library
try:
    from deep_translator import GoogleTranslator
    TRANSLATOR_AVAILABLE = True
except ImportError:
    TRANSLATOR_AVAILABLE = False
    print("⚠️  deep-translator not installed. Install: pip install deep-translator")

logger = logging.getLogger(__name__)

# Supported languages
SUPPORTED_LANGUAGES = {
    "en": {"name": "English", "native": "English"},
    "hi": {"name": "Hindi", "native": "हिंदी"},
    "ta": {"name": "Tamil", "native": "தமிழ்"},
    "te": {"name": "Telugu", "native": "తెలుగు"},
    "bn": {"name": "Bengali", "native": "বাংলা"},
    "mr": {"name": "Marathi", "native": "मराठी"},
    "gu": {"name": "Gujarati", "native": "ગુજરાતી"}
}

# Common health terms translations
HEALTH_TERMS = {
    "diabetes": {
        "hi": "मधुमेह",
        "ta": "நீரிழிவு",
        "te": "మధుమేహం",
        "bn": "ডায়াবেটিস",
        "mr": "मधुमेह",
        "gu": "ડાયાબિટીસ"
    },
    "heart_disease": {
        "hi": "हृदय रोग",
        "ta": "இதய நோய்",
        "te": "గుండె జబ్బు",
        "bn": "হৃদরোগ",
        "mr": "हृदयरोग",
        "gu": "હૃદય રોગ"
    },
    "kidney_disease": {
        "hi": "गुर्दे की बीमारी",
        "ta": "சிறுநீரக நோய்",
        "te": "కిడ్నీ జబ్బు",
        "bn": "কিডনি রোগ",
        "mr": "मूत्रपिंड रोग",
        "gu": "કિડની રોગ"
    },
    "high_risk": {
        "hi": "उच्च जोखिम",
        "ta": "உயர் ஆபத்து",
        "te": "అధిక ప్రమాదం",
        "bn": "উচ্চ ঝুঁকি",
        "mr": "उच्च जोखीम",
        "gu": "ઉચ્ચ જોખમ"
    },
    "medium_risk": {
        "hi": "मध्यम जोखिम",
        "ta": "நடுத்தர ஆபத்து",
        "te": "మధ్యస్థ ప్రమాదం",
        "bn": "মাঝারি ঝুঁকি",
        "mr": "मध्यम जोखीम",
        "gu": "મધ્યમ જોખમ"
    },
    "low_risk": {
        "hi": "कम जोखिम",
        "ta": "குறைந்த ஆபத்து",
        "te": "తక్కువ ప్రమాదం",
        "bn": "কম ঝুঁকি",
        "mr": "कमी जोखीम",
        "gu": "ઓછું જોખમ"
    }
}

class TranslationService:
    """Translation service for multilingual support"""
    
    def __init__(self):
        if TRANSLATOR_AVAILABLE:
            # We don't initialize a single translator because deep-translator 
            # requires source and target during initialization
            self.available = True
        else:
            self.available = False
            logger.warning("Translator not available")
    
    def translate(
        self, 
        text: str, 
        target_lang: str, 
        source_lang: str = "auto"
    ) -> str:
        """
        Translate text between languages
        
        Args:
            text: Text to translate
            target_lang: Target language code
            source_lang: Source language code (auto-detect if "auto")
        
        Returns:
            Translated text
        """
        if not self.available:
            return text  # Return original if translator not available
        
        # If same language, return original
        if source_lang == target_lang:
            return text
        
        try:
            # Check if it's a health term
            text_lower = text.lower().replace(" ", "_")
            if text_lower in HEALTH_TERMS and target_lang in HEALTH_TERMS[text_lower]:
                return HEALTH_TERMS[text_lower][target_lang]
            
            # Map code to full language name if necessary (deep-translator handles 'en', 'hi', etc.)
            # Translate using deep-translator
            translated = GoogleTranslator(
                source=source_lang, 
                target=target_lang
            ).translate(text)
            
            logger.info(f"Translated: {text[:30]}... ({source_lang}→{target_lang})")
            return translated
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return text  # Return original on error
    
    def translate_batch(
        self, 
        texts: List[str], 
        target_lang: str,
        source_lang: str = "auto"
    ) -> List[str]:
        """Translate multiple texts at once"""
        return [self.translate(text, target_lang, source_lang) for text in texts]
    
    def detect_language(self, text: str) -> str:
        """Detect language of text using langdetect (more reliable)"""
        try:
            from langdetect import detect
            return detect(text)
        except:
            return "en"

# Global translator instance
_translator = TranslationService()

# Convenience functions
def translate_text(
    text: str, 
    target_lang: str, 
    source_lang: str = "auto"
) -> str:
    """Translate text"""
    return _translator.translate(text, target_lang, source_lang)

def translate_batch(
    texts: List[str], 
    target_lang: str,
    source_lang: str = "auto"
) -> List[str]:
    """Translate multiple texts"""
    return _translator.translate_batch(texts, target_lang, source_lang)

def detect_language(text: str) -> str:
    """Detect language"""
    return _translator.detect_language(text)

def get_supported_languages() -> List[Dict]:
    """Get list of supported languages"""
    return [
        {
            "code": code,
            "name": info["name"],
            "native": info["native"]
        }
        for code, info in SUPPORTED_LANGUAGES.items()
    ]

def get_health_term(term: str, language: str) -> str:
    """Get translated health term"""
    term_key = term.lower().replace(" ", "_")
    if term_key in HEALTH_TERMS and language in HEALTH_TERMS[term_key]:
        return HEALTH_TERMS[term_key][language]
    return term