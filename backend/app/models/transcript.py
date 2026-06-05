from uuid import UUID, uuid4

from sqlalchemy import Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, TimestampMixin


class Transcript(Base, TimestampMixin):
    __tablename__ = "transcripts"
    __table_args__ = (
        Index("ix_transcripts_user_status", "user_id", "status"),
        Index("ix_transcripts_user_language", "user_id", "language"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    audio_file_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("audio_files.id", ondelete="CASCADE"), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    language: Mapped[str | None] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="queued")
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    confidence: Mapped[float | None] = mapped_column(Float)
    word_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    model_name: Mapped[str | None] = mapped_column(String(64))
    error_message: Mapped[str | None] = mapped_column(String(1024))

    profile = relationship("Profile", back_populates="transcripts")
    audio_file = relationship("AudioFile", back_populates="transcript")
    segments = relationship("TranscriptSegment", back_populates="transcript", cascade="all, delete-orphan", order_by="TranscriptSegment.start_time")
    exports = relationship("TranscriptExport", back_populates="transcript", cascade="all, delete-orphan")
