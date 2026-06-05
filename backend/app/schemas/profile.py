from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class ProfileRead(BaseModel):
    id: UUID
    email: EmailStr | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=180)
    avatar_url: str | None = Field(default=None, max_length=1024)
