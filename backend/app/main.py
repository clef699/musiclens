import os
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.uploads import router as uploads_router
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MusicLens API",
    description="Audio analysis API for musicians",
    version="1.0.0",
)

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:80",
    "https://musiclens-rosy.vercel.app",
]

# Allow additional origins via env var (comma-separated)
_extra = os.getenv("CORS_ORIGINS", "")
if _extra:
    CORS_ORIGINS.extend(o.strip() for o in _extra.split(",") if o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(uploads_router)

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "MusicLens API"}


@app.get("/")
def root():
    return {"message": "MusicLens API", "docs": "/docs"}
