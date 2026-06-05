from loguru import logger
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()


def _database_connect_args(database_url: str) -> dict[str, int]:
    try:
        url = make_url(database_url)
    except Exception:
        return {}

    if url.drivername.startswith("postgresql+asyncpg") and url.port == 6543:
        logger.info("[DATABASE] Transaction pooler detected (port 6543) - disabling asyncpg statement cache")
        return {"statement_cache_size": 0}

    return {}


engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    connect_args=_database_connect_args(settings.database_url),
)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def ping_database(database_url: str | None = None, debug: bool | None = None) -> None:
    active_database_url = database_url or settings.database_url
    logger.info("[DATABASE] Pinging host: {}", _safe_database_target(active_database_url))
    if database_url is None:
        async with engine.begin() as connection:
            await connection.execute(text("SELECT 1"))
    else:
        ping_engine = create_async_engine(
            database_url,
            echo=settings.debug if debug is None else debug,
            pool_pre_ping=True,
            connect_args=_database_connect_args(database_url),
        )
        try:
            async with ping_engine.begin() as connection:
                await connection.execute(text("SELECT 1"))
        finally:
            await ping_engine.dispose()
    logger.info("[DATABASE] Ping OK")


def _safe_database_target(database_url: str) -> str:
    try:
        url = make_url(database_url)
        host = url.host or "unknown-host"
        port = f":{url.port}" if url.port else ""
        database = f"/{url.database}" if url.database else ""
        return f"{host}{port}{database}"
    except Exception:
        return "unparseable-database-url"
