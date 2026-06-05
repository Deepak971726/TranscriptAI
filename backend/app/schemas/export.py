from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ExportRead(BaseModel):
    id: UUID
    transcript_id: UUID
    format: str
    status: str
    storage_path: str | None
    size_bytes: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExportJobResponse(BaseModel):
    job_id: str
    export_id: UUID
    status: str
    format: str
