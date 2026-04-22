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
from app.core.security import get_password_hash
from app.models.user import User
from app.models.upload import Upload, UploadStatus
from app.models.result import Result

# ── in-memory SQLite test DB ──────────────────────────────────────────────────

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


@pytest.fixture(scope="module")
def test_user():
    session = TestSessionLocal()
    try:
        user = session.query(User).filter(User.email == "api_test@test.com").first()
        if not user:
            user = User(email="api_test@test.com", password_hash=get_password_hash("Test1234!"))
            session.add(user)
            session.commit()
            session.refresh(user)
        return user
    finally:
        session.close()


@pytest.fixture(scope="module")
def auth_token(client, test_user):
    res = client.post("/auth/login", json={"email": "api_test@test.com", "password": "Test1234!"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


def make_wav_bytes(duration: float = 1.0, sr: int = 22050) -> bytes:
    """Create a tiny WAV in memory."""
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    wave = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
    buf = io.BytesIO()
    sf.write(buf, wave, sr, format="WAV")
    buf.seek(0)
    return buf.read()


def make_seeded_result(db, user_id: int) -> tuple[Upload, Result]:
    upload = Upload(
        user_id=user_id, filename="seed.wav", original_filename="seed.wav",
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
        chords_timeline=[], score_breakdown={"total": 85.0, "pitch_accuracy": 90.0,
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


# ── /auth/register ────────────────────────────────────────────────────────────

def test_register_new_user(client):
    res = client.post("/auth/register", json={
        "email": "newuser_unique@test.com", "password": "Test1234!"
    })
    assert res.status_code == 201
    assert res.json()["email"] == "newuser_unique@test.com"


def test_register_duplicate_email(client):
    payload = {"email": "dup_register@test.com", "password": "Test1234!"}
    client.post("/auth/register", json=payload)
    res = client.post("/auth/register", json=payload)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"]


def test_register_weak_password(client):
    res = client.post("/auth/register", json={"email": "weak@test.com", "password": "short"})
    assert res.status_code == 422


def test_register_invalid_email(client):
    res = client.post("/auth/register", json={"email": "not-an-email", "password": "Test1234!"})
    assert res.status_code == 422


# ── /auth/login ───────────────────────────────────────────────────────────────

def test_login_valid(client, test_user):
    res = client.post("/auth/login", json={"email": "api_test@test.com", "password": "Test1234!"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == "api_test@test.com"


def test_login_wrong_password(client, test_user):
    res = client.post("/auth/login", json={"email": "api_test@test.com", "password": "WrongPass!"})
    assert res.status_code == 401


def test_login_unknown_email(client):
    res = client.post("/auth/login", json={"email": "nobody@test.com", "password": "Test1234!"})
    assert res.status_code == 401


# ── /upload ───────────────────────────────────────────────────────────────────

def test_upload_requires_auth(client):
    wav = make_wav_bytes()
    res = client.post("/upload", files={"file": ("test.wav", wav, "audio/wav")},
                      data={"instrument": "piano"})
    assert res.status_code == 403


def test_upload_valid_wav(client, auth_headers):
    wav = make_wav_bytes()
    res = client.post("/upload",
                      files={"file": ("my_track.wav", wav, "audio/wav")},
                      data={"instrument": "piano"},
                      headers=auth_headers)
    assert res.status_code == 202
    data = res.json()
    assert data["original_filename"] == "my_track.wav"
    assert data["instrument"] == "piano"
    assert data["status"] in ("pending", "processing", "complete")


def test_upload_invalid_instrument(client, auth_headers):
    wav = make_wav_bytes()
    res = client.post("/upload",
                      files={"file": ("t.wav", wav, "audio/wav")},
                      data={"instrument": "kazoo"},
                      headers=auth_headers)
    assert res.status_code == 400


def test_upload_unsupported_file_type(client, auth_headers):
    res = client.post("/upload",
                      files={"file": ("test.pdf", b"fakepdf", "application/pdf")},
                      data={"instrument": "piano"},
                      headers=auth_headers)
    assert res.status_code == 415


def test_upload_oversized_file(client, auth_headers):
    big = b"0" * (51 * 1024 * 1024)  # 51 MB
    res = client.post("/upload",
                      files={"file": ("big.wav", big, "audio/wav")},
                      data={"instrument": "piano"},
                      headers=auth_headers)
    assert res.status_code == 413


# ── /results/{id} ─────────────────────────────────────────────────────────────

def test_get_result_exists(client, auth_headers, db, test_user):
    _, result = make_seeded_result(db, test_user.id)
    res = client.get(f"/results/{result.id}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["score"] == 85.0
    assert data["key"] == "C"
    assert "C" in data["chords"]


def test_get_result_not_found(client, auth_headers):
    res = client.get("/results/999999", headers=auth_headers)
    assert res.status_code == 404


def test_get_result_requires_auth(client, db, test_user):
    _, result = make_seeded_result(db, test_user.id)
    res = client.get(f"/results/{result.id}")
    assert res.status_code == 403


# ── /history ──────────────────────────────────────────────────────────────────

def test_get_history(client, auth_headers, db, test_user):
    make_seeded_result(db, test_user.id)
    res = client.get("/history", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) >= 1


def test_get_history_requires_auth(client):
    res = client.get("/history")
    assert res.status_code == 403


def test_history_isolation(client, db):
    # Create a second user and confirm they don't see first user's uploads
    user2 = User(email="isolated_user@test.com", password_hash=get_password_hash("Test1234!"))
    db.add(user2)
    db.commit()
    db.refresh(user2)

    res = client.post("/auth/login", json={"email": "isolated_user@test.com", "password": "Test1234!"})
    token2 = res.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    res = client.get("/history", headers=headers2)
    assert res.status_code == 200
    assert res.json() == []


# ── /uploads/{id}/status ─────────────────────────────────────────────────────

def test_upload_status(client, auth_headers, db, test_user):
    upload, _ = make_seeded_result(db, test_user.id)
    res = client.get(f"/uploads/{upload.id}/status", headers=auth_headers)
    assert res.status_code == 200
    assert "status" in res.json()


def test_upload_status_not_found(client, auth_headers):
    res = client.get("/uploads/999999/status", headers=auth_headers)
    assert res.status_code == 404


# ── JWT security ──────────────────────────────────────────────────────────────

def test_invalid_token_rejected(client):
    res = client.get("/history", headers={"Authorization": "Bearer totallyinvalidtoken"})
    assert res.status_code == 401


def test_expired_token_rejected(client):
    from app.core.security import create_access_token
    from datetime import timedelta
    token = create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))
    res = client.get("/history", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
