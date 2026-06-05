from uuid import UUID

from sqlalchemy import Select, delete, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment
from app.schemas.transcript import TranscriptQuery


class TranscriptRepository:
    """Persistence operations for transcripts and transcript segments."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, transcript: Transcript) -> Transcript:
        self.session.add(transcript)
        await self.session.flush()
        return transcript

    async def add_segments(self, segments: list[TranscriptSegment]) -> None:
        self.session.add_all(segments)
        await self.session.flush()

    async def get_for_user(self, transcript_id: UUID, user_id: UUID) -> Transcript | None:
        result = await self.session.execute(
            select(Transcript)
            .options(selectinload(Transcript.segments))
            .where(Transcript.id == transcript_id, Transcript.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, transcript_id: UUID) -> Transcript | None:
        result = await self.session.execute(
            select(Transcript).options(selectinload(Transcript.segments)).where(Transcript.id == transcript_id)
        )
        return result.scalar_one_or_none()

    def _apply_filters(self, stmt: Select[tuple[Transcript]], user_id: UUID, query: TranscriptQuery) -> Select[tuple[Transcript]]:
        stmt = stmt.where(Transcript.user_id == user_id)
        if query.language:
            stmt = stmt.where(Transcript.language == query.language)
        if query.status:
            stmt = stmt.where(Transcript.status == query.status)
        if query.search:
            search = f"%{query.search}%"
            stmt = stmt.where(or_(Transcript.title.ilike(search), Transcript.text.ilike(search)))
        return stmt

    async def list_for_user(
        self,
        user_id: UUID,
        query: TranscriptQuery,
        *,
        offset: int,
        limit: int,
    ) -> tuple[list[Transcript], int]:
        stmt = self._apply_filters(select(Transcript), user_id, query)
        total_stmt = select(func.count()).select_from(stmt.subquery())
        total = int(await self.session.scalar(total_stmt) or 0)

        sort_column = getattr(Transcript, query.sort_by)
        order_by = sort_column.asc() if query.sort_order == "asc" else sort_column.desc()
        result = await self.session.execute(stmt.order_by(order_by).offset(offset).limit(limit))
        return list(result.scalars().all()), total

    async def update(
        self,
        transcript: Transcript,
        *,
        title: str | None = None,
        text: str | None = None,
        language: str | None = None,
    ) -> Transcript:
        if title is not None:
            transcript.title = title
        if text is not None:
            transcript.text = text
            transcript.word_count = len(text.split())
        if language is not None:
            transcript.language = language
        await self.session.flush()
        return transcript

    async def replace_segments(self, transcript_id: UUID, segments: list[TranscriptSegment]) -> None:
        await self.session.execute(delete(TranscriptSegment).where(TranscriptSegment.transcript_id == transcript_id))
        self.session.add_all(segments)
        await self.session.flush()

    async def delete(self, transcript: Transcript) -> None:
        await self.session.delete(transcript)
        await self.session.flush()

    async def count_for_user(self, user_id: UUID) -> int:
        return int(await self.session.scalar(select(func.count()).select_from(Transcript).where(Transcript.user_id == user_id)) or 0)

    async def audio_count_for_user(self, user_id: UUID) -> int:
        from app.models.audio_file import AudioFile

        return int(await self.session.scalar(select(func.count()).select_from(AudioFile).where(AudioFile.user_id == user_id)) or 0)

    async def total_duration_seconds_for_user(self, user_id: UUID) -> int:
        return int(await self.session.scalar(select(func.coalesce(func.sum(Transcript.duration_seconds), 0)).where(Transcript.user_id == user_id)) or 0)

    async def languages_used_for_user(self, user_id: UUID) -> int:
        return int(
            await self.session.scalar(
                select(func.count(distinct(Transcript.language))).where(
                    Transcript.user_id == user_id,
                    Transcript.language.is_not(None),
                )
            )
            or 0
        )
