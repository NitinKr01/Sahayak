"""S3 persistence: chat sessions, history/feedback logs, campaign images and
the banca performance CSV. Ported from app.py — the chats/{user}.json schema
is kept identical so existing users retain their history."""
import json
import re
import time
from datetime import datetime
from io import StringIO
from typing import Optional

import pandas as pd
from botocore.exceptions import ClientError

from ..config import get_s3_client, get_settings


def _bucket() -> str:
    return get_settings().S3_BUCKET_NAME


# ---------- chat sessions (chats/{user}.json) ----------

def load_user_data(user_id: str) -> Optional[dict]:
    s3 = get_s3_client()
    try:
        response = s3.get_object(Bucket=_bucket(), Key=f"chats/{user_id}.json")
        return json.loads(response["Body"].read().decode("utf-8"))
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        print(f"Error loading user data: {e}")
        return None


def save_user_data(user_id: str, data: dict):
    try:
        get_s3_client().put_object(
            Bucket=_bucket(),
            Key=f"chats/{user_id}.json",
            Body=json.dumps(data, indent=2, default=str).encode("utf-8"),
        )
    except Exception as e:
        print(f"Error saving user data: {e}")


# ---------- daily history / feedback logs ----------

def _append_to_daily_log(prefix: str, record: dict):
    s3 = get_s3_client()
    today = datetime.now().strftime("%Y-%m-%d")
    key = f"{prefix}/{today}/{today}.json"
    try:
        try:
            response = s3.get_object(Bucket=_bucket(), Key=key)
            existing_data = json.loads(response["Body"].read().decode("utf-8"))
        except ClientError:
            existing_data = []
        existing_data.append(record)
        s3.put_object(
            Bucket=_bucket(),
            Key=key,
            Body=json.dumps(existing_data, indent=2).encode("utf-8"),
        )
    except Exception as e:
        print(f"Cannot save {prefix} record: {e}")


def save_history(user: str, question: str, answer: str, selected_product: str):
    _append_to_daily_log(
        "history",
        {
            "timestamp": datetime.now().isoformat(),
            "user": user,
            "product": selected_product,
            "question": question,
            "answer": answer,
        },
    )


def save_feedback_record(
    user: str,
    selected_product: str,
    user_question: str,
    assistant_answer: str,
    feedback_value,
    detailed_feedback: str = "",
):
    _append_to_daily_log(
        "feedback",
        {
            "timestamp": datetime.now().isoformat(),
            "user": user,
            "product": selected_product,
            "user_question": user_question,
            "assistant_answer": assistant_answer,
            "feedback_value": feedback_value,
            "detailed_feedback": detailed_feedback,
        },
    )


# ---------- e-library assets ----------

def list_files_in_folder(folder_name: str) -> list:
    response = get_s3_client().list_objects_v2(Bucket=_bucket(), Prefix=folder_name)
    if "Contents" not in response:
        return []
    return [obj["Key"] for obj in response["Contents"] if not obj["Key"].endswith("/")]


def generate_forced_download_url(file_key: str) -> str:
    filename = file_key.split("/")[-1]
    return get_s3_client().generate_presigned_url(
        "get_object",
        Params={
            "Bucket": _bucket(),
            "Key": file_key,
            "ResponseContentDisposition": f'attachment; filename="{filename}"',
        },
        ExpiresIn=600,
    )


# ---------- campaign image ----------

def load_campaign_image_from_s3(designation: str) -> Optional[bytes]:
    s3 = get_s3_client()
    prefix = "campaign/active_campaign/"
    designation = designation.lower()

    response = s3.list_objects_v2(Bucket=_bucket(), Prefix=prefix)
    for obj in response.get("Contents", []):
        key = obj["Key"]
        filename = key.split("/")[-1]
        name_without_ext = filename.rsplit(".", 1)[0]
        parts = re.split(r"[ _-]+", name_without_ext)
        if parts[-1].lower() == designation:
            file_obj = s3.get_object(Bucket=_bucket(), Key=key)
            return file_obj["Body"].read()
    return None


# ---------- banca performance CSV (5-minute cache, like st.cache_data ttl=300) ----------

_CSV_TTL = 300
_csv_cache: dict = {}


def load_csv_from_s3(key: str = "banca_performance/data.csv"):
    now = time.time()
    hit = _csv_cache.get(key)
    if hit and now - hit[0] < _CSV_TTL:
        return hit[1]
    obj = get_s3_client().get_object(Bucket=_bucket(), Key=key)
    data = obj["Body"].read().decode("utf-8")
    result = (pd.read_csv(StringIO(data)), obj.get("Metadata", {}))
    _csv_cache[key] = (now, result)
    return result


def get_user_performance_row(email: str):
    """Returns (row, metadata) for the logged-in user, or (None, metadata)."""
    data, metadata = load_csv_from_s3()
    user_data = data[
        (data["email_id"] == email) | (data["email_id"].str.lower() == email)
    ]
    if user_data.empty:
        return None, metadata
    return user_data.iloc[0], metadata
