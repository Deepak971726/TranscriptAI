from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_settings import UserSettings


class SettingsRepository:
    """Persistence operations for per-user application settings."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_or_create(self, user_id: UUID) -> UserSettings:
        settings = await self.session.get(UserSettings, user_id)
        if settings:
            return settings

        settings = UserSettings(user_id=user_id)
        self.session.add(settings)
        await self.session.flush()
        return settings

    async def update(
        self,
        settings: UserSettings,
        *,
        theme: str | None = None,
        language: str | None = None,
        notifications_enabled: bool | None = None,
    ) -> UserSettings:
        if theme is not None:
            settings.theme = theme
        if language is not None:
            settings.language = language
        if notifications_enabled is not None:
            settings.notifications_enabled = notifications_enabled
        await self.session.flush()
        return settings
