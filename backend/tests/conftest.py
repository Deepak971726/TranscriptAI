from collections.abc import AsyncGenerator
import os
from pathlib import Path
from uuid import uuid4

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test_import.db")
os.environ.setdefault("JWT_SECRET", "test-secret")

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings, get_settings
from app.core.dependencies import get_current_user, get_db_session
from app.main import create_app
from app.models.base import Base
from app.schemas.auth import CurrentUser


@pytest.fixture
def test_user() -> CurrentUser:
    return CurrentUser(id=uuid4(), email="tester@example.com", role="authenticated")


@pytest.fixture
def test_settings(tmp_path: Path) -> Settings:
    return Settings(
        environment="test",
        debug=True,
        database_url=f"sqlite+aiosqlite:///{tmp_path / 'test.db'}",
        redis_url="redis://localhost:6379/15",
        jwt_secret="test-secret",
        allowed_origins="*",
        trusted_hosts="*",
        upload_directory=tmp_path / "uploads",
        export_directory=tmp_path / "exports",
        temp_directory=tmp_path / "tmp",
        background_tasks_enabled=False,
        celery_task_always_eager=True,
    )


@pytest.fixture
async def session_maker(test_settings: Settings) -> AsyncGenerator[async_sessionmaker[AsyncSession], None]:
    engine = create_async_engine(test_settings.database_url)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield maker
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def app(
    test_settings: Settings,
    test_user: CurrentUser,
    session_maker: async_sessionmaker[AsyncSession],
) -> FastAPI:
    application = create_app(test_settings)

    async def override_db_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    def override_current_user() -> CurrentUser:
        return test_user

    def override_settings() -> Settings:
        return test_settings

    application.dependency_overrides[get_db_session] = override_db_session
    application.dependency_overrides[get_current_user] = override_current_user
    application.dependency_overrides[get_settings] = override_settings
    return application


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client
