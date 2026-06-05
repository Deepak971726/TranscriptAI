from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audio_file import AudioFile


class AudioFileRepository:
    """Persistence operations for uploaded audio files."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, audio_file: AudioFile) -> AudioFile:
        self.session.add(audio_file)
        await self.session.flush()
        return audio_file

    async def get_for_user(self, audio_file_id: UUID, user_id: UUID) -> AudioFile | None:
        result = await self.session.execute(
            select(AudioFile).where(AudioFile.id == audio_file_id, AudioFile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, audio_file_id: UUID) -> AudioFile | None:
        result = await self.session.execute(
            select(AudioFile).options(selectinload(AudioFile.transcript)).where(AudioFile.id == audio_file_id)
        )
        return result.scalar_one_or_none()

    async def find_duplicate(self, user_id: UUID, checksum: str) -> AudioFile | None:
        result = await self.session.execute(
            select(AudioFile).where(AudioFile.user_id == user_id, AudioFile.checksum == checksum)
        )
        return result.scalar_one_or_none()

    async def update_status(
        self,
        audio_file: AudioFile,
        *,
        status: str,
        error_message: str | None = None,
        language: str | None = None,
    ) -> AudioFile:
        audio_file.status = status
        audio_file.error_message = error_message
        if language is not None:
            audio_file.language = language
        await self.session.flush()
        return audio_file
