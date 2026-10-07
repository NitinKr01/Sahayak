"""Configuration: AWS Secrets Manager load + shared boto3 clients.

Env vars with the same name take precedence over Secrets Manager values so
local development can override individual keys (e.g. COGNITO_REDIRECT_URI).
"""
import hashlib
import json
import os
from functools import lru_cache
from pathlib import Path

import boto3

SECRET_NAME = "bandhan-sahayak-app-creds"
REGION = "ap-south-1"
COGNITO_REDIRECT_URI = "http://localhost:5173/auth/callback"

# Repo root (parent of backend/) — faiss_index/, img/ and fonts/ live here.
ROOT_DIR = Path(__file__).resolve().parents[2]


@lru_cache(maxsize=1)
def load_secrets() -> dict:
    client = boto3.client("secretsmanager", region_name=REGION)
    resp = client.get_secret_value(SecretId=SECRET_NAME)
    secret_text = resp.get("SecretString") or resp.get("SecretBinary")
    return json.loads(secret_text)


class Settings:
    def __init__(self):
        secrets = load_secrets()

        def get(key, default=None):
            return os.environ.get(key) or secrets.get(key, default)

        # self.REDIRECT_URI = get("COGNITO_REDIRECT_URI")
        self.REDIRECT_URI = COGNITO_REDIRECT_URI
        self.MODEL_NAME = get("MODEL_NAME")
        self.COGNITO_DOMAIN = get("COGNITO_DOMAIN")
        self.CLIENT_ID = get("COGNITO_CLIENT_ID")
        self.GROQ_API_KEY = get("GROQ_API_KEY")
        self.SAGEMAKER_ENDPOINT = get("SAGEMAKER_ENDPOINT")
        self.S3_BUCKET_NAME = get("S3_BUCKET_NAME")
        self.SPEECH_API_KEY = get("SPEECH_API_KEY")

        self.TOKEN_URL = f"https://{self.COGNITO_DOMAIN}/oauth2/token"
        self.USERINFO_URL = f"https://{self.COGNITO_DOMAIN}/oauth2/userInfo"

        # BI quote API credentials (note: BI_QOUTE_URL typo exists in the secret)
        self.BI_SECRETS = {
            "HEADER_BI_API": get("HEADER_BI_API"),
            "BI_X_API_KEY": get("BI_X_API_KEY"),
            "BI_AUTH_URL": get("BI_AUTH_URL"),
            "BI_QUOTE_URL": get("BI_QOUTE_URL"),
            "BI_CLIENT_AUTH_HEADER": get("BI_CLIENT_AUTH_HEADER"),
            "BI_COMBI_URL": get("BI_COMBI_URL"),
        }

        # Session-cookie signing key. Add a SESSION_SECRET key to the secret to
        # control it explicitly; the fallback derivation means rotating
        # GROQ_API_KEY logs everyone out (harmless).
        self.SESSION_SECRET = get("SESSION_SECRET") or hashlib.sha256(
            f"{self.CLIENT_ID}:{self.GROQ_API_KEY}".encode()
        ).hexdigest()

        # Secure cookies whenever the app is served over https.
        self.COOKIE_SECURE = (self.REDIRECT_URI or "").startswith("https")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


@lru_cache(maxsize=1)
def get_s3_client():
    return boto3.client("s3", region_name=REGION)


@lru_cache(maxsize=1)
def get_sagemaker_client():
    return boto3.client("sagemaker-runtime", region_name=REGION)
