import os
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Hardcoded allowed origins — always present regardless of env vars
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:80",
    "https://musiclens-rosy.vercel.app",
]

# Extra origins from Railway env var CORS_ORIGINS (comma-separated)
for _origin in os.getenv("CORS_ORIGINS", "").split(","):
    _origin = _origin.strip()
    if _origin and _origin not in CORS_ORIGINS:
        CORS_ORIGINS.append(_origin)

logger.info("CORS allowed origins: %s", CORS_ORIGINS)

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
