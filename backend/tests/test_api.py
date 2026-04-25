"""Integration tests for all FastAPI endpoints."""
import pytest
import os
import sys
import io
import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.core.database import Base, get_db
from app.models.upload import Upload, UploadStatus
from app.models.result import Result

TEST_DB_URL = "sqlite:///./test_musiclens.db"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True, scope="module")
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_musiclens.db"):
        os.remove("./test_musiclens.db")


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def db():
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


def make_wav_bytes(duration: float = 1.0, sr: int = 22050) -> bytes:
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    wave = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
    buf = io.BytesIO()
    sf.write(buf, wave, sr, format="WAV")
    buf.seek(0)
    return buf.read()


def make_seeded_result(db) -> tuple[Upload, Result]:
    upload = Upload(
        filename="seed.wav", original_filename="seed.wav",
        instrument="piano", file_path="/tmp/seed.wav",
        file_size_bytes=1000, status=UploadStatus.complete,
    )
    db.add(upload)
    db.flush()
    result = Result(
        upload_id=upload.id, score=85.0, key="C", scale="major",
        chords=["C", "G", "Amin", "F"],
        notes=[{"pitch": 60, "note_name": "C4", "start_time": 0.0,
                "end_time": 0.5, "duration": 0.5, "velocity": 80}],
        raw_midi={"concert_pitch_notes": [], "total_notes": 1},
        chords_timeline=[],
        score_breakdown={"total": 85.0, "pitch_accuracy": 90.0,
                         "rhythm": 85.0, "note_density": 70.0},
        duration=5.0, note_count=8,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return upload, result


# ── /health ───────────────────────────────────────────────────────────────────

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_root(client):
    res = client.get("/")
    assert res.status_code == 200


# ── /upload ───────────────────────────────────────────────────────────────────

def test_upload_valid_wav(client):
    wav = make_wav_bytes()
    res = client.post("/upload",
                      files={"file": ("my_track.wav", wav, "audio/wav")},
                      data={"instrument": "piano"})
    assert res.status_code == 202
    data = res.json()
    assert data["original_filename"] == "my_track.wav"
    assert data["instrument"] == "piano"
    assert data["status"] in ("pending", "processing", "complete")


def test_upload_invalid_instrument(client):
    wav = make_wav_bytes()
    res = client.post("/upload",
                      files={"file": ("t.wav", wav, "audio/wav")},
                      data={"instrument": "kazoo"})
    assert res.status_code == 400


def test_upload_unsupported_file_type(client):
    res = client.post("/upload",
                      files={"file": ("test.pdf", b"fakepdf", "application/pdf")},
                      data={"instrument": "piano"})
    assert res.status_code == 415


def test_upload_oversized_file(client):
    big = b"0" * (51 * 1024 * 1024)
    res = client.post("/upload",
                      files={"file": ("big.wav", big, "audio/wav")},
                      data={"instrument": "piano"})
    assert res.status_code == 413


# ── /results/{id} ─────────────────────────────────────────────────────────────

def test_get_result_exists(client, db):
    _, result = make_seeded_result(db)
    res = client.get(f"/results/{result.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["score"] == 85.0
    assert data["key"] == "C"
    assert "C" in data["chords"]


def test_get_result_not_found(client):
    res = client.get("/results/999999")
    assert res.status_code == 404


# ── /uploads/{id}/status ─────────────────────────────────────────────────────

def test_upload_status(client, db):
    upload, _ = make_seeded_result(db)
    res = client.get(f"/uploads/{upload.id}/status")
    assert res.status_code == 200
    assert "status" in res.json()


def test_upload_status_not_found(client):
    res = client.get("/uploads/999999/status")
    assert res.status_code == 404
