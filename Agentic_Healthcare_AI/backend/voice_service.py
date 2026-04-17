"""
Voice Service - Speech-to-Text & Text-to-Speech
Business-Grade Edition: Supports 10 Indian Languages
Uses: ElevenLabs Multilingual V2 (primary) → gTTS (fallback)
"""

import io
import logging
import re
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

from config import settings

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

# All 10 supported language codes (BCP-47 format for Google Speech API)
LANGUAGE_CODES = {
    "en":  "en-IN",   # English (India)
    "hi":  "hi-IN",   # Hindi
    "ta":  "ta-IN",   # Tamil
    "te":  "te-IN",   # Telugu
    "bn":  "bn-IN",   # Bengali
    "mr":  "mr-IN",   # Marathi
    "gu":  "gu-IN",   # Gujarati
    "kn":  "kn-IN",   # Kannada
    "ml":  "ml-IN",   # Malayalam
    "pa":  "pa-IN",   # Punjabi (Gurmukhi)
}

# gTTS language code mapping (gTTS uses slightly different codes)
GTTS_LANGUAGE_CODES = {
    "en": "en",
    "hi": "hi",
    "ta": "ta",
    "te": "te",
    "bn": "bn",
    "mr": "mr",
    "gu": "gu",
    "kn": "kn",
    "ml": "ml",
    "pa": "pa",
}


