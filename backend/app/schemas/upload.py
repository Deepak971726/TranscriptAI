from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AudioUploadResponse(BaseModel):
    job_id: str
    status: str = "queued"
    audio_file_id: UUID
    transcript_id: UUID | None = None


class AudioFileRead(BaseModel):
    id: UUID
    original_filename: str
    mime_type: str
    size_bytes: int
    duration_seconds: int | None
    checksum: str
    status: str
    language: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UploadValidationResult(BaseModel):
    filename: str
    mime_type: str
    size_bytes: int = Field(ge=0)
    checksum: str
    duration_seconds: int | None
