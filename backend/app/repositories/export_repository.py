from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.export import TranscriptExport


class ExportRepository:
    """Persistence operations for generated transcript exports."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, export: TranscriptExport) -> TranscriptExport:
        self.session.add(export)
        await self.session.flush()
        return export

    async def get_for_user(self, export_id: UUID, user_id: UUID) -> TranscriptExport | None:
        result = await self.session.execute(
            select(TranscriptExport).where(TranscriptExport.id == export_id, TranscriptExport.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, export_id: UUID) -> TranscriptExport | None:
        return await self.session.get(TranscriptExport, export_id)

    async def list_for_user(self, user_id: UUID) -> list[TranscriptExport]:
        result = await self.session.execute(
            select(TranscriptExport)
            .where(TranscriptExport.user_id == user_id)
            .order_by(TranscriptExport.created_at.desc())
        )
        return list(result.scalars().all())

    async def update_status(
        self,
        export: TranscriptExport,
        *,
        status: str,
        storage_path: str | None = None,
        size_bytes: int | None = None,
        error_message: str | None = None,
    ) -> TranscriptExport:
        export.status = status
        export.error_message = error_message
        if storage_path is not None:
            export.storage_path = storage_path
        if size_bytes is not None:
            export.size_bytes = size_bytes
        await self.session.flush()
        return export
