from collections.abc import Awaitable, Callable
import sys
import time

from fastapi import Request, Response
from loguru import logger

from app.core.config import Settings


def configure_logging(settings: Settings) -> None:
    logger.remove()
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    logger.add(
        sink=sys.stdout,
        level=settings.log_level,
        colorize=settings.environment != "production",
        backtrace=settings.debug,
        diagnose=settings.debug,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level:<8}</level> | <level>{message}</level>",
    )
    if settings.environment != "local":
        logger.add(
            sink="logs/app.log",
            level=settings.log_level,
            rotation="10 MB",
            retention="7 days",
            backtrace=settings.debug,
            diagnose=settings.debug,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {message}",
        )


async def request_logging_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    level = "WARNING" if response.status_code >= 400 else "INFO"
    logger.log(level, "[HTTP] {} {} => {} ({}ms)", request.method, request.url.path, response.status_code, duration_ms)
    return response
