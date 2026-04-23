from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"), nullable=False, unique=True)
    score = Column(Float, nullable=True)
    key = Column(String, nullable=True)
    scale = Column(String, nullable=True)
    chords = Column(JSON, nullable=True)        # list of unique chord names
    notes = Column(JSON, nullable=True)         # list of note dicts with timestamps
    raw_midi = Column(JSON, nullable=True)      # raw MIDI data
    chords_timeline = Column(JSON, nullable=True)  # chords with timestamps
    score_breakdown = Column(JSON, nullable=True)  # pitch, rhythm, density scores
    duration = Column(Float, nullable=True)
    note_count = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    upload = relationship("Upload", back_populates="result")
