from uuid import UUID

from fastapi import HTTPException, status
from fastapi.concurrency import run_in_threadpool
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.db.supabase import get_supabase_admin_client
from app.repositories.profile_repository import ProfileRepository
from app.schemas.auth import RegisterRequest, RegisterResponse


class AuthService:
    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.profile_repository = ProfileRepository(session)

    async def register(self, payload: RegisterRequest) -> RegisterResponse:
        admin_client = get_supabase_admin_client(self.settings)
        if admin_client is None:
            logger.error("[AUTH] Cannot register - Supabase admin client is not configured")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Registration is temporarily unavailable",
            )

        email = str(payload.email).lower()
        email_domain = email.rsplit("@", 1)[-1]
        logger.info("[AUTH] Register - starting registration for domain={}", email_domain)

        try:
            response = await run_in_threadpool(
                admin_client.auth.admin.create_user,
                {
                    "email": email,
                    "password": payload.password.get_secret_value(),
                    "email_confirm": True,
                    "user_metadata": {"full_name": payload.name},
                },
            )
            user = response.user
        except Exception as exc:
            user = await self._recover_unconfirmed_user(admin_client, payload, email)
            if user is None:
                logger.warning("[AUTH] Register - failed for domain={} reason={}", email_domain, exc)
                if "already" in str(exc).lower() or "registered" in str(exc).lower():
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="An account already exists for this email",
                    ) from exc
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not create account",
                ) from exc

        if user is None:
            logger.error("[AUTH] Register - Supabase returned no user for domain={}", email_domain)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not create account",
            )

        user_id = UUID(user.id)
        await self.profile_repository.get_or_create(user_id, email=email, full_name=payload.name)
        logger.info("[AUTH] Register - complete for user_id={} domain={}", user_id, email_domain)
        return RegisterResponse(id=user_id, email=email, role=getattr(user, "role", None) or "authenticated")

    async def _recover_unconfirmed_user(self, admin_client, payload: RegisterRequest, email: str):
        existing_user = await self._find_user_by_email(admin_client, email)
        if existing_user is None:
            return None

        if getattr(existing_user, "email_confirmed_at", None):
            logger.info("[AUTH] Register - found existing confirmed user_id={}", existing_user.id)
            return None

        logger.info("[AUTH] Register - recovering unconfirmed user_id={}", existing_user.id)
        response = await run_in_threadpool(
            admin_client.auth.admin.update_user_by_id,
            existing_user.id,
            {
                "password": payload.password.get_secret_value(),
                "email_confirm": True,
                "user_metadata": {"full_name": payload.name},
            },
        )
        return response.user

    async def _find_user_by_email(self, admin_client, email: str):
        for page in range(1, 11):
            users = await run_in_threadpool(admin_client.auth.admin.list_users, page, 100)
            for user in users:
                if (user.email or "").lower() == email:
                    return user
            if len(users) < 100:
                return None
        return None
