from __future__ import annotations

from dataclasses import dataclass
import asyncio
import os
from pathlib import Path
import subprocess
import sys
from typing import Literal
from uuid import UUID

from loguru import logger
from redis.asyncio import Redis

from app.core.config import Settings


DispatchMode = Literal["celery", "local", "disabled"]


@dataclass(frozen=True)
class TranscriptionDispatchResult:
    """Result returned after dispatching a transcription job."""

    job_id: str
    mode: DispatchMode
    reason: str | None = None
    log_path: Path | None = None


class TranscriptionDispatchError(RuntimeError):
    """Raised when no transcription backend can accept the job."""


async def dispatch_transcription(
    audio_file_id: UUID,
    settings: Settings,
    *,
    allow_local_fallback: bool = True,
) -> TranscriptionDispatchResult:
    """Dispatch transcription to Celery when healthy, otherwise to a local process."""

    if not settings.background_tasks_enabled:
        logger.info("[DISPATCH] Background tasks disabled - skipping dispatch for audio_id={}", audio_file_id)
        return TranscriptionDispatchResult(job_id=str(audio_file_id), mode="disabled", reason="background_tasks_disabled")

    logger.info("[DISPATCH] Starting dispatch - audio_id={}", audio_file_id)
    queue_reason = await _queue_unavailable_reason(audio_file_id, settings)
    if queue_reason is None:
        try:
            from app.workers.transcription_tasks import transcribe_audio_task

            async_result = transcribe_audio_task.delay(str(audio_file_id))
            logger.info("[DISPATCH] Queued with Celery - audio_id={} job_id={}", audio_file_id, async_result.id)
            return TranscriptionDispatchResult(job_id=str(async_result.id), mode="celery")
        except Exception as exc:
            queue_reason = f"celery_dispatch_failed:{exc}"
            logger.exception("[DISPATCH] Celery dispatch failed - audio_id={} error={}", audio_file_id, exc)

    logger.warning("[DISPATCH] Queue unavailable (reason={}) - trying local fallback for audio_id={}", queue_reason, audio_file_id)

    if not allow_local_fallback:
        logger.error("[DISPATCH] Local fallback disabled - cannot process audio_id={}", audio_file_id)
        raise TranscriptionDispatchError(queue_reason)

    return start_local_transcription_process(audio_file_id, settings, reason=queue_reason)


async def _queue_unavailable_reason(audio_file_id: UUID, settings: Settings) -> str | None:
    if settings.celery_task_always_eager:
        logger.info("Celery eager mode enabled - audio_id={}", audio_file_id)
        return None

    if not await _redis_available(audio_file_id, settings):
        return "redis_unavailable"

    if settings.celery_worker_check_enabled and not await _celery_worker_available(audio_file_id, settings):
        return "celery_worker_unavailable"

    return None


async def _redis_available(audio_file_id: UUID, settings: Settings) -> bool:
    redis_client = Redis.from_url(
        settings.redis_url,
        socket_connect_timeout=settings.redis_connect_timeout_seconds,
        socket_timeout=settings.redis_connect_timeout_seconds,
        retry_on_timeout=False,
    )
    try:
        logger.info("[DISPATCH] Checking Redis - audio_id={} url={}", audio_file_id, settings.redis_url)
        await redis_client.ping()
        logger.info("[DISPATCH] Redis OK - audio_id={}", audio_file_id)
        return True
    except Exception as exc:
        logger.warning("[DISPATCH] Redis unreachable - audio_id={} error={}", audio_file_id, exc)
        return False
    finally:
        await redis_client.aclose()


async def _celery_worker_available(audio_file_id: UUID, settings: Settings) -> bool:
    try:
        active_workers = await asyncio.to_thread(_inspect_celery_workers, settings.celery_worker_check_timeout_seconds)
    except Exception as exc:
        logger.warning("[DISPATCH] Celery worker check failed - audio_id={} error={}", audio_file_id, exc)
        return False

    if not active_workers:
        logger.warning("[DISPATCH] No Celery workers responded - audio_id={}", audio_file_id)
        return False

    logger.info("[DISPATCH] Celery workers online - audio_id={} workers={}", audio_file_id, sorted(active_workers))
    return True


def _inspect_celery_workers(timeout_seconds: float) -> set[str]:
    from app.workers.celery_worker import celery_app

    response = celery_app.control.inspect(timeout=timeout_seconds).ping() or {}
    return set(response.keys())


def start_local_transcription_process(
    audio_file_id: UUID,
    settings: Settings,
    *,
    reason: str,
) -> TranscriptionDispatchResult:
    if not settings.local_transcription_process_enabled:
        raise TranscriptionDispatchError(f"local_transcription_disabled:{reason}")

    backend_dir = Path(__file__).resolve().parents[2]
    log_dir = settings.temp_directory / "transcription-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / f"{audio_file_id}.log"

    env = os.environ.copy()
    existing_pythonpath = env.get("PYTHONPATH")
    env["PYTHONPATH"] = str(backend_dir) if not existing_pythonpath else f"{backend_dir}{os.pathsep}{existing_pythonpath}"
    env["PYTHONUNBUFFERED"] = "1"
    env.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

    command = [
        sys.executable,
        "-m",
        "app.workers.local_transcription_runner",
        str(audio_file_id),
    ]
    creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0) if os.name == "nt" else 0

    logger.info("[DISPATCH] Launching local transcription process - audio_id={} reason={}", audio_file_id, reason)
    logger.info("[DISPATCH] Command: {}", " ".join(command))
    logger.info("[DISPATCH] Log file: {}", log_path)

    try:
        with log_path.open("ab") as log_file:
            process = subprocess.Popen(
                command,
                cwd=backend_dir,
                env=env,
                stdin=subprocess.DEVNULL,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                close_fds=os.name != "nt",
                creationflags=creationflags,
            )
    except Exception as exc:
        logger.exception("[DISPATCH] Failed to start local process - audio_id={} error={}", audio_file_id, exc)
        raise TranscriptionDispatchError(f"local_process_start_failed:{exc}") from exc

    logger.info("[DISPATCH] Local process started - audio_id={} pid={} log={}", audio_file_id, process.pid, log_path)
    logger.info("[DISPATCH] To watch live logs run: tail -f \"{}\"", log_path)
    return TranscriptionDispatchResult(job_id=str(audio_file_id), mode="local", reason=reason, log_path=log_path)
