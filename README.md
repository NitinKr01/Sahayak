# bandhan-sahayak-app

Sahayak AI Agent for Bandhan Life — React SPA + FastAPI backend.

> The legacy Streamlit app (`app.py`, `bi_forms.py`, `.streamlit/`) is kept
> until the migration is verified in QA, then can be deleted.

## Architecture

- `frontend/` — Vite + React + TypeScript + Tailwind SPA (chat UI, BI wizard,
  login pages). Built to `frontend/dist` and served by the backend.
- `backend/` — FastAPI app (`backend/app/`):
  - `routers/` — `/api/auth`, `/api/chat`, `/api/sessions`, `/api/feedback`,
    `/api/bi`, `/api/stt`, `/api/tts`, `/api/metrics`
  - `services/` — RAG engine (FAISS + SageMaker embeddings + Groq), S3
    persistence, e-library, Sarvam speech, BI quote + creative
    (`bi_premium.py` / `bi_image.py` moved unchanged from the repo root)
- `faiss_index/`, `img/`, `fonts/` — runtime assets read by the backend
  (paths are relative to the repo root; the backend chdirs there on startup).
- Auth: Cognito Hosted UI → `/auth/callback` (React route) → POST
  `/api/auth/callback` → backend exchanges the code and sets a signed
  httpOnly session cookie. Tokens never reach browser JS.
- Chat history is stored in S3 `chats/{email}.json` with the **same schema**
  as the Streamlit app, so existing users keep their history.

## Local development

Prereqs: Python 3.12+, Node 20+, AWS credentials with access to Secrets
Manager (`bandhan-sahayak-app-creds`), S3 and SageMaker runtime (ap-south-1).

```bash
# backend (from the repo root)
pip install -r backend/requirements.txt
set COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback   # dev override
uvicorn backend.app.main:app --port 8501 --reload

# frontend (second terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api -> :8501
```

`http://localhost:5173/auth/callback` must be registered as a callback URL on
the Cognito app client for local login to work. Any key in the secret can be
overridden with an environment variable of the same name.

## Production build

The multi-stage `Dockerfile` builds the frontend (node:20), installs the
backend, and serves everything with uvicorn on **port 8501** (unchanged, so
the existing Helm values / ALB target group need no changes):

```bash
docker build -t bandhan-sahayak-app .
docker run -p 8501:8501 bandhan-sahayak-app
```

SPA routes are served by a catch-all in `backend/app/main.py`; the API lives
under `/api/*`; health probe at `/health`.

## Cutover checklist

1. Add `https://<domain>/auth/callback` to the Cognito app client and update
   the `COGNITO_REDIRECT_URI` value in Secrets Manager.
2. (Optional, recommended) add a `SESSION_SECRET` key to the secret for
   session-cookie signing.
3. Jenkins: update `sonar.sources=app.py` to `sonar.sources=backend`; ensure
   the build agent can pull `node:20`.
4. Verify in QA, then delete `app.py`, `bi_forms.py`, `bi_premium.py`,
   `bi_image.py` (root copies), `.streamlit/` and `requirements.txt` (root).
