from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from loguru import logger

from app.api.router import api_router
from app.api.websocket.routes import router as websocket_router
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging, request_logging_middleware
from app.db.database import ping_database


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings: Settings = app.state.settings
    configure_logging(settings)

    logger.info("=" * 60)
    logger.info("[STARTUP] {} is starting up", settings.app_name)
    logger.info("[STARTUP] Environment : {}", settings.environment)
    logger.info("[STARTUP] Debug mode  : {}", settings.debug)
    logger.info("[STARTUP] Log level   : {}", settings.log_level)
    logger.info("=" * 60)

    settings.ensure_storage_directories()
    logger.info("[STORAGE] Directories ready")
    logger.info("[STORAGE]   uploads -> {}", settings.upload_directory)
    logger.info("[STORAGE]   exports -> {}", settings.export_directory)
    logger.info("[STORAGE]   tmp     -> {}", settings.temp_directory)

    logger.info("[DATABASE] Connecting to database ...")
    try:
        await ping_database(settings.database_url, settings.debug)
        logger.info("[DATABASE] Connection successful")
    except Exception as exc:
        logger.error("[DATABASE] Connection failed: {}", exc)
        if settings.require_database_startup_check:
            raise
        logger.warning("[DATABASE] Continuing without database (environment={})", settings.environment)

    logger.info("[STARTUP] {} is ready to accept requests", settings.app_name)
    logger.info("=" * 60)

    yield

    logger.info("=" * 60)
    logger.info("[SHUTDOWN] {} is shutting down", settings.app_name)
    logger.info("=" * 60)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url="/redoc" if settings.environment != "production" else None,
    )
    app.state.settings = settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts_list)
    app.middleware("http")(request_logging_middleware)

    @app.middleware("http")
    async def security_headers(request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return response

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": settings.app_name}

    app.include_router(api_router, prefix=settings.api_prefix)
    app.include_router(websocket_router)
    return app


app = create_app()
