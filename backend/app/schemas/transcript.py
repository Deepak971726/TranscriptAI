from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class TranscriptSegmentRead(BaseModel):
    id: UUID
    speaker_label: str
    start_time: float
    end_time: float
    text: str
    confidence: float | None = None
    words: list[dict[str, object]] | None = None

    model_config = {"from_attributes": True}


class TranscriptRead(BaseModel):
    id: UUID
    audio_file_id: UUID
    title: str
    text: str
    language: str | None
    status: str
    duration_seconds: int | None
    confidence: float | None
    word_count: int
    model_name: str | None
    created_at: datetime
    updated_at: datetime
    segments: list[TranscriptSegmentRead] = []

    model_config = {"from_attributes": True}


class TranscriptListItem(BaseModel):
    id: UUID
    audio_file_id: UUID
    title: str
    language: str | None
    status: str
    duration_seconds: int | None
    confidence: float | None
    word_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TranscriptUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    text: str | None = None
    language: str | None = Field(default=None, max_length=32)


class TranscriptQuery(BaseModel):
    search: str | None = Field(default=None, max_length=200)
    language: str | None = Field(default=None, max_length=32)
    status: str | None = Field(default=None, max_length=32)
    sort_by: Literal["created_at", "updated_at", "title", "duration_seconds"] = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"
