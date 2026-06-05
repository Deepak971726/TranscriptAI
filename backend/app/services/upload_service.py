from fastapi import BackgroundTasks, HTTPException, UploadFile, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.audio_file import AudioFile
from app.models.enums import AudioStatus, TranscriptStatus
from app.models.transcript import Transcript
from app.repositories.audio_file_repository import AudioFileRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.transcript_repository import TranscriptRepository
from app.schemas.auth import CurrentUser
from app.schemas.upload import AudioUploadResponse
from app.services.storage_service import StorageService
from app.services.transcription_dispatcher import TranscriptionDispatchError, dispatch_transcription


class UploadService:
    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.storage = StorageService(settings)
        self.profile_repository = ProfileRepository(session)
        self.audio_repository = AudioFileRepository(session)
        self.transcript_repository = TranscriptRepository(session)

    async def upload_audio(
        self,
        user: CurrentUser,
        upload: UploadFile,
        background_tasks: BackgroundTasks | None = None,
    ) -> AudioUploadResponse:
        logger.info("[UPLOAD] Started - user={} file='{}'", user.id, upload.filename)
        await self.profile_repository.get_or_create(user.id, email=user.email)
        stored = await self.storage.save_audio_upload(user.id, upload)

        duplicate = await self.audio_repository.find_duplicate(user.id, stored.validation.checksum)
        if duplicate:
            self.storage.delete_file(stored.path)
            logger.warning("[UPLOAD] Rejected - duplicate file detected for user={}", user.id)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate audio file detected",
            )

        audio = AudioFile(
            user_id=user.id,
            original_filename=stored.validation.filename,
            stored_filename=stored.stored_filename,
            storage_path=str(stored.path),
            mime_type=stored.validation.mime_type,
            size_bytes=stored.validation.size_bytes,
            duration_seconds=stored.validation.duration_seconds,
            checksum=stored.validation.checksum,
            status=AudioStatus.QUEUED.value,
        )
        await self.audio_repository.create(audio)
        logger.info("[UPLOAD] Audio record created - audio_id={} size={}B", audio.id, audio.size_bytes)

        transcript = Transcript(
            user_id=user.id,
            audio_file_id=audio.id,
            title=stored.validation.filename,
            status=TranscriptStatus.QUEUED.value,
            duration_seconds=stored.validation.duration_seconds,
        )
        await self.transcript_repository.create(transcript)
        logger.info("[UPLOAD] Transcript record created - transcript_id={} audio_id={}", transcript.id, audio.id)

        job_id = str(audio.id)
        await self.session.commit()

        if self.settings.background_tasks_enabled:
            try:
                dispatch_result = await dispatch_transcription(
                    audio.id,
                    self.settings,
                    allow_local_fallback=not self.settings.fail_upload_when_queue_unavailable,
                )
                job_id = dispatch_result.job_id
                logger.info(
                    "[UPLOAD] Transcription dispatched - audio_id={} mode={} job_id={} reason={} log_path={}",
                    audio.id,
                    dispatch_result.mode,
                    dispatch_result.job_id,
                    dispatch_result.reason,
                    dispatch_result.log_path,
                )
            except TranscriptionDispatchError as exc:
                logger.exception("[UPLOAD] Transcription dispatch failed - audio_id={} error={}", audio.id, exc)
                await self.audio_repository.update_status(audio, status=AudioStatus.FAILED.value, error_message=str(exc))
                transcript.status = TranscriptStatus.FAILED.value
                transcript.error_message = str(exc)
                await self.session.commit()
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Transcription queue is unavailable and local fallback could not start",
                ) from exc
        else:
            logger.info("[UPLOAD] Background tasks disabled - skipping queue for audio_id={}", audio.id)

        logger.info("[UPLOAD] Complete - user={} audio_id={} job_id={}", user.id, audio.id, job_id)
        return AudioUploadResponse(
            job_id=job_id,
            status=TranscriptStatus.QUEUED.value,
            audio_file_id=audio.id,
            transcript_id=transcript.id,
        )
