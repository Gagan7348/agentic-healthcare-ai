"""
Voice Service - Speech-to-Text & Text-to-Speech
Supports 7 Indian Languages
Uses: Google Cloud Speech API & gTTS
"""

import io
import logging
from typing import Optional
import base64

# Voice libraries
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    print("⚠️  gTTS not installed. Install: pip install gtts")

try:
    from elevenlabs.client import ElevenLabs
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False
    print("⚠️  ElevenLabs v2 not installed. Install: pip install elevenlabs")

from .config import settings

try:
    import speech_recognition as sr
    SR_AVAILABLE = True
except ImportError:
    SR_AVAILABLE = False
    print("⚠️  SpeechRecognition not installed. Install: pip install SpeechRecognition")

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("⚠️  pydub not installed. Install: pip install pydub")

logger = logging.getLogger(__name__)

# Language codes mapping
LANGUAGE_CODES = {
    "en": "en-IN",      # English (India)
    "hi": "hi-IN",      # Hindi
    "ta": "ta-IN",      # Tamil
    "te": "te-IN",      # Telugu
    "bn": "bn-IN",      # Bengali
    "mr": "mr-IN",      # Marathi
    "gu": "gu-IN"       # Gujarati
}

class VoiceService:
    """Voice service for speech-to-text and text-to-speech"""
    
    @staticmethod
    def speech_to_text(audio_data: bytes, language: str = "hi") -> str:
        """
        Convert speech to text
        
        Args:
            audio_data: Audio file bytes
            language: Language code (hi, ta, te, bn, mr, gu, en)
        
        Returns:
            Transcribed text
        """
        if not SR_AVAILABLE:
            raise Exception("SpeechRecognition not available")
        
        try:
            # Initialize recognizer
            recognizer = sr.Recognizer()
            
            # Convert bytes to audio file
            audio_file = io.BytesIO(audio_data)
            
            # Load audio
            with sr.AudioFile(audio_file) as source:
                audio = recognizer.record(source)
            
            # Get language code
            lang_code = LANGUAGE_CODES.get(language, "hi-IN")
            
            # Recognize speech using Google Speech Recognition
            text = recognizer.recognize_google(audio, language=lang_code)
            
            logger.info(f"✅ Transcribed ({language}): {text[:50]}...")
            return text
            
        except sr.UnknownValueError:
            logger.error("Could not understand audio")
            return "Speech not recognized. Please speak clearly."
        except sr.RequestError as e:
            logger.error(f"API error: {e}")
            return "Voice service temporarily unavailable."
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return f"Error: {str(e)}"
    
    @staticmethod
    def text_to_speech(text: str, language: str = "hi") -> bytes:
        """
        Convert text to speech
        
        Args:
            text: Text to convert
            language: Language code (hi, ta, te, bn, mr, gu, en)
        
        Returns:
            Audio bytes (MP3 format)
        """
        if not GTTS_AVAILABLE:
            raise Exception("gTTS not available")
        
        try:
            # OPTION 1: ElevenLabs (High Fidelity Neural Voice)
            if ELEVENLABS_AVAILABLE and settings.ELEVENLABS_API_KEY:
                try:
                    client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
                    # Generate audio using v2 client
                    audio_generator = client.text_to_speech.convert(
                        voice_id="21m00Tcm4TlvDq8ikWAM", # 'Rachel' - very clear medical voice
                        text=text,
                        model_id="eleven_multilingual_v2"
                    )
                    # Convert generator to bytes
                    audio = b"".join(list(audio_generator))
                    logger.info(f"✅ Generated ElevenLabs voice ({language})")
                    return audio
                except Exception as e:
                    logger.warning(f"ElevenLabs Fallback to gTTS: {e}")

            # OPTION 2: gTTS (Standard Multilingual)
            if not GTTS_AVAILABLE:
                raise Exception("gTTS not available")
                
            # Get language code for gTTS
            gtts_lang = language if language != "en" else "en"
            
            # Create gTTS object
            tts = gTTS(text=text, lang=gtts_lang, slow=False)
            
            # Save to bytes
            audio_fp = io.BytesIO()
            tts.write_to_fp(audio_fp)
            audio_fp.seek(0)
            
            audio_data = audio_fp.read()
            
            logger.info(f"✅ Generated gTTS speech ({language}): {len(audio_data)} bytes")
            return audio_data
            
        except Exception as e:
            logger.error(f"TTS error: {e}")
            raise Exception(f"Text-to-speech error: {str(e)}")

# Convenience functions
def speech_to_text(audio_data: bytes, language: str = "hi") -> str:
    """Convert speech to text"""
    return VoiceService.speech_to_text(audio_data, language)

def text_to_speech(text: str, language: str = "hi") -> bytes:
    """Convert text to speech"""
    return VoiceService.text_to_speech(text, language)

def get_supported_voice_languages() -> list:
    """Get list of supported languages for voice"""
    return [
        {"code": "en", "name": "English", "native": "English"},
        {"code": "hi", "name": "Hindi", "native": "हिंदी"},
        {"code": "ta", "name": "Tamil", "native": "தமிழ்"},
        {"code": "te", "name": "Telugu", "native": "తెలుగు"},
        {"code": "bn", "name": "Bengali", "native": "বাংলা"},
        {"code": "mr", "name": "Marathi", "native": "मराठी"},
        {"code": "gu", "name": "Gujarati", "native": "ગુજરાતી"},
        {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ"},
        {"code": "ml", "name": "Malayalam", "native": "മലയാളം"},
        {"code": "pa", "name": "Punjabi", "native": "ਪੰਜਾਬੀ"}
    ]