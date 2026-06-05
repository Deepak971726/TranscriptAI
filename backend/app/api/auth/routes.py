from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import get_current_user, get_db_session
from app.schemas.auth import AuthenticatedUserResponse, CurrentUser, RegisterRequest, RegisterResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.get("/me", response_model=AuthenticatedUserResponse)
async def read_authenticated_user(user: CurrentUser = Depends(get_current_user)) -> AuthenticatedUserResponse:
    """Validate the Supabase JWT and return the authenticated user."""

    return AuthenticatedUserResponse(id=user.id, email=user.email, role=user.role)


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register_user(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> RegisterResponse:
    """Create a confirmed Supabase Auth user without sending confirmation email."""

    return await AuthService(session, settings).register(payload)
