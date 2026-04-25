import os
import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

# Wildcard CORS — allow_credentials MUST be False when allow_origins=["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Explicit OPTIONS handler so Railway proxy never returns 404/405 on preflight
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    return JSONResponse(
        content={},
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "600",
        },
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
