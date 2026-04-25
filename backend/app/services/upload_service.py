import uuid
import asyncio
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
import aiofiles

from app.core.config import settings
from app.models.upload import Upload, UploadStatus
from app.models.result import Result

logger = logging.getLogger(__name__)

SUPPORTED_INSTRUMENTS = [
    "piano", "keyboard", "lead_guitar", "bass_guitar",
    "alto_saxophone", "tenor_saxophone", "trumpet"
]


def validate_file(file: UploadFile, size_bytes: int) -> None:
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB"
        )
    ext = Path(file.filename or "").suffix.lower().lstrip(".")
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '.{ext}'. Supported: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )


async def save_upload_file(file: UploadFile) -> tuple[str, str, int]:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "audio.wav").suffix.lower()
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / unique_filename

    content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return str(file_path), unique_filename, len(content)


def run_analysis(upload_id: int, file_path: str, instrument: str, db: Session) -> None:
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))
    from analyzer import analyze_audio

    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        return

    try:
        upload.status = UploadStatus.processing
        db.commit()

        result_data = analyze_audio(file_path, instrument)

        result = Result(
            upload_id=upload_id,
            score=result_data["score"]["total"],
            key=result_data["key"],
            scale=result_data["scale"],
            chords=result_data["chords"],
            notes=result_data["notes"],
            raw_midi=result_data["raw_midi"],
            chords_timeline=result_data["chords_timeline"],
            score_breakdown=result_data["score"],
            duration=result_data["duration"],
            note_count=result_data["note_count"],
        )
        db.add(result)
        upload.status = UploadStatus.complete
        db.commit()
        logger.info("Analysis complete for upload %d", upload_id)

    except Exception as e:
        logger.error("Analysis failed for upload %d: %s", upload_id, e)
        if upload:
            upload.status = UploadStatus.failed
            db.commit()


async def process_upload(file: UploadFile, instrument: str, db: Session) -> Upload:
    if instrument not in SUPPORTED_INSTRUMENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported instrument. Choose from: {', '.join(SUPPORTED_INSTRUMENTS)}"
        )

    content = await file.read()
    await file.seek(0)
    validate_file(file, len(content))

    file_path, unique_filename, size = await save_upload_file(file)

    upload = Upload(
        filename=unique_filename,
        original_filename=file.filename or "audio",
        instrument=instrument,
        file_path=file_path,
        file_size_bytes=size,
        status=UploadStatus.pending,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, run_analysis, upload.id, file_path, instrument, db)

    return upload
