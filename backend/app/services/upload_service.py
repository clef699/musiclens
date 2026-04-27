import uuid
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

ANALYZER_PATH = str(Path(__file__).resolve().parent.parent.parent.parent)


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


def run_analysis_bg(upload_id: int, file_path: str, instrument: str) -> None:
    """Background task: owns its own DB session so the request session can close."""
    from app.core.database import get_engine
    from sqlalchemy.orm import sessionmaker

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    db = SessionLocal()
    try:
        _run_analysis(upload_id, file_path, instrument, db)
    finally:
        db.close()


def _run_analysis(upload_id: int, file_path: str, instrument: str, db: Session) -> None:
    import sys
    sys.path.insert(0, ANALYZER_PATH)
    from analyzer import (
        run_basic_pitch,
        detect_key_and_scale,
        detect_chords,
        calculate_performance_score,
        transpose_notes_for_instrument,
        midi_to_note_name,
    )

    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        return

    def set_progress(msg: str) -> None:
        upload.progress_message = msg
        db.commit()

    try:
        upload.status = UploadStatus.processing
        set_progress("Transcribing audio with AI…")

        # Step 1 — AI transcription (slowest step, especially for long files)
        midi_notes = run_basic_pitch(file_path)

        set_progress("Analysing notes…")
        duration = max((n["end_time"] for n in midi_notes), default=0.0)

        # Add note names to every note
        for note in midi_notes:
            note["note_name"] = midi_to_note_name(note["pitch"])

        set_progress("Detecting chords…")
        chords_timeline = detect_chords(midi_notes)
        unique_chords = list(dict.fromkeys(c["chord"] for c in chords_timeline))

        set_progress("Detecting key and scale…")
        key, scale = detect_key_and_scale(midi_notes)

        set_progress("Calculating performance score…")
        score_data = calculate_performance_score(midi_notes, duration)

        set_progress("Generating notation…")
        display_notes = transpose_notes_for_instrument(midi_notes, instrument)
        # Make sure display notes also carry note names
        for note in display_notes:
            note["note_name"] = midi_to_note_name(note["pitch"])

        set_progress("Saving results…")

        result = Result(
            upload_id=upload_id,
            score=score_data["total"],
            key=key,
            scale=scale,
            chords=unique_chords,
            notes=display_notes,
            raw_midi={"concert_pitch_notes": midi_notes, "total_notes": len(midi_notes)},
            chords_timeline=chords_timeline,
            score_breakdown=score_data,
            duration=round(duration, 3),
            note_count=len(midi_notes),
        )
        db.add(result)
        upload.status = UploadStatus.complete
        upload.progress_message = "Complete"
        db.commit()
        logger.info("Analysis complete for upload %d (%d notes, %.1fs)", upload_id, len(midi_notes), duration)

    except Exception as e:
        logger.error("Analysis failed for upload %d: %s", upload_id, e, exc_info=True)
        try:
            upload.status = UploadStatus.failed
            upload.progress_message = "Analysis failed — please try a different file."
            db.commit()
        except Exception:
            pass


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
        progress_message="Queued",
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload
