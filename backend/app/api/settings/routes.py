from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db_session
from app.schemas.auth import CurrentUser
from app.schemas.settings import UserSettingsRead, UserSettingsUpdate
from app.services.settings_service import SettingsService

router = APIRouter()


@router.get("", response_model=UserSettingsRead)
async def read_settings(
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> UserSettingsRead:
    return UserSettingsRead.model_validate(await SettingsService(session).get_settings(user))


@router.put("", response_model=UserSettingsRead)
async def update_settings(
    payload: UserSettingsUpdate,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> UserSettingsRead:
    return UserSettingsRead.model_validate(await SettingsService(session).update_settings(user, payload))
