from httpx import AsyncClient

from app.core.config import Settings
from app.services.transcript_service import TranscriptService
from app.services.transcription_dispatcher import TranscriptionDispatchResult


async def test_audio_upload_creates_queued_job(client: AsyncClient) -> None:
    response = await client.post(
        "/api/uploads/audio",
        files={"file": ("sample.mp3", b"fake-audio", "audio/mpeg")},
    )

    assert response.status_code == 202
    payload = response.json()
    assert payload["status"] == "queued"
    assert payload["audio_file_id"]
    assert payload["transcript_id"]


async def test_audio_upload_survives_unavailable_queue(
    client: AsyncClient,
    test_settings: Settings,
    monkeypatch,
) -> None:
    scheduled_audio_ids: list[str] = []

    async def dispatch(audio_id, _settings, *, allow_local_fallback: bool) -> TranscriptionDispatchResult:
        assert allow_local_fallback is True
        scheduled_audio_ids.append(str(audio_id))
        return TranscriptionDispatchResult(job_id=str(audio_id), mode="local", reason="redis_unavailable")

    test_settings.background_tasks_enabled = True
    monkeypatch.setattr("app.services.upload_service.dispatch_transcription", dispatch)

    response = await client.post(
        "/api/uploads/audio",
        files={"file": ("sample.mp3", b"fake-audio", "audio/mpeg")},
    )

    assert response.status_code == 202
    payload = response.json()
    assert payload["status"] == "queued"
    assert payload["audio_file_id"]
    assert payload["transcript_id"]
    assert scheduled_audio_ids == [payload["audio_file_id"]]


async def test_existing_transcript_can_request_processing(
    client: AsyncClient,
    test_settings: Settings,
    monkeypatch,
) -> None:
    dispatched_audio_ids: list[str] = []

    async def dispatch_processing(_service: TranscriptService, audio_file_id, _settings) -> TranscriptionDispatchResult:
        dispatched_audio_ids.append(str(audio_file_id))
        return TranscriptionDispatchResult(job_id=str(audio_file_id), mode="local", reason="test")

    monkeypatch.setattr(TranscriptService, "_dispatch_processing", dispatch_processing)

    test_settings.background_tasks_enabled = False
    upload_response = await client.post(
        "/api/uploads/audio",
        files={"file": ("sample.mp3", b"fake-audio", "audio/mpeg")},
    )
    transcript_id = upload_response.json()["transcript_id"]
    audio_file_id = upload_response.json()["audio_file_id"]

    test_settings.background_tasks_enabled = True
    process_response = await client.post(f"/api/transcripts/{transcript_id}/process")

    assert process_response.status_code == 202
    assert process_response.json()["status"] == "queued"
    assert dispatched_audio_ids == [audio_file_id]
