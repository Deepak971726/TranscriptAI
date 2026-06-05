# TranscribeAI Backend

Production-oriented FastAPI backend for the TranscribeAI speech-to-text SaaS platform.

## Stack

- FastAPI with async dependencies and modular routers
- Supabase Auth JWT verification
- Supabase PostgreSQL through SQLAlchemy 2.0 async sessions
- Alembic migrations
- Local audio/export storage
- Redis + Celery for transcription and export jobs
- Faster-Whisper for speech-to-text
- WebSocket endpoint for live transcription
- Loguru request, job, upload, auth, and WebSocket logging

## Local Setup

1. Create an environment file:

```bash
cp .env.example .env
```

2. Fill in Supabase values, especially `DATABASE_URL` and `JWT_SECRET`.

3. Install dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
```

4. Run migrations:

```bash
alembic upgrade head
```

5. Start services:

```bash
uvicorn app.main:app --reload
celery -A app.workers.celery_worker.celery_app worker --loglevel=INFO
```

## Docker

```bash
docker compose up --build
```

The compose stack runs FastAPI, Redis, and a Celery worker. PostgreSQL is expected to be Supabase-hosted.

## Key Endpoints

- `POST /api/uploads/audio`
- `GET /api/dashboard/stats`
- `GET /api/transcripts`
- `GET /api/transcripts/{id}`
- `PUT /api/transcripts/{id}`
- `DELETE /api/transcripts/{id}`
- `GET /api/transcripts/search`
- `GET /api/export/txt/{id}`
- `GET /api/export/pdf/{id}`
- `GET /api/export/docx/{id}`
- `GET /api/settings`
- `PUT /api/settings`
- `WS /ws/transcribe`

All protected HTTP routes expect `Authorization: Bearer <supabase_jwt>`.
