from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, SecretStr


class CurrentUser(BaseModel):
    id: UUID
    email: EmailStr | None = None
    role: str = "authenticated"
    claims: dict[str, Any] = {}


class AuthenticatedUserResponse(BaseModel):
    id: UUID
    email: EmailStr | None
    role: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: SecretStr = Field(min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str = "authenticated"
