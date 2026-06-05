from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
import re
from uuid import UUID, uuid4

import anyio
from fastapi import HTTPException, UploadFile, status
from loguru import logger
from mutagen import File as MutagenFile

from app.core.config import Settings
from app.schemas.upload import UploadValidationResult


@dataclass(frozen=True)
class StoredUpload:
    path: Path
    validation: UploadValidationResult
    stored_filename: str


class StorageService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _safe_extension(self, filename: str) -> str:
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if extension not in self.settings.supported_audio_extensions:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file extension: {extension or 'none'}",
            )
        return extension

    def _safe_filename(self, filename: str) -> str:
        stem = filename.rsplit(".", 1)[0]
        stem = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip(".-")[:80]
        return stem or "audio"

    def _validate_mime_type(self, content_type: str | None) -> str:
        mime_type = content_type or "application/octet-stream"
        if mime_type not in self.settings.supported_audio_mime_types:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported MIME type: {mime_type}",
            )
        return mime_type

    async def save_audio_upload(self, user_id: UUID, upload: UploadFile) -> StoredUpload:
        original_filename = upload.filename or "audio"
        extension = self._safe_extension(original_filename)
        mime_type = self._validate_mime_type(upload.content_type)
        stored_filename = f"{uuid4().hex}-{self._safe_filename(original_filename)}.{extension}"
        user_directory = (self.settings.upload_directory / str(user_id)).resolve()
        user_directory.mkdir(parents=True, exist_ok=True)
        destination = user_directory / stored_filename

        hasher = sha256()
        size_bytes = 0

        try:
            async with await anyio.open_file(destination, "wb") as output:
                while chunk := await upload.read(1024 * 1024):
                    size_bytes += len(chunk)
                    if size_bytes > self.settings.max_upload_size_bytes:
                        await output.aclose()
                        destination.unlink(missing_ok=True)
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds {self.settings.max_upload_size_mb} MB limit",
                        )
                    hasher.update(chunk)
                    await output.write(chunk)
        finally:
            await upload.close()

        duration_seconds = self.get_audio_duration_seconds(destination)
        if duration_seconds and duration_seconds > self.settings.max_audio_duration_seconds:
            destination.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Audio duration exceeds configured limit",
            )

        validation = UploadValidationResult(
            filename=original_filename,
            mime_type=mime_type,
            size_bytes=size_bytes,
            checksum=hasher.hexdigest(),
            duration_seconds=duration_seconds,
        )
        logger.info("[STORAGE] File saved - user={} file='{}' size={}B duration={}s",
                    user_id, original_filename, size_bytes, duration_seconds)
        return StoredUpload(path=destination, validation=validation, stored_filename=stored_filename)

    def get_audio_duration_seconds(self, path: Path) -> int | None:
        try:
            audio = MutagenFile(path)
            if audio and audio.info and getattr(audio.info, "length", None):
                return int(audio.info.length)
        except Exception as exc:
            logger.warning("[STORAGE] Could not read audio duration - path={} error={}", path, exc)
        return None

    def transcript_export_directory(self, transcript_id: UUID) -> Path:
        directory = self.settings.export_directory / str(transcript_id)
        directory.mkdir(parents=True, exist_ok=True)
        return directory

    def delete_file(self, path: str | Path | None) -> None:
        if not path:
            return
        candidate = Path(path)
        try:
            candidate.unlink(missing_ok=True)
            logger.info("[STORAGE] File deleted - path={}", candidate)
        except OSError as exc:
            logger.warning("[STORAGE] Failed to delete file - path={} error={}", candidate, exc)

    def cleanup_empty_directories(self, root: Path) -> int:
        removed = 0
        if not root.exists():
            return removed
        for directory in sorted((item for item in root.rglob("*") if item.is_dir()), reverse=True):
            try:
                directory.rmdir()
                removed += 1
            except OSError:
                continue
        return removed
