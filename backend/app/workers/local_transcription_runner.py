from __future__ import annotations

import asyncio
import sys
from uuid import UUID

from loguru import logger

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.database import engine
from app.workers.transcription_tasks import _transcribe_audio


async def _run(audio_file_id: UUID) -> None:
    settings = get_settings()
    configure_logging(settings)
    settings.ensure_storage_directories()

    logger.info("=" * 60)
    logger.info("[RUNNER] Local transcription process started - audio_id={}", audio_file_id)
    logger.info("[RUNNER] Model={} device={} compute_type={}", settings.whisper_model, settings.whisper_device, settings.whisper_compute_type)
    logger.info("=" * 60)

    try:
        await _transcribe_audio(audio_file_id)
        logger.info("[RUNNER] Transcription finished successfully - audio_id={}", audio_file_id)
    except FileNotFoundError as exc:
        logger.error("[RUNNER] Audio file not found on disk - audio_id={} error={}", audio_file_id, exc)
        raise
    except ValueError as exc:
        logger.error("[RUNNER] Invalid data - audio_id={} error={}", audio_file_id, exc)
        raise
    except BaseException as exc:
        logger.exception("[RUNNER] Transcription failed - audio_id={} error_type={} error={}", audio_file_id, exc.__class__.__name__, exc)
        raise
    finally:
        await engine.dispose()
        logger.info("[RUNNER] DB connections closed - audio_id={}", audio_file_id)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python -m app.workers.local_transcription_runner <audio_file_id>")

    audio_file_id = UUID(sys.argv[1])
    asyncio.run(_run(audio_file_id))


if __name__ == "__main__":
    main()
