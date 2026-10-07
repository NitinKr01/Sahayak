"""Chat + session endpoints. The POST /api/chat pipeline is a direct port of
the post-answer flow in app.py main(): sensitive check -> BI detection -> RAG
answer -> </think> strip -> auto-title -> fund keywords -> e-library links ->
campaign image -> optional TTS -> persist to S3."""
import base64
import re
from datetime import datetime
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..services import storage
from ..services.elibrary import (
    BOTH_KEYWORDS,
    CAMPAIGN_KEYWORDS,
    FUND_KEYWORDS,
    detect_bi_product,
    get_all_assets_for_product,
    is_elibrary_query,
    is_sensitive_query,
)
from ..services.rag import get_advisor
from ..services.speech import call_sarvam_tts

router = APIRouter(prefix="/api", tags=["chat"])

SENSITIVE_BLOCK_MESSAGE = (
    "🚫 This question cannot be processed as it may contain sensitive or "
    "personal information (PII/PHI). Please avoid sharing such details. "
    "[Compliance block]"
)


def default_user_data() -> dict:
    return {
        "sessions": [
            {
                "id": str(uuid4()),
                "name": "Chat 1",
                "timestamp": datetime.now().isoformat(),
                "history": [],
                "custom_name": False,
            }
        ],
        "current_session": 0,
    }


def load_current_session(email: str):
    """Returns (data, current_session_dict). Never fails: falls back to a
    fresh default when nothing is stored yet."""
    data = storage.load_user_data(email) or default_user_data()
    if not data.get("sessions"):
        data = default_user_data()
    cur = data.get("current_session", 0)
    if not isinstance(cur, int) or cur >= len(data["sessions"]):
        cur = 0
    data["current_session"] = cur
    current = data["sessions"][cur]
    current.setdefault("history", [])
    return data, current


class ChatBody(BaseModel):
    message: str
    tts: bool = False


class AppendBody(BaseModel):
    content: str


def _elibrary_hint(user_q: str) -> str:
    return (
        "To provide download links, please specify the product name with query — for example:\n"
        f"- “{user_q} for GIP”\n"
        f"- “{user_q} for Shubh Samriddhi”\n"
        f"- “iGV {user_q}”, likewise"
    )


@router.post("/chat")
def chat(body: ChatBody, user: dict = Depends(get_current_user)):
    email = user["email"]
    user_q = body.message.strip()
    if not user_q:
        raise HTTPException(status_code=400, detail="Empty message")

    sensitive, _method, _entities = is_sensitive_query(user_q)
    if sensitive:
        return {"type": "blocked", "answer": SENSITIVE_BLOCK_MESSAGE}

    data, current = load_current_session(email)
    history = current["history"]
    history.append({"role": "user", "content": user_q, "avatar": ":material/person:"})

    # BI creative request -> tell the frontend to open the wizard
    bi_product = detect_bi_product(user_q)
    if bi_product:
        storage.save_user_data(email, data)
        return {"type": "bi_form", "bi_product": bi_product, "session_name": current["name"]}

    answer, detected_products = get_advisor().get_response(user_q, history[:-1])

    # Strip any </think> artifacts
    m = re.search(r"</think>\s*(.*)", answer, re.DOTALL)
    if m:
        answer = m.group(1).strip()

    # Auto-title (same trigger condition as app.py)
    if not current.get("custom_name") and len(history) >= 2:
        title = user_q if len(user_q) <= 20 else " ".join(user_q.split()[:4])
        current["name"] = title
        current["custom_name"] = True

    if any(y in user_q.lower() for y in FUND_KEYWORDS):
        detected_products.append("NFL Midcap Fund")

    # E-library: adjust answer text and attach structured download links
    downloads = None
    is_elib, type_of_docs = is_elibrary_query(user_q)
    if is_elib:
        if any(k in user_q.lower() for k in BOTH_KEYWORDS):
            if len(detected_products) == 0:
                answer += "\n\n" + _elibrary_hint(user_q)
            else:
                answer += "\n\nHere are the download links for " + ", ".join(detected_products)
        elif len(detected_products) == 0:
            answer = _elibrary_hint(user_q)
        else:
            answer = "Here are the download links for " + ", ".join(detected_products)

        if detected_products:
            downloads = [
                {
                    "product": product,
                    "files": get_all_assets_for_product(
                        f"product_information/{product}/", type_of_docs
                    ),
                }
                for product in detected_products
            ]

    # Campaign image
    campaign_image_b64 = None
    is_campaign_image = False
    if any(k.lower() in user_q.lower() for k in CAMPAIGN_KEYWORDS):
        try:
            row, _meta = storage.get_user_performance_row(email)
        except Exception as e:
            print(f"Performance CSV lookup failed: {e}")
            row = None
        if row is not None:
            image_bytes = storage.load_campaign_image_from_s3(row["Designation"])
            if image_bytes:
                answer = "Here is the Campaign Image :"
                campaign_image_b64 = base64.b64encode(image_bytes).decode()
                is_campaign_image = True
            else:
                answer = "There is currently no campaign running for you."
        else:
            answer = (
                "Hi! You are not eligible to see campaign image because you are "
                "not a registered RM, CM, or RBM."
            )

    # Auto-read (client toggle), skipped for campaign images — same as app.py
    audio_b64 = None
    if body.tts and answer and answer.strip() and not is_campaign_image:
        try:
            audio_b64 = call_sarvam_tts(answer)
        except Exception as e:
            print(f"TTS Error: {e}")

    history.append({"role": "assistant", "content": answer or "", "avatar": "img/logo.png"})
    message_index = len(history) - 1

    storage.save_history(email, user_q, answer, "General")
    storage.save_user_data(email, data)

    return {
        "type": "answer",
        "answer": answer or "",
        "downloads": downloads,
        "campaign_image_b64": campaign_image_b64,
        "audio_b64": audio_b64,
        "session_name": current["name"],
        "message_index": message_index,
    }


@router.get("/sessions")
def get_sessions(user: dict = Depends(get_current_user)):
    data, _current = load_current_session(user["email"])
    return data


@router.post("/sessions/append")
def append_assistant_message(body: AppendBody, user: dict = Depends(get_current_user)):
    """Appends an assistant-only message. Used when the user abandons a BI
    form ('Incomplete details...'), matching the Streamlit behavior."""
    email = user["email"]
    data, current = load_current_session(email)
    current["history"].append(
        {"role": "assistant", "content": body.content, "avatar": "img/logo.png"}
    )
    storage.save_user_data(email, data)
    return {"ok": True, "message_index": len(current["history"]) - 1}
