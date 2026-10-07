from datetime import datetime

from fastapi import APIRouter, Depends

from ..auth import get_current_user
from ..services import storage

router = APIRouter(prefix="/api", tags=["misc"])


def _py(value):
    """numpy scalar -> plain python for JSON serialization."""
    return value.item() if hasattr(value, "item") else value


@router.get("/metrics")
def metrics(user: dict = Depends(get_current_user)):
    """Target-vs-achieved KPI cards shown in the sidebar."""
    try:
        row, metadata = storage.get_user_performance_row(user["email"])
    except Exception as e:
        print(f"Metrics lookup failed: {e}")
        return {"registered": False}

    if row is None:
        return {"registered": False}

    report_date = ""
    raw = (metadata.get("report_date", "") or "").strip()
    if raw:
        try:
            dt = datetime.fromisoformat(raw)
            report_date = f"{dt.day} {dt.strftime('%B %Y')}"
        except ValueError:
            report_date = raw

    return {
        "registered": True,
        "target": _py(row["Target"]),
        "achieved": _py(row["Achieved"]),
        "achieved_percent": _py(row["Achieved_percent"]),
        "designation": str(row.get("Designation", "")),
        "report_date": report_date,
    }
