from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import AnyHttpUrl, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven settings for API, database, workers, and storage."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "TranscribeAI"
    api_prefix: str = "/api"
    debug: bool = False
    environment: Literal["local", "staging", "production", "test"] = "local"

    frontend_origin: str = "http://127.0.0.1:5173"
    allowed_origins: str = "http://127.0.0.1:5173"
    trusted_hosts: str = "127.0.0.1,localhost,*"

    supabase_url: AnyHttpUrl | None = None
    supabase_anon_key: SecretStr | None = None
    supabase_service_role_key: SecretStr | None = None

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/transcribeai"
    database_startup_check_required: bool | None = None
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: SecretStr = SecretStr("change-me")
    jwt_audience: str = "authenticated"
    jwt_algorithms: list[str] = Field(default_factory=lambda: ["HS256"])

    whisper_model: Literal["tiny", "base", "small", "medium", "large-v3"] = "base"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    whisper_beam_size: int = 5
    whisper_vad_filter: bool = False
    whisper_word_timestamps: bool = False
    speaker_diarization_enabled: bool = True
    speaker_diarization_speakers: int = Field(default=2, ge=1, le=8)
    speaker_diarization_min_segment_seconds: float = Field(default=0.8, ge=0.2, le=10)

    max_upload_size_mb: int = 250
    max_audio_duration_seconds: int = 6 * 60 * 60
    upload_directory: Path = Path("uploads")
    export_directory: Path = Path("exports")
    temp_directory: Path = Path("tmp")
    supported_audio_extensions: set[str] = Field(default_factory=lambda: {"mp3", "wav", "webm", "m4a", "aac"})
    supported_audio_mime_types: set[str] = Field(
        default_factory=lambda: {
            "audio/mpeg",
            "audio/mp3",
            "audio/wav",
            "audio/x-wav",
            "audio/webm",
            "audio/mp4",
            "audio/aac",
            "audio/x-aac",
            "audio/m4a",
            "application/octet-stream",
        }
    )

    celery_task_always_eager: bool = False
    background_tasks_enabled: bool = True
    fail_upload_when_queue_unavailable: bool = False
    redis_connect_timeout_seconds: float = 0.5
    celery_worker_check_enabled: bool = True
    celery_worker_check_timeout_seconds: float = 1.0
    local_transcription_process_enabled: bool = True
    log_level: str = "INFO"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+asyncpg://", 1)
        if value.startswith("postgresql://") and "+asyncpg" not in value:
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def allowed_origins_list(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins.split(",") if item.strip()]

    @property
    def trusted_hosts_list(self) -> list[str]:
        return [item.strip() for item in self.trusted_hosts.split(",") if item.strip()]

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("+asyncpg", "").replace("+aiosqlite", "")

    @property
    def require_database_startup_check(self) -> bool:
        if self.database_startup_check_required is not None:
            return self.database_startup_check_required
        return self.environment == "production"

    def ensure_storage_directories(self) -> None:
        for directory in (self.upload_directory, self.export_directory, self.temp_directory):
            directory.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()
