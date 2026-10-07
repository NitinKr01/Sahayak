import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import ROOT_DIR
from .routers import auth, bi, chat, feedback, misc, speech

# bi_image.py references fonts/ and img/ relative to the repo root.
os.chdir(ROOT_DIR)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Warm the RAG engine (FAISS + product list) so the first chat is fast.
    # Best-effort: without AWS access the app still serves auth/static routes,
    # and get_advisor() retries on the first chat request.
    try:
        from .services.rag import get_advisor

        get_advisor()
        print("RAG engine warmed up")
    except Exception as e:
        print(f"RAG warmup failed (will retry on first request): {e}")
    yield


app = FastAPI(title="Sahayak API", lifespan=lifespan)

# Only needed for local dev (Vite on :5173 proxying is the default; direct
# cross-origin calls also work thanks to this).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(feedback.router)
app.include_router(bi.router)
app.include_router(speech.router)
app.include_router(misc.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---- SPA (React build) ----
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"

if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        candidate = (FRONTEND_DIST / full_path).resolve()
        if (
            full_path
            and candidate.is_file()
            and candidate.is_relative_to(FRONTEND_DIST.resolve())
        ):
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
