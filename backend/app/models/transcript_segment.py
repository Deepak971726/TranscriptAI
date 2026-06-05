from uuid import UUID, uuid4

from sqlalchemy import Float, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, TimestampMixin


class TranscriptSegment(Base, TimestampMixin):
    __tablename__ = "transcript_segments"
    __table_args__ = (Index("ix_transcript_segments_transcript_start", "transcript_id", "start_time"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    transcript_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False)
    speaker_label: Mapped[str] = mapped_column(String(80), default="Speaker 1", nullable=False)
    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float)
    words: Mapped[list[dict[str, object]] | None] = mapped_column(JSON)

    transcript = relationship("Transcript", back_populates="segments")
