from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class UploadOut(BaseModel):
    id: int
    filename: str
    original_filename: str
    instrument: str
    status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ResultOut(BaseModel):
    id: int
    upload_id: int
    score: Optional[float]
    key: Optional[str]
    scale: Optional[str]
    chords: Optional[list[str]]
    notes: Optional[list[Any]]
    chords_timeline: Optional[list[Any]]
    score_breakdown: Optional[Any]
    duration: Optional[float]
    note_count: Optional[int]
    created_at: datetime
    upload: Optional[UploadOut]

    class Config:
        from_attributes = True


class JobStatusOut(BaseModel):
    job_id: int
    status: str
    progress_message: Optional[str]
    result: Optional[ResultOut]

    class Config:
        from_attributes = True
