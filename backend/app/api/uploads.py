import logging
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.upload import Upload, UploadStatus
from app.models.result import Result
from app.schemas.upload import UploadOut, ResultOut
from app.services.upload_service import process_upload

logger = logging.getLogger(__name__)
router = APIRouter(tags=["uploads"])


@router.post("/upload", response_model=UploadOut, status_code=202)
async def upload_audio(
    file: UploadFile = File(...),
    instrument: str = Form(...),
    db: Session = Depends(get_db),
):
    return await process_upload(file, instrument, db)


@router.get("/results/{result_id}", response_model=ResultOut)
def get_result(result_id: int, db: Session = Depends(get_db)):
    result = db.query(Result).filter(Result.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result


@router.get("/uploads/{upload_id}/status")
def get_upload_status(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    result_id = upload.result.id if upload.result else None
    return {"status": upload.status, "upload_id": upload_id, "result_id": result_id}
