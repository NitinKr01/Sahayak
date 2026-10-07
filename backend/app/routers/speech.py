from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from ..auth import get_current_user
from ..services.speech import call_sarvam_tts, speech_to_text

router = APIRouter(prefix="/api", tags=["speech"])


@router.post("/stt")
def stt(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    audio_bytes = file.file.read()
    try:
        text = speech_to_text(audio_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"transcription failed: {e}")
    return {"text": text}


class TTSBody(BaseModel):
    text: str


@router.post("/tts")
def tts(body: TTSBody, user: dict = Depends(get_current_user)):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="No text to speak")
    audio_b64 = call_sarvam_tts(body.text)
    if not audio_b64:
        raise HTTPException(status_code=502, detail="TTS generation failed")
    return {"audio_b64": audio_b64}
