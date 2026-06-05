from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "transcribeai",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.workers.transcription_tasks",
        "app.workers.export_tasks",
        "app.workers.cleanup_tasks",
    ],
)

celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    broker_connection_retry_on_startup=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_always_eager=settings.celery_task_always_eager,
)
