from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.repositories.profile_repository import ProfileRepository
from app.schemas.auth import CurrentUser
from app.schemas.profile import ProfileUpdate


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.profile_repository = ProfileRepository(session)

    async def get_current_profile(self, user: CurrentUser):
        logger.info("[USER] Fetching profile - user_id={}", user.id)
        full_name = (user.claims.get("user_metadata") or {}).get("full_name")
        profile = await self.profile_repository.get_or_create(user.id, email=user.email, full_name=full_name)
        if full_name and not profile.full_name:
            logger.info("[USER] Syncing full_name from token claims - user_id={}", user.id)
            profile = await self.profile_repository.update(profile, full_name=full_name, avatar_url=profile.avatar_url)
        logger.info("[USER] Profile fetched - user_id={} has_name={} has_avatar={}", user.id, bool(profile.full_name), bool(profile.avatar_url))
        return profile

    async def update_profile(self, user: CurrentUser, payload: ProfileUpdate):
        logger.info("[USER] Updating profile - user_id={}", user.id)
        profile = await self.profile_repository.get_or_create(user.id, email=user.email)
        updated = await self.profile_repository.update(profile, full_name=payload.full_name, avatar_url=payload.avatar_url)
        logger.info("[USER] Profile updated - user_id={} has_name={} has_avatar={}", user.id, bool(updated.full_name), bool(updated.avatar_url))
        return updated
