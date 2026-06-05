from uuid import UUID

from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from loguru import logger
from passlib.context import CryptContext
from pydantic import ValidationError

from app.core.config import Settings
from app.db.supabase import get_supabase_admin_client
from app.schemas.auth import CurrentUser

bearer_scheme = HTTPBearer(auto_error=False)
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_secret(value: str) -> str:
    return password_context.hash(value)


def verify_secret(value: str, hashed_value: str) -> bool:
    return password_context.verify(value, hashed_value)


def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials | None,
    settings: Settings,
) -> CurrentUser:
    if credentials is None:
        logger.warning("[AUTH] Request rejected - missing bearer token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        claims = jwt.decode(
            credentials.credentials,
            settings.jwt_secret.get_secret_value(),
            algorithms=settings.jwt_algorithms,
            audience=settings.jwt_audience,
        )
        subject = claims.get("sub")
        if not subject:
            raise JWTError("Missing subject")
        user_id = UUID(subject)
    except (JWTError, ValueError) as exc:
        logger.warning("[AUTH] Token validation failed - {}", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    try:
        current_user = CurrentUser(
            id=user_id,
            email=claims.get("email"),
            role=claims.get("role", "authenticated"),
            claims=claims,
        )
    except ValidationError as exc:
        logger.warning("[AUTH] Token claims invalid - user_id={} error={}", user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    logger.info("[AUTH] Token verified - user_id={} role={}", current_user.id, current_user.role)
    return current_user


def verify_supabase_session(
    credentials: HTTPAuthorizationCredentials | None,
    settings: Settings,
) -> CurrentUser:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return verify_supabase_token(credentials, settings)

    if credentials is None:
        logger.warning("[AUTH] Request rejected - missing bearer token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin_client = get_supabase_admin_client(settings)
    if admin_client is None:
        return verify_supabase_token(credentials, settings)

    try:
        response = admin_client.auth.get_user(credentials.credentials)
        user = response.user if response else None
        if user is None:
            raise JWTError("Supabase Auth returned no user")

        current_user = CurrentUser(
            id=UUID(user.id),
            email=user.email,
            role=getattr(user, "role", None) or "authenticated",
            claims={
                "app_metadata": getattr(user, "app_metadata", {}) or {},
                "user_metadata": getattr(user, "user_metadata", {}) or {},
            },
        )
    except (JWTError, ValueError, ValidationError, Exception) as exc:
        logger.warning("[AUTH] Session validation failed - {}", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    logger.info("[AUTH] Session verified - user_id={} role={}", current_user.id, current_user.role)
    return current_user
