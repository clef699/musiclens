# MusicLens

AI-powered music analysis for musicians. Upload an audio file, get back every note, all chords, the key and scale, a performance score, and instrument-specific notation — instantly.

## What it does

| Feature | Detail |
|---|---|
| Note detection | Every note with start/end timestamps and velocity |
| Chord recognition | Cmaj7, Dm, G7, sus4 and more |
| Key & scale | Major, minor, dorian, mixolydian, pentatonic, etc. |
| Performance score | 0–100 based on pitch accuracy, rhythmic regularity and note density |
| Sheet music | VexFlow-rendered sheet music, auto-transposed for Eb/Bb instruments |
| Guitar / bass tab | ASCII tab for lead guitar and bass guitar |
| Visual timeline | Canvas-rendered piano-roll view of all notes |

## Supported instruments

Piano · Keyboard · Lead Guitar · Bass Guitar · Alto Saxophone · Tenor Saxophone · Trumpet

---

## Quick start (Docker — recommended)

```bash
git clone https://github.com/clef699/musiclens.git
cd musiclens
docker compose up --build
```

That's it. The app will be running at:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

Two test accounts are seeded automatically with 3 pre-analysed results each:

| Email | Password |
|---|---|
| testuser1@test.com | Test1234! |
| testuser2@test.com | Test1234! |

---

## Local development (without Docker)

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repo

```bash
git clone https://github.com/clef699/musiclens.git
cd musiclens
```

### 2. Set up the database

```bash
createdb musiclens_db
createuser musiclens -P    # set password to: musiclens_pass
psql -c "GRANT ALL PRIVILEGES ON DATABASE musiclens_db TO musiclens;"
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set DATABASE_URL, SECRET_KEY, etc.
```

### 4. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 5. Run database migrations

```bash
cd backend
alembic upgrade head
```

### 6. Seed test data

```bash
python ../scripts/seed.py
```

### 7. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 8. Install frontend dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

### 9. Start the frontend

```bash
cd frontend
npm start
```

The app will be available at http://localhost:3000.

---

## Running tests

### Backend tests (51 tests)

```bash
cd backend
python -m pytest tests/ -v
```

### Frontend tests (18 tests)

```bash
cd frontend
npm test -- --watchAll=false
```

### Generate a sample audio file

```bash
python scripts/generate_sample_audio.py
# Creates: sample_audio/c_major_scale.wav
```

### Run analyzer standalone

```bash
cd backend
python analyzer.py ../sample_audio/c_major_scale.wav piano
```

---

## Project structure

```
musiclens/
├── backend/
│   ├── analyzer.py          # Core audio analysis module
│   ├── app/
│   │   ├── main.py          # FastAPI application + CORS
│   │   ├── api/
│   │   │   ├── auth.py      # POST /auth/register, POST /auth/login
│   │   │   └── uploads.py   # POST /upload, GET /results/{id}, GET /history
│   │   ├── core/
│   │   │   ├── config.py    # Settings (pydantic-settings)
│   │   │   ├── database.py  # SQLAlchemy engine + session
│   │   │   └── security.py  # JWT + bcrypt helpers
│   │   ├── models/          # SQLAlchemy ORM models
│   │   └── schemas/         # Pydantic request/response schemas
│   ├── migrations/          # Alembic migration scripts
│   ├── tests/
│   │   ├── test_analyzer.py # 27 unit tests
│   │   └── test_api.py      # 24 integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # LandingPage, AuthPage, Dashboard, Upload, Results, History
│   │   ├── components/      # Navbar, ScoreRing, NoteTimeline, ChordList, SheetMusic, GuitarTab
│   │   ├── store/           # Zustand auth store
│   │   └── utils/api.js     # Axios client + API helpers
│   └── package.json
├── scripts/
│   ├── seed.py              # Creates test accounts + sample results
│   └── generate_sample_audio.py
├── sample_audio/
│   └── c_major_scale.wav
├── docker-compose.yml
└── .env.example
```

---

## API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Login, returns JWT |
| POST | `/upload` | Yes | Upload audio file, start analysis |
| GET | `/uploads/{id}/status` | Yes | Poll analysis status |
| GET | `/results/{id}` | Yes | Full analysis result |
| GET | `/history` | Yes | All analyses for current user |

Full interactive docs at http://localhost:8000/docs when the backend is running.

---

## Environment variables

See `.env.example` for a full list. Key variables:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://musiclens:...` | PostgreSQL connection string |
| `SECRET_KEY` | — | JWT signing key (change in production!) |
| `UPLOAD_DIR` | `./uploads` | Where audio files are stored |
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload size |
| `USE_S3` | `false` | Set to `true` to use AWS S3 for file storage |

---

## Tech stack

- **Backend**: Python 3.11 · FastAPI · SQLAlchemy · Alembic · PostgreSQL
- **Audio analysis**: Spotify basic-pitch · music21 · librosa · soundfile
- **Frontend**: React 18 · Tailwind CSS · VexFlow · Zustand · Axios
- **Auth**: JWT (python-jose) · bcrypt (passlib)
- **Tests**: pytest · httpx · React Testing Library
- **Infrastructure**: Docker · docker-compose · nginx
