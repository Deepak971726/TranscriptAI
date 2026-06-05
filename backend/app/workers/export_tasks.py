from uuid import UUID
import asyncio

from loguru import logger

from app.core.config import get_settings
from app.db.database import async_session_maker
from app.models.enums import ExportStatus
from app.repositories.export_repository import ExportRepository
from app.services.export_service import ExportService
from app.workers.celery_worker import celery_app


@celery_app.task(bind=True, name="generate_export")
def generate_export_task(self, export_id: str) -> dict[str, str]:
    logger.info("[CELERY] Export task received - export_id={} task_id={}", export_id, self.request.id)
    return asyncio.run(_generate_export(UUID(export_id)))


async def _generate_export(export_id: UUID) -> dict[str, str]:
    settings = get_settings()
    async with async_session_maker() as session:
        repository = ExportRepository(session)
        try:
            export = await ExportService(session, settings).generate_export_file(export_id)
            await session.commit()
            logger.info("[EXPORT] Completed - export_id={}", export.id)
            return {"export_id": str(export.id), "status": export.status}
        except Exception as exc:
            logger.exception("[EXPORT] Failed - export_id={} error={}", export_id, exc)
            export = await repository.get_by_id(export_id)
            if export:
                await repository.update_status(export, status=ExportStatus.FAILED.value, error_message=str(exc))
                await session.commit()
            raise
