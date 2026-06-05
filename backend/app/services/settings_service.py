from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.repositories.profile_repository import ProfileRepository
from app.repositories.settings_repository import SettingsRepository
from app.schemas.auth import CurrentUser
from app.schemas.settings import UserSettingsUpdate


class SettingsService:
    def __init__(self, session: AsyncSession) -> None:
        self.profile_repository = ProfileRepository(session)
        self.settings_repository = SettingsRepository(session)

    async def get_settings(self, user: CurrentUser):
        logger.info("[SETTINGS] Fetching settings - user_id={}", user.id)
        await self.profile_repository.get_or_create(user.id, email=user.email)
        settings = await self.settings_repository.get_or_create(user.id)
        logger.info("[SETTINGS] Settings fetched - user_id={} theme={} language={} notifications={}", user.id, settings.theme, settings.language, settings.notifications_enabled)
        return settings

    async def update_settings(self, user: CurrentUser, payload: UserSettingsUpdate):
        logger.info("[SETTINGS] Updating settings - user_id={}", user.id)
        await self.profile_repository.get_or_create(user.id, email=user.email)
        settings = await self.settings_repository.get_or_create(user.id)
        updated = await self.settings_repository.update(
            settings,
            theme=payload.theme,
            language=payload.language,
            notifications_enabled=payload.notifications_enabled,
        )
        logger.info("[SETTINGS] Settings updated - user_id={} theme={} language={} notifications={}", user.id, updated.theme, updated.language, updated.notifications_enabled)
        return updated
