from pathlib import Path
from uuid import UUID

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.enums import AudioStatus, TranscriptStatus
from app.models.transcript_segment import TranscriptSegment
from app.repositories.audio_file_repository import AudioFileRepository
from app.repositories.transcript_repository import TranscriptRepository
from app.schemas.auth import CurrentUser
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.transcript import TranscriptListItem, TranscriptQuery, TranscriptRead, TranscriptUpdate
from app.services.speaker_diarization_service import SpeakerDiarizationService
from app.services.transcription_dispatcher import (
    TranscriptionDispatchError,
    TranscriptionDispatchResult,
    dispatch_transcription,
)
from app.services.whisper_service import WhisperResult


class TranscriptService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.transcript_repository = TranscriptRepository(session)
        self.audio_repository = AudioFileRepository(session)

    async def list_transcripts(
        self,
        user: CurrentUser,
        query: TranscriptQuery,
        pagination: PaginationParams,
    ) -> PaginatedResponse[TranscriptListItem]:
        items, total = await self.transcript_repository.list_for_user(
            user.id, query, offset=pagination.offset, limit=pagination.size
        )
        logger.info("[TRANSCRIPT] Listed - user={} total={} page={} size={}", user.id, total, pagination.page, pagination.size)
        return PaginatedResponse(
            items=[TranscriptListItem.model_validate(item) for item in items],
            total=total,
            page=pagination.page,
            size=pagination.size,
        )

    async def get_transcript(self, user: CurrentUser, transcript_id: UUID) -> TranscriptRead:
        transcript = await self.transcript_repository.get_for_user(transcript_id, user.id)
        if not transcript:
            logger.warning("[TRANSCRIPT] Not found - user={} transcript_id={}", user.id, transcript_id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")
        logger.info("[TRANSCRIPT] Fetched - user={} transcript_id={} status={}", user.id, transcript_id, transcript.status)
        return TranscriptRead.model_validate(transcript)

    async def update_transcript(
        self,
        user: CurrentUser,
        transcript_id: UUID,
        payload: TranscriptUpdate,
    ) -> TranscriptRead:
        transcript = await self.transcript_repository.get_for_user(transcript_id, user.id)
        if not transcript:
            logger.warning("[TRANSCRIPT] Not found for update - user={} transcript_id={}", user.id, transcript_id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")
        updated = await self.transcript_repository.update(
            transcript, title=payload.title, text=payload.text, language=payload.language
        )
        logger.info("[TRANSCRIPT] Updated - user={} transcript_id={} word_count={}", user.id, transcript_id, updated.word_count)
        return TranscriptRead.model_validate(updated)

    async def delete_transcript(self, user: CurrentUser, transcript_id: UUID) -> None:
        transcript = await self.transcript_repository.get_for_user(transcript_id, user.id)
        if not transcript:
            logger.warning("[TRANSCRIPT] Not found for delete - user={} transcript_id={}", user.id, transcript_id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")
        await self.transcript_repository.delete(transcript)
        logger.info("[TRANSCRIPT] Deleted - user={} transcript_id={}", user.id, transcript_id)

    async def process_transcript(
        self,
        user: CurrentUser,
        transcript_id: UUID,
        settings: Settings,
        background_tasks: BackgroundTasks | None = None,
    ) -> TranscriptRead:
        del background_tasks
        transcript = await self.transcript_repository.get_for_user(transcript_id, user.id)
        if not transcript:
            logger.warning("[TRANSCRIPT] Not found for processing - user={} transcript_id={}", user.id, transcript_id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")

        audio_file = await self.audio_repository.get_by_id(transcript.audio_file_id)
        if not audio_file:
            logger.warning("[TRANSCRIPT] Audio file missing - user={} transcript_id={}", user.id, transcript_id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found")

        transcript.status = TranscriptStatus.QUEUED.value
        transcript.error_message = None
        await self.audio_repository.update_status(audio_file, status=AudioStatus.QUEUED.value, error_message=None)
        await self.session.commit()

        try:
            dispatch_result = await self._dispatch_processing(audio_file.id, settings)
        except TranscriptionDispatchError as exc:
            await self.mark_transcription_failed(audio_file.id, str(exc))
            await self.session.commit()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Transcription queue is unavailable and local fallback could not start",
            ) from exc

        logger.info(
            "[TRANSCRIPT] Processing dispatched - user={} transcript_id={} audio_id={} mode={} job_id={} reason={}",
            user.id,
            transcript.id,
            audio_file.id,
            dispatch_result.mode,
            dispatch_result.job_id,
            dispatch_result.reason,
        )
        return TranscriptRead.model_validate(transcript)

    async def _dispatch_processing(self, audio_file_id: UUID, settings: Settings) -> TranscriptionDispatchResult:
        return await dispatch_transcription(
            audio_file_id,
            settings,
            allow_local_fallback=not settings.fail_upload_when_queue_unavailable,
        )

    async def diarize_transcript(
        self,
        user: CurrentUser,
        transcript_id: UUID,
        settings: Settings,
    ) -> TranscriptRead:
        transcript = await self.transcript_repository.get_for_user(transcript_id, user.id)
        if not transcript:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")

        audio_file = await self.audio_repository.get_by_id(transcript.audio_file_id)
        if not audio_file:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found")
        if not transcript.segments:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Transcript has no segments to identify")

        labels = await SpeakerDiarizationService(settings).diarize_file(
            Path(audio_file.storage_path),
            list(transcript.segments),
        )
        for segment, label in zip(transcript.segments, labels, strict=True):
            segment.speaker_label = label
        await self.session.flush()

        logger.info(
            "[TRANSCRIPT] Speaker labels updated - user={} transcript_id={} speakers={}",
            user.id,
            transcript.id,
            sorted(set(labels)),
        )
        return TranscriptRead.model_validate(transcript)

    async def save_transcription_result(
        self,
        audio_file_id: UUID,
        result: WhisperResult,
        model_name: str,
        speaker_labels: list[str] | None = None,
    ) -> None:
        audio_file = await self.audio_repository.get_by_id(audio_file_id)
        if not audio_file or not audio_file.transcript:
            logger.error("[TRANSCRIPT] Cannot save - audio or transcript missing for audio_id={}", audio_file_id)
            raise ValueError(f"Audio file or transcript not found: {audio_file_id}")

        transcript = audio_file.transcript
        transcript.text = result.text
        transcript.language = result.language
        transcript.status = TranscriptStatus.COMPLETED.value
        transcript.duration_seconds = result.duration_seconds or transcript.duration_seconds
        transcript.confidence = result.confidence
        transcript.word_count = len(result.text.split())
        transcript.model_name = model_name
        transcript.error_message = None

        labels = speaker_labels if speaker_labels and len(speaker_labels) == len(result.segments) else ["Speaker"] * len(result.segments)
        segments = [
            TranscriptSegment(
                transcript_id=transcript.id,
                speaker_label=labels[index],
                start_time=segment.start,
                end_time=segment.end,
                text=segment.text,
                confidence=segment.confidence,
                words=segment.words,
            )
            for index, segment in enumerate(result.segments)
        ]
        await self.transcript_repository.replace_segments(transcript.id, segments)
        await self.audio_repository.update_status(audio_file, status=AudioStatus.COMPLETED.value, language=result.language)
        logger.info(
            "[TRANSCRIPT] Saved - audio_id={} transcript_id={} language={} segments={} speakers={} confidence={}",
            audio_file_id,
            transcript.id,
            result.language,
            len(segments),
            sorted(set(labels)),
            result.confidence,
        )

    async def mark_transcription_failed(self, audio_file_id: UUID, error_message: str) -> None:
        audio_file = await self.audio_repository.get_by_id(audio_file_id)
        if not audio_file:
            logger.warning("[TRANSCRIPT] Cannot mark failed - audio not found audio_id={}", audio_file_id)
            return
        await self.audio_repository.update_status(audio_file, status=AudioStatus.FAILED.value, error_message=error_message)
        if audio_file.transcript:
            audio_file.transcript.status = TranscriptStatus.FAILED.value
            audio_file.transcript.error_message = error_message
        logger.warning("[TRANSCRIPT] Marked as failed - audio_id={} reason={}", audio_file_id, error_message)
