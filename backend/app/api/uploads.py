import asyncio
import logging
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.upload import Upload, UploadStatus
from app.models.result import Result
from app.schemas.upload import UploadOut, ResultOut, HistoryItem
from app.services.upload_service import process_upload, SUPPORTED_INSTRUMENTS

logger = logging.getLogger(__name__)
router = APIRouter(tags=["uploads"])


@router.post("/upload", response_model=UploadOut, status_code=202)
async def upload_audio(
    file: UploadFile = File(...),
    instrument: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload = await process_upload(file, instrument, current_user.id, db)
    return upload


@router.get("/results/{result_id}", response_model=ResultOut)
def get_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.query(Result).join(Upload).filter(
        Result.id == result_id,
        Upload.user_id == current_user.id
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result


@router.get("/uploads/{upload_id}/status")
def get_upload_status(
    upload_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload = db.query(Upload).filter(
        Upload.id == upload_id,
        Upload.user_id == current_user.id
    ).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    result_id = upload.result.id if upload.result else None
    return {"status": upload.status, "upload_id": upload_id, "result_id": result_id}


@router.get("/history", response_model=list[HistoryItem])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uploads = db.query(Upload).filter(Upload.user_id == current_user.id).order_by(Upload.uploaded_at.desc()).all()
    items = []
    for u in uploads:
        items.append(HistoryItem(
            upload_id=u.id,
            filename=u.filename,
            original_filename=u.original_filename,
            instrument=u.instrument,
            status=u.status,
            uploaded_at=u.uploaded_at,
            score=u.result.score if u.result else None,
            key=u.result.key if u.result else None,
            scale=u.result.scale if u.result else None,
            result_id=u.result.id if u.result else None,
        ))
    return items
