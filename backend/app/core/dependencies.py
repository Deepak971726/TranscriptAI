from collections.abc import AsyncGenerator

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import bearer_scheme, verify_supabase_session
from app.db.database import async_session_maker
from app.schemas.auth import CurrentUser


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide one SQLAlchemy AsyncSession per request."""

    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    return verify_supabase_session(credentials, settings)
