"""Sarvam AI speech-to-text and text-to-speech, ported from app.py.
API keys stay server-side; the browser only exchanges audio/text with us."""
from typing import Optional

import requests
from langdetect import detect

from ..config import get_settings


def speech_to_text(audio_bytes: bytes) -> str:
    """Transcribe using Sarvam STT (multilingual Indian support)."""
    if len(audio_bytes) < 3000:
        raise ValueError("Audio too short to transcribe")

    response = requests.post(
        "https://api.sarvam.ai/speech-to-text",
        headers={"api-subscription-key": get_settings().SPEECH_API_KEY},
        files={"file": ("audio.wav", audio_bytes, "audio/wav")},
        data={"model": "saaras:v3", "mode": "codemix"},
    )
    response.raise_for_status()
    return response.json().get("transcript", "")


def detect_language_code(text: str) -> str:
    try:
        lang = detect(text)
        return f"{lang}-IN"
    except Exception:
        return "en-IN"


def call_sarvam_tts(text: str) -> Optional[str]:
    """Returns base64-encoded audio (wav) or None on failure."""
    try:
        detected_lang = detect_language_code(text)
        response = requests.post(
            "https://api.sarvam.ai/text-to-speech",
            headers={
                "api-subscription-key": get_settings().SPEECH_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "target_language_code": detected_lang,
                "model": "bulbul:v3",
                "voice": "shubh",
            },
        )
        if response.status_code != 200:
            return None
        audios = response.json().get("audios")
        if not audios:
            return None
        return audios[0]
    except Exception as e:
        print("TTS ERROR:", e)
        return None
