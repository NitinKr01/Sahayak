"""Thumbs + detailed feedback. Mirrors app.py: thumbs-up records immediately;
thumbs-down flags the message and the record is written when the detailed
feedback form is submitted."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..services import storage
from .chat import load_current_session

router = APIRouter(prefix="/api", tags=["feedback"])


class FeedbackBody(BaseModel):
    message_index: int
    feedback_value: int  # 1 = thumbs up, 0 = thumbs down
    detailed_feedback: Optional[str] = None


@router.post("/feedback")
def submit_feedback(body: FeedbackBody, user: dict = Depends(get_current_user)):
    email = user["email"]
    data, current = load_current_session(email)
    history = current["history"]

    idx = body.message_index
    if idx < 1 or idx >= len(history) or history[idx].get("role") != "assistant":
        raise HTTPException(status_code=400, detail="Invalid message index")

    msg = history[idx]
    msg["feedback"] = body.feedback_value

    if body.feedback_value == 1:
        storage.save_feedback_record(
            email, "General", history[idx - 1].get("content", ""),
            msg.get("content", ""), 1,
        )
    elif body.detailed_feedback is None:
        # Thumbs down without details yet: wait for the detailed form
        msg["show_detailed_fb"] = True
    else:
        msg["detailed_fb"] = body.detailed_feedback
        msg["show_detailed_fb"] = False
        storage.save_feedback_record(
            email, "General", history[idx - 1].get("content", ""),
            msg.get("content", ""), 0, body.detailed_feedback,
        )

    storage.save_user_data(email, data)
    return {"ok": True}
