"""
Seed script: creates 2 test accounts and 3 pre-analysed results.
Run from the backend directory: python ../scripts/seed.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.database import SessionLocal, engine, Base
from app.models import User, Upload, Result, UploadStatus
from app.core.security import get_password_hash
from datetime import datetime, timezone

SAMPLE_ANALYSIS = [
    {
        "instrument": "piano",
        "filename": "c_major_piano.wav",
        "key": "C",
        "scale": "major",
        "score": 87.5,
        "chords": ["C", "Amin", "Fmaj", "G"],
        "notes": [
            {"pitch": 60, "note_name": "C4", "start_time": 0.0, "end_time": 0.4, "duration": 0.4, "velocity": 80},
            {"pitch": 62, "note_name": "D4", "start_time": 0.5, "end_time": 0.9, "duration": 0.4, "velocity": 78},
            {"pitch": 64, "note_name": "E4", "start_time": 1.0, "end_time": 1.4, "duration": 0.4, "velocity": 82},
            {"pitch": 65, "note_name": "F4", "start_time": 1.5, "end_time": 1.9, "duration": 0.4, "velocity": 75},
            {"pitch": 67, "note_name": "G4", "start_time": 2.0, "end_time": 2.4, "duration": 0.4, "velocity": 83},
            {"pitch": 69, "note_name": "A4", "start_time": 2.5, "end_time": 2.9, "duration": 0.4, "velocity": 79},
            {"pitch": 71, "note_name": "B4", "start_time": 3.0, "end_time": 3.4, "duration": 0.4, "velocity": 81},
            {"pitch": 72, "note_name": "C5", "start_time": 3.5, "end_time": 4.0, "duration": 0.5, "velocity": 85},
        ],
        "chords_timeline": [
            {"start_time": 0.0, "end_time": 1.0, "chord": "C"},
            {"start_time": 1.0, "end_time": 2.0, "chord": "Amin"},
            {"start_time": 2.0, "end_time": 3.0, "chord": "Fmaj"},
            {"start_time": 3.0, "end_time": 4.0, "chord": "G"},
        ],
        "score_breakdown": {"total": 87.5, "pitch_accuracy": 92.0, "rhythm": 88.0, "note_density": 75.0},
        "duration": 4.0,
        "note_count": 8,
    },
    {
        "instrument": "lead_guitar",
        "filename": "a_minor_guitar.wav",
        "key": "A",
        "scale": "natural minor",
        "score": 76.3,
        "chords": ["Amin", "G", "Fmaj", "E"],
        "notes": [
            {"pitch": 69, "note_name": "A4", "start_time": 0.0, "end_time": 0.3, "duration": 0.3, "velocity": 90},
            {"pitch": 71, "note_name": "B4", "start_time": 0.35, "end_time": 0.65, "duration": 0.3, "velocity": 85},
            {"pitch": 72, "note_name": "C5", "start_time": 0.7, "end_time": 1.0, "duration": 0.3, "velocity": 88},
            {"pitch": 74, "note_name": "D5", "start_time": 1.05, "end_time": 1.35, "duration": 0.3, "velocity": 87},
            {"pitch": 76, "note_name": "E5", "start_time": 1.4, "end_time": 1.7, "duration": 0.3, "velocity": 92},
            {"pitch": 77, "note_name": "F5", "start_time": 1.75, "end_time": 2.05, "duration": 0.3, "velocity": 84},
            {"pitch": 79, "note_name": "G5", "start_time": 2.1, "end_time": 2.4, "duration": 0.3, "velocity": 89},
            {"pitch": 81, "note_name": "A5", "start_time": 2.45, "end_time": 3.0, "duration": 0.55, "velocity": 93},
        ],
        "chords_timeline": [
            {"start_time": 0.0, "end_time": 0.75, "chord": "Amin"},
            {"start_time": 0.75, "end_time": 1.5, "chord": "G"},
            {"start_time": 1.5, "end_time": 2.25, "chord": "Fmaj"},
            {"start_time": 2.25, "end_time": 3.0, "chord": "E"},
        ],
        "score_breakdown": {"total": 76.3, "pitch_accuracy": 80.0, "rhythm": 74.0, "note_density": 68.0},
        "duration": 3.0,
        "note_count": 8,
    },
    {
        "instrument": "trumpet",
        "filename": "g_mixolydian_trumpet.wav",
        "key": "G",
        "scale": "mixolydian",
        "score": 91.2,
        "chords": ["G", "F", "C", "Gdom7"],
        "notes": [
            {"pitch": 67, "note_name": "G4", "start_time": 0.0, "end_time": 0.5, "duration": 0.5, "velocity": 95},
            {"pitch": 69, "note_name": "A4", "start_time": 0.6, "end_time": 1.1, "duration": 0.5, "velocity": 90},
            {"pitch": 71, "note_name": "B4", "start_time": 1.2, "end_time": 1.7, "duration": 0.5, "velocity": 92},
            {"pitch": 72, "note_name": "C5", "start_time": 1.8, "end_time": 2.3, "duration": 0.5, "velocity": 88},
            {"pitch": 74, "note_name": "D5", "start_time": 2.4, "end_time": 2.9, "duration": 0.5, "velocity": 93},
            {"pitch": 76, "note_name": "E5", "start_time": 3.0, "end_time": 3.5, "duration": 0.5, "velocity": 91},
            {"pitch": 77, "note_name": "F5", "start_time": 3.6, "end_time": 4.1, "duration": 0.5, "velocity": 89},
            {"pitch": 79, "note_name": "G5", "start_time": 4.2, "end_time": 5.0, "duration": 0.8, "velocity": 96},
        ],
        "chords_timeline": [
            {"start_time": 0.0, "end_time": 1.25, "chord": "G"},
            {"start_time": 1.25, "end_time": 2.5, "chord": "F"},
            {"start_time": 2.5, "end_time": 3.75, "chord": "C"},
            {"start_time": 3.75, "end_time": 5.0, "chord": "Gdom7"},
        ],
        "score_breakdown": {"total": 91.2, "pitch_accuracy": 95.0, "rhythm": 90.0, "note_density": 82.0},
        "duration": 5.0,
        "note_count": 8,
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create test users
        users = []
        for email in ["testuser1@test.com", "testuser2@test.com"]:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                print(f"User {email} already exists, skipping")
                users.append(existing)
            else:
                user = User(email=email, password_hash=get_password_hash("Test1234!"))
                db.add(user)
                db.flush()
                print(f"Created user: {email}")
                users.append(user)

        db.commit()

        # Create sample uploads + results for user 1
        user1 = users[0]
        existing_uploads = db.query(Upload).filter(Upload.user_id == user1.id).count()
        if existing_uploads == 0:
            os.makedirs("uploads/seed", exist_ok=True)
            for sample in SAMPLE_ANALYSIS:
                fp = f"uploads/seed/{sample['filename']}"
                open(fp, "w").close()  # placeholder file

                upload = Upload(
                    user_id=user1.id,
                    filename=sample["filename"],
                    original_filename=sample["filename"],
                    instrument=sample["instrument"],
                    file_path=fp,
                    file_size_bytes=12345,
                    status=UploadStatus.complete,
                )
                db.add(upload)
                db.flush()

                result = Result(
                    upload_id=upload.id,
                    score=sample["score"],
                    key=sample["key"],
                    scale=sample["scale"],
                    chords=sample["chords"],
                    notes=sample["notes"],
                    raw_midi={"concert_pitch_notes": sample["notes"], "total_notes": sample["note_count"]},
                    chords_timeline=sample["chords_timeline"],
                    score_breakdown=sample["score_breakdown"],
                    duration=sample["duration"],
                    note_count=sample["note_count"],
                )
                db.add(result)
                print(f"Created sample result: {sample['filename']}")

            db.commit()
            print("Seeding complete!")
        else:
            print(f"User1 already has {existing_uploads} uploads, skipping sample data")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
