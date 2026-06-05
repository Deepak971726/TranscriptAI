from loguru import logger

from app.core.config import get_settings
from app.services.storage_service import StorageService
from app.workers.celery_worker import celery_app


@celery_app.task(name="cleanup_empty_storage_directories")
def cleanup_empty_storage_directories() -> dict[str, int]:
    settings = get_settings()
    storage = StorageService(settings)
    uploads_removed = storage.cleanup_empty_directories(settings.upload_directory)
    exports_removed = storage.cleanup_empty_directories(settings.export_directory)
    logger.info("[CLEANUP] Removed empty directories - uploads={} exports={}", uploads_removed, exports_removed)
    return {"uploads_removed": uploads_removed, "exports_removed": exports_removed}
