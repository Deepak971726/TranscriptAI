from pathlib import Path
from uuid import UUID
import asyncio

from docx import Document
from fastapi import HTTPException, status
from loguru import logger
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.enums import ExportFormat, ExportStatus
from app.models.export import TranscriptExport
from app.repositories.export_repository import ExportRepository
from app.repositories.transcript_repository import TranscriptRepository
from app.schemas.auth import CurrentUser
from app.schemas.export import ExportJobResponse, ExportRead
from app.services.storage_service import StorageService


class ExportService:
    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self.settings = settings
        self.storage = StorageService(settings)
        self.export_repository = ExportRepository(session)
        self.transcript_repository = TranscriptRepository(session)

    async def list_exports(self, user: CurrentUser) -> list[ExportRead]:
        exports = await self.export_repository.list_for_user(user.id)
        logger.info("[EXPORT] Listed - user={} count={}", user.id, len(exports))
        return [ExportRead.model_validate(item) for item in exports]

    async def enqueue_export(self, user: CurrentUser, transcript_id: UUID, format: ExportFormat) -> ExportJobResponse:
        transcript = await self.transcript_repository.get_for_user(transcript_id, user.id)
        if not transcript:
            logger.warning("[EXPORT] Transcript not found - user={} transcript_id={} format={}", user.id, transcript_id, format.value)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")

        export = await self.export_repository.create(
            TranscriptExport(
                transcript_id=transcript.id,
                user_id=user.id,
                format=format.value,
                status=ExportStatus.QUEUED.value,
            )
        )
        logger.info("[EXPORT] Record created - user={} export_id={} format={}", user.id, export.id, format.value)

        job_id = str(export.id)
        if self.settings.background_tasks_enabled:
            from app.workers.export_tasks import generate_export_task

            logger.info("[EXPORT] Submitting to queue - export_id={} format={}", export.id, export.format)
            async_result = generate_export_task.delay(str(export.id))
            job_id = async_result.id
            logger.info("[EXPORT] Queued - export_id={} job_id={}", export.id, job_id)
        else:
            logger.info("[EXPORT] Generating inline (background tasks disabled) - export_id={}", export.id)
            await self.generate_export_file(export.id)

        return ExportJobResponse(job_id=job_id, export_id=export.id, status=export.status, format=export.format)

    async def generate_export_file(self, export_id: UUID) -> TranscriptExport:
        export = await self.export_repository.get_by_id(export_id)
        if not export:
            logger.error("[EXPORT] Export not found - export_id={}", export_id)
            raise ValueError(f"Export not found: {export_id}")
        transcript = await self.transcript_repository.get_by_id(export.transcript_id)
        if not transcript:
            logger.error("[EXPORT] Transcript not found - export_id={} transcript_id={}", export_id, export.transcript_id)
            raise ValueError(f"Transcript not found: {export.transcript_id}")

        directory = self.storage.transcript_export_directory(transcript.id)
        path = directory / f"transcript.{export.format}"
        logger.info("[EXPORT] Generating file - export_id={} format={} path={}", export.id, export.format, path)
        await asyncio.to_thread(self._write_export_file, path, export.format, transcript.title, transcript.text)
        size_bytes = path.stat().st_size
        updated = await self.export_repository.update_status(
            export, status=ExportStatus.COMPLETED.value, storage_path=str(path), size_bytes=size_bytes
        )
        logger.info("[EXPORT] File ready - export_id={} format={} size={}B", export.id, export.format, size_bytes)
        return updated

    async def get_or_create_export_path(self, user: CurrentUser, transcript_id: UUID, format: ExportFormat) -> Path:
        transcript = await self.transcript_repository.get_for_user(transcript_id, user.id)
        if not transcript:
            logger.warning("[EXPORT] Transcript not found for download - user={} transcript_id={} format={}", user.id, transcript_id, format.value)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")

        directory = self.storage.transcript_export_directory(transcript.id)
        path = directory / f"transcript.{format.value}"
        if not path.exists():
            logger.info("[EXPORT] File missing, regenerating - transcript_id={} format={}", transcript_id, format.value)
            await asyncio.to_thread(self._write_export_file, path, format.value, transcript.title, transcript.text)
        logger.info("[EXPORT] Download ready - user={} transcript_id={} format={}", user.id, transcript_id, format.value)
        return path

    def _write_export_file(self, path: Path, format: str, title: str, text: str) -> None:
        if format == ExportFormat.TXT.value:
            path.write_text(text, encoding="utf-8")
            return
        if format == ExportFormat.PDF.value:
            self._write_pdf(path, title, text)
            return
        if format == ExportFormat.DOCX.value:
            self._write_docx(path, title, text)
            return
        raise ValueError(f"Unsupported export format: {format}")

    def _write_pdf(self, path: Path, title: str, text: str) -> None:
        document = canvas.Canvas(str(path), pagesize=letter)
        width, height = letter
        y = height - 72
        document.setFont("Helvetica-Bold", 14)
        document.drawString(72, y, title[:90])
        y -= 30
        document.setFont("Helvetica", 10)
        for paragraph in text.splitlines() or [text]:
            for line in self._wrap_text(paragraph, 92):
                if y < 72:
                    document.showPage()
                    document.setFont("Helvetica", 10)
                    y = height - 72
                document.drawString(72, y, line)
                y -= 14
        document.save()

    def _write_docx(self, path: Path, title: str, text: str) -> None:
        document = Document()
        document.add_heading(title, level=1)
        for paragraph in text.splitlines() or [text]:
            document.add_paragraph(paragraph)
        document.save(path)

    def _wrap_text(self, value: str, limit: int) -> list[str]:
        words = value.split()
        lines: list[str] = []
        current: list[str] = []
        for word in words:
            if sum(len(item) for item in current) + len(current) + len(word) > limit:
                lines.append(" ".join(current))
                current = [word]
            else:
                current.append(word)
        if current:
            lines.append(" ".join(current))
        return lines or [""]
