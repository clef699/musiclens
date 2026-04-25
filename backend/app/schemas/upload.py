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


class NoteItem(BaseModel):
    pitch: int
    note_name: str
    start_time: float
    end_time: float
    duration: float
    velocity: int


class ChordItem(BaseModel):
    start_time: float
    end_time: float
    chord: str


class ScoreBreakdown(BaseModel):
    total: float
    pitch_accuracy: float
    rhythm: float
    note_density: float


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


