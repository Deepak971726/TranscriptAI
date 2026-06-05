from uuid import uuid4

from app.core.config import Settings
from app.services.transcription_dispatcher import TranscriptionDispatchResult, dispatch_transcription


async def test_dispatch_falls_back_to_local_when_redis_is_unavailable(
    test_settings: Settings,
    monkeypatch,
) -> None:
    audio_file_id = uuid4()

    async def redis_unavailable(_audio_file_id, _settings) -> bool:
        return False

    def start_local(audio_id, _settings, *, reason: str) -> TranscriptionDispatchResult:
        return TranscriptionDispatchResult(job_id=str(audio_id), mode="local", reason=reason)

    test_settings.background_tasks_enabled = True
    test_settings.celery_task_always_eager = False
    monkeypatch.setattr("app.services.transcription_dispatcher._redis_available", redis_unavailable)
    monkeypatch.setattr("app.services.transcription_dispatcher.start_local_transcription_process", start_local)

    result = await dispatch_transcription(audio_file_id, test_settings)

    assert result.mode == "local"
    assert result.job_id == str(audio_file_id)
    assert result.reason == "redis_unavailable"


async def test_dispatch_falls_back_to_local_when_celery_worker_is_unavailable(
    test_settings: Settings,
    monkeypatch,
) -> None:
    audio_file_id = uuid4()

    async def redis_available(_audio_file_id, _settings) -> bool:
        return True

    async def celery_worker_unavailable(_audio_file_id, _settings) -> bool:
        return False

    def start_local(audio_id, _settings, *, reason: str) -> TranscriptionDispatchResult:
        return TranscriptionDispatchResult(job_id=str(audio_id), mode="local", reason=reason)

    test_settings.background_tasks_enabled = True
    test_settings.celery_task_always_eager = False
    test_settings.celery_worker_check_enabled = True
    monkeypatch.setattr("app.services.transcription_dispatcher._redis_available", redis_available)
    monkeypatch.setattr("app.services.transcription_dispatcher._celery_worker_available", celery_worker_unavailable)
    monkeypatch.setattr("app.services.transcription_dispatcher.start_local_transcription_process", start_local)

    result = await dispatch_transcription(audio_file_id, test_settings)

    assert result.mode == "local"
    assert result.job_id == str(audio_file_id)
    assert result.reason == "celery_worker_unavailable"