class VoiceService:
    """
    Production-grade voice service for speech-to-text and text-to-speech.
    Supports 10 Indian languages with ElevenLabs → gTTS fallback chain.
    """

    @staticmethod
    def _preprocess_text_for_speech(text: str) -> str:
        """
        Clean text for natural TTS pronunciation.
        Strips markdown, emojis, list markers, and excessive whitespace.
        """
        # Remove markdown bold/italic/headers
        text = text.replace("**", "").replace("__", "").replace("*", "").replace("_", "")
        text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)

        # Remove numbered and bulleted list markers
        text = re.sub(r'^\d+\.\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'^[-•]\s+', '', text, flags=re.MULTILINE)

        # Remove common healthcare platform emojis
        emoji_pattern = re.compile(
            "[\U0001F600-\U0001F64F"   # emoticons
            "\U0001F300-\U0001F5FF"   # symbols & pictographs
            "\U0001F680-\U0001F6FF"   # transport & map
            "\U0001F1E0-\U0001F1FF"   # flags
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "✅❌📡🚀🚨📞👨‍⚕️📋💊📈📉🔴🟡🟢]+",
            flags=re.UNICODE
        )
        text = emoji_pattern.sub('', text)

        # Collapse multiple newlines/spaces
        text = re.sub(r'\n{2,}', '. ', text)
        text = re.sub(r'\s{2,}', ' ', text)

        return text.strip()

    @staticmethod
    def speech_to_text(audio_data: bytes, language: str = "hi") -> str:
        """
        Convert speech audio bytes to text using Google Speech Recognition.

        Args:
            audio_data: Raw audio file bytes (WAV format preferred)
            language:   BCP-47 language code key (hi, ta, te, bn, mr, gu, kn, ml, pa, en)

        Returns:
            Transcribed text string, or an error message string.
        """
        if not SR_AVAILABLE:
            raise Exception("SpeechRecognition library not available. Install: pip install SpeechRecognition")

        try:
            recognizer = sr.Recognizer()
            audio_file = io.BytesIO(audio_data)

            with sr.AudioFile(audio_file) as source:
                # Adjust for ambient noise to improve accuracy in field conditions
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = recognizer.record(source)

            lang_code = LANGUAGE_CODES.get(language, "hi-IN")
            text = recognizer.recognize_google(audio, language=lang_code)

            logger.info(f"STT OK ({language}/{lang_code}): '{text[:60]}...'")
            return text

        except sr.UnknownValueError:
            logger.warning("STT: Could not understand audio — please speak clearly")
            return "Speech not recognized. Please speak clearly and try again."
        except sr.RequestError as e:
            logger.error(f"STT API error: {e}")
            return "Voice service temporarily unavailable. Check internet connection."
        except Exception as e:
            logger.error(f"STT unexpected error: {e}")
            return f"Transcription error: {str(e)}"

    @staticmethod
    def text_to_speech(text: str, language: str = "hi") -> bytes:
        """
        Convert text to speech audio (MP3 bytes).

        Strategy:
          1. Try ElevenLabs Multilingual V2 (neural, high-fidelity, 29+ languages)
          2. Fallback: gTTS (Google Text-to-Speech, free, all 10 Indian languages)

        Args:
            text:     Text to synthesize (markdown will be stripped automatically)
            language: Language code key (hi, ta, te, bn, mr, gu, kn, ml, pa, en)

        Returns:
            MP3 audio bytes
        """
        if not GTTS_AVAILABLE:
            raise Exception("gTTS not available. Install: pip install gtts")

        # Pre-process: strip markdown / emojis for clean pronunciation
        clean_text = VoiceService._preprocess_text_for_speech(text)

        # Safety: cap at 5000 characters for API limits
        clean_text = clean_text[:5000]

        if not clean_text.strip():
            raise Exception("No speakable text after preprocessing.")

        try:
            # ── OPTION 1: ElevenLabs Neural Voice (High Fidelity) ──────────────
            if ELEVENLABS_AVAILABLE and getattr(settings, 'ELEVENLABS_API_KEY', None):
                try:
                    client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
                    # Rachel (ID: 21m00Tcm4TlvDq8ikWAM) — professional female consultant tone
                    # eleven_multilingual_v2 auto-detects script language
                    audio_generator = client.text_to_speech.convert(
                        voice_id="21m00Tcm4TlvDq8ikWAM",
                        text=clean_text,
                        model_id="eleven_multilingual_v2",
                        output_format="mp3_44100_128"
                    )
                    audio = b"".join(list(audio_generator))
                    logger.info(f"TTS OK (ElevenLabs Multilingual V2, lang={language}): {len(audio)//1024}KB")
                    return audio
                except Exception as e:
                    logger.warning(f"ElevenLabs TTS failed, falling back to gTTS: {e}")

            # ── OPTION 2: gTTS (Google Text-to-Speech — Free Fallback) ─────────
            gtts_lang = GTTS_LANGUAGE_CODES.get(language, "hi")
            tts = gTTS(text=clean_text, lang=gtts_lang, slow=False)

            audio_fp = io.BytesIO()
            tts.write_to_fp(audio_fp)
            audio_fp.seek(0)
            audio_bytes = audio_fp.read()

            logger.info(f"TTS OK (gTTS, lang={language}/{gtts_lang}): {len(audio_bytes)//1024}KB")
            return audio_bytes

        except Exception as e:
            logger.error(f"TTS error: {e}")
            raise Exception(f"Text-to-speech failed: {str(e)}")


# ── Module-level convenience functions ─────────────────────────────────────────

def speech_to_text(audio_data: bytes, language: str = "hi") -> str:
    """Convert speech audio bytes to text. Used by /api/voice/transcribe."""
    return VoiceService.speech_to_text(audio_data, language)


def text_to_speech(text: str, language: str = "hi") -> bytes:
    """Convert text to MP3 audio bytes. Used by /api/voice/synthesize."""
    return VoiceService.text_to_speech(text, language)


def get_supported_voice_languages() -> list:
    """Return all supported languages for voice features."""
    return [
        {"code": "en", "name": "English",   "native": "English",     "gtts": True, "elevenlabs": True},
        {"code": "hi", "name": "Hindi",     "native": "हिंदी",        "gtts": True, "elevenlabs": True},
        {"code": "ta", "name": "Tamil",     "native": "தமிழ்",        "gtts": True, "elevenlabs": True},
        {"code": "te", "name": "Telugu",    "native": "తెలుగు",       "gtts": True, "elevenlabs": True},
        {"code": "bn", "name": "Bengali",   "native": "বাংলা",        "gtts": True, "elevenlabs": True},
        {"code": "mr", "name": "Marathi",   "native": "मराठी",        "gtts": True, "elevenlabs": True},
        {"code": "gu", "name": "Gujarati",  "native": "ગુજરાતી",     "gtts": True, "elevenlabs": True},
        {"code": "kn", "name": "Kannada",   "native": "ಕನ್ನಡ",        "gtts": True, "elevenlabs": True},
        {"code": "ml", "name": "Malayalam", "native": "മലയാളം",       "gtts": True, "elevenlabs": True},
        {"code": "pa", "name": "Punjabi",   "native": "ਪੰਜਾਬੀ",      "gtts": True, "elevenlabs": False},
    ]