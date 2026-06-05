from uuid import UUID

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, TimestampMixin


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    email: Mapped[str | None] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(180))
    avatar_url: Mapped[str | None] = mapped_column(String(1024))

    audio_files = relationship("AudioFile", back_populates="profile", cascade="all, delete-orphan")
    transcripts = relationship("Transcript", back_populates="profile", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="profile", cascade="all, delete-orphan", uselist=False)
