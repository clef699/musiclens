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

# Allow all origins for now — tighten after confirming deployment works
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(uploads_router)

try:
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
except Exception as e:
    logger.warning("Could not create upload dir %s: %s", settings.UPLOAD_DIR, e)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "MusicLens API"}


@app.get("/")
def root():
    return {"message": "MusicLens API", "docs": "/docs"}
