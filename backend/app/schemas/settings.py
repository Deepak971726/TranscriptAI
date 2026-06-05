from pydantic import BaseModel, Field


class UserSettingsRead(BaseModel):
    theme: str
    language: str
    notifications_enabled: bool

    model_config = {"from_attributes": True}


class UserSettingsUpdate(BaseModel):
    theme: str | None = Field(default=None, pattern="^(light|dark|system)$")
    language: str | None = Field(default=None, max_length=64)
    notifications_enabled: bool | None = None
