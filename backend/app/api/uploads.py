import logging
from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.upload import Upload
from app.models.result import Result
from app.schemas.upload import UploadOut, JobStatusOut
from app.services.upload_service import process_upload, run_analysis_bg

logger = logging.getLogger(__name__)
router = APIRouter(tags=["uploads"])


@router.post("/upload", response_model=UploadOut, status_code=202)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    instrument: str = Form(...),
    db: Session = Depends(get_db),
):
    upload = await process_upload(file, instrument, db)
    background_tasks.add_task(run_analysis_bg, upload.id, upload.file_path, instrument)
    return upload


@router.get("/results/{job_id}", response_model=JobStatusOut)
def get_job_result(job_id: int, db: Session = Depends(get_db)):
    """Returns status + full result when complete. Poll this until status == 'complete'."""
    upload = db.query(Upload).filter(Upload.id == job_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Job not found")

    result_data = None
    if upload.status.value == "complete" and upload.result:
        result_data = upload.result

    return JobStatusOut(
        job_id=job_id,
        status=upload.status.value,
        progress_message=upload.progress_message or "Processing…",
        result=result_data,
    )
