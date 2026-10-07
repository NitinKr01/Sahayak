"""Benefit Illustration endpoints. On completion the assistant message is
appended to the chat history and the history log written — same as app.py
(the image itself is never persisted)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..services import storage
from ..services.bi import PRODUCTS, generate_bi
from .chat import load_current_session

router = APIRouter(prefix="/api/bi", tags=["bi"])


class GenerateBody(BaseModel):
    product: str
    form_data: dict


@router.get("/products")
def products():
    return {"products": PRODUCTS}


@router.post("/generate")
def generate(body: GenerateBody, user: dict = Depends(get_current_user)):
    if body.product not in PRODUCTS:
        raise HTTPException(status_code=400, detail=f"Unknown product: {body.product}")

    email = user["email"]
    try:
        image_b64 = generate_bi(body.product, body.form_data)
        answer = ""
    except Exception as e:
        answer = f"Error occurred:\n{str(e)}"
        image_b64 = None

    data, current = load_current_session(email)
    history = current["history"]
    history.append({"role": "assistant", "content": answer, "avatar": "img/logo.png"})

    question = ""
    if len(history) >= 2 and history[-2].get("role") == "user":
        question = history[-2].get("content", "")
    storage.save_history(email, question, answer, "General")
    storage.save_user_data(email, data)

    return {
        "answer": answer,
        "image_b64": image_b64,
        "message_index": len(history) - 1,
    }
