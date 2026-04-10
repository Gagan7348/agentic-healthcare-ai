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
    print("WARNING: gTTS not installed. Install: pip install gtts")

try:
    from elevenlabs.client import ElevenLabs
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False
    print("WARNING: ElevenLabs v2 not installed. Install: pip install elevenlabs")

from .config import settings

try:
    import speech_recognition as sr
    SR_AVAILABLE = True
except ImportError:
    SR_AVAILABLE = False
    print("WARNING: SpeechRecognition not installed. Install: pip install SpeechRecognition")

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("WARNING: pydub not installed. Install: pip install pydub")

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
            
            logger.info(f"OK: Transcribed ({language}): {text[:50]}...")
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
        
    @staticmethod
    def _preprocess_text_for_speech(text: str) -> str:
        """Clean text for natural TTS pronunciation (removes markdown, etc.)"""
        import re
        # Remove markdown bold/italic
        text = text.replace("**", "").replace("__", "").replace("*", "").replace("_", "")
        # Remove headers
        text = re.sub(r'^#+ ', '', text, flags=re.MULTILINE)
        # Remove list markers
        text = re.sub(r'^\d+\. ', '', text, flags=re.MULTILINE)
        text = re.sub(r'^- ', '', text, flags=re.MULTILINE)
        # Remove redundant spaces and symbols
        text = text.replace("✅", "").replace("❌", "").replace("📡", "").replace("🚀", "")
        return text.strip()

    @staticmethod
    def text_to_speech(text: str, language: str = "hi") -> bytes:
        """
        Convert text to speech using ElevenLabs Multilingual V2
        Supports 29+ languages including Hindi, Tamil, etc.
        """
        if not GTTS_AVAILABLE:
            raise Exception("gTTS fallback not available")
        
        # Pre-process for better pronunciation
        clean_text = VoiceService._preprocess_text_for_speech(text)
        
        try:
            # OPTION 1: ElevenLabs (High Fidelity Neural Voice)
            if ELEVENLABS_AVAILABLE and settings.ELEVENLABS_API_KEY:
                try:
                    client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
                    # Use 'Rachel' Voice ID for professional female consultant
                    # Multilingual V2 automatically detects and speaks the script naturally
                    audio_generator = client.text_to_speech.convert(
                        voice_id="21m00Tcm4TlvDq8ikWAM", 
                        text=clean_text,
                        model_id="eleven_multilingual_v2",
                        output_format="mp3_44100_128"
                    )
                    audio = b"".join(list(audio_generator))
                    logger.info(f"OK: ElevenLabs Synthesis Complete ({language})")
                    return audio
                except Exception as e:
                    logger.warning(f"ElevenLabs Error: {e}. Falling back to gTTS.")

            # OPTION 2: gTTS (Standard Multilingual)
            gtts_lang = language if language != "en" else "en"
            tts = gTTS(text=clean_text, lang=gtts_lang, slow=False)
            
            audio_fp = io.BytesIO()
            tts.write_to_fp(audio_fp)
            audio_fp.seek(0)
            return audio_fp.read()
            
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