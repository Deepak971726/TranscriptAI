from uuid import UUID
import asyncio
from pathlib import Path

from loguru import logger

from app.core.config import get_settings
from app.db.database import async_session_maker
from app.models.enums import AudioStatus, TranscriptStatus
from app.repositories.audio_file_repository import AudioFileRepository
from app.services.speaker_diarization_service import SpeakerDiarizationService
from app.services.transcript_service import TranscriptService
from app.services.whisper_service import WhisperService
from app.workers.celery_worker import celery_app


@celery_app.task(bind=True, name="transcribe_audio")
def transcribe_audio_task(self, audio_file_id: str) -> dict[str, str]:
    logger.info("[CELERY] Task received - audio_id={} task_id={}", audio_file_id, self.request.id)
    return asyncio.run(_transcribe_audio(UUID(audio_file_id)))


async def transcribe_audio_locally(audio_file_id: str) -> None:
    try:
        logger.info("[TRANSCRIBE] Local in-process transcription started - audio_id={}", audio_file_id)
        await _transcribe_audio(UUID(audio_file_id))
        logger.info("[TRANSCRIBE] Local in-process transcription finished - audio_id={}", audio_file_id)
    except Exception as exc:
        logger.exception("[TRANSCRIBE] Local in-process transcription failed - audio_id={} error={}", audio_file_id, exc)
        raise


async def _transcribe_audio(audio_file_id: UUID) -> dict[str, str]:
    settings = get_settings()
    async with async_session_maker() as session:
        audio_repository = AudioFileRepository(session)
        audio_file = await audio_repository.get_by_id(audio_file_id)
        if not audio_file or not audio_file.transcript:
            raise ValueError(f"Audio file not found: {audio_file_id}")

        logger.info("[TRANSCRIBE] Processing - audio_id={} file='{}'", audio_file.id, audio_file.original_filename)
        await audio_repository.update_status(audio_file, status=AudioStatus.PROCESSING.value)
        audio_file.transcript.status = TranscriptStatus.PROCESSING.value
        audio_file.transcript.error_message = None
        await session.commit()

        try:
            result = await WhisperService(settings).transcribe_file(
                path=Path(audio_file.storage_path),
                language=audio_file.language,
            )
            try:
                speaker_labels = await SpeakerDiarizationService(settings).diarize_file(
                    Path(audio_file.storage_path),
                    result.segments,
                )
            except Exception as diarization_exc:
                logger.exception(
                    "[DIARIZATION] Failed - audio_id={} error={}",
                    audio_file.id,
                    diarization_exc,
                )
                speaker_labels = ["Speaker"] * len(result.segments)

            await TranscriptService(session).save_transcription_result(
                audio_file.id,
                result,
                settings.whisper_model,
                speaker_labels,
            )
            await session.commit()
            logger.info("[TRANSCRIBE] Completed - audio_id={}", audio_file.id)
            return {"audio_file_id": str(audio_file.id), "status": "completed"}
        except Exception as exc:
            reason = str(exc) or exc.__class__.__name__
            logger.exception("[TRANSCRIBE] Failed - audio_id={} error={}", audio_file.id, reason)
            try:
                await TranscriptService(session).mark_transcription_failed(audio_file.id, reason)
                await session.commit()
            except Exception as save_exc:
                logger.exception("[TRANSCRIBE] Could not persist failure state - audio_id={} error={}", audio_file.id, save_exc)
            raise
