from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile


class ProfileRepository:
    """Persistence operations for Supabase-backed user profiles."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, user_id: UUID) -> Profile | None:
        return await self.session.get(Profile, user_id)

    async def get_or_create(
        self,
        user_id: UUID,
        email: str | None = None,
        full_name: str | None = None,
    ) -> Profile:
        profile = await self.get_by_id(user_id)
        if profile:
            return profile

        profile = Profile(id=user_id, email=email, full_name=full_name)
        self.session.add(profile)
        await self.session.flush()
        return profile

    async def update(self, profile: Profile, *, full_name: str | None, avatar_url: str | None) -> Profile:
        if full_name is not None:
            profile.full_name = full_name
        if avatar_url is not None:
            profile.avatar_url = avatar_url
        await self.session.flush()
        return profile

    async def find_by_email(self, email: str) -> Profile | None:
        result = await self.session.execute(select(Profile).where(Profile.email == email))
        return result.scalar_one_or_none()
