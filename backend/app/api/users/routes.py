from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db_session
from app.schemas.auth import CurrentUser
from app.schemas.profile import ProfileRead, ProfileUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=ProfileRead)
async def read_profile(
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ProfileRead:
    service = UserService(session)
    return ProfileRead.model_validate(await service.get_current_profile(user))


@router.put("/me", response_model=ProfileRead)
async def update_profile(
    payload: ProfileUpdate,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ProfileRead:
    service = UserService(session)
    return ProfileRead.model_validate(await service.update_profile(user, payload))
