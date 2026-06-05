from enum import Enum


class StrEnum(str, Enum):
    """Python 3.10-compatible string enum; Python 3.12 has enum.StrEnum."""


class AudioStatus(StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TranscriptStatus(StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ExportFormat(StrEnum):
    TXT = "txt"
    PDF = "pdf"
    DOCX = "docx"


class ExportStatus(StrEnum):
    QUEUED = "queued"
    COMPLETED = "completed"
    FAILED = "failed"
