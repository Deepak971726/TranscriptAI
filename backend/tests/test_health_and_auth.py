from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from httpx import AsyncClient
from jose import jwt

from app.core.config import Settings
from app.core.security import verify_supabase_token


async def test_health(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


async def test_authenticated_user(client: AsyncClient) -> None:
    response = await client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "tester@example.com"


async def test_register_creates_confirmed_user_without_email_flow(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    created_attributes: dict[str, object] = {}
    created_user_id = uuid4()

    class FakeAdmin:
        def create_user(self, attributes: dict[str, object]):
            created_attributes.update(attributes)
            return SimpleNamespace(
                user=SimpleNamespace(
                    id=str(created_user_id),
                    email=attributes["email"],
                    role="authenticated",
                    email_confirmed_at="2026-06-04T00:00:00Z",
                )
            )

    fake_client = SimpleNamespace(auth=SimpleNamespace(admin=FakeAdmin()))
    monkeypatch.setattr("app.services.auth_service.get_supabase_admin_client", lambda _settings: fake_client)

    response = await client.post(
        "/api/auth/register",
        json={
            "name": "Deepak Yadav",
            "email": "deepak.transcribeai.test@gmail.com",
            "password": "TranscribeAI-Test-2026!",
        },
    )

    assert response.status_code == 201
    assert response.json()["id"] == str(created_user_id)
    assert created_attributes["email_confirm"] is True
    assert created_attributes["user_metadata"] == {"full_name": "Deepak Yadav"}


def test_invalid_token_claims_return_unauthorized(test_settings: Settings) -> None:
    token = jwt.encode(
        {
            "sub": str(uuid4()),
            "email": "invalid@example.local",
            "role": "authenticated",
            "aud": test_settings.jwt_audience,
            "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
        },
        test_settings.jwt_secret.get_secret_value(),
        algorithm=test_settings.jwt_algorithms[0],
    )

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_token(credentials, test_settings)

    assert exc_info.value.status_code == 401
