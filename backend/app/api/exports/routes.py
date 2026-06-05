from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import get_current_user, get_db_session
from app.models.enums import ExportFormat
from app.schemas.auth import CurrentUser
from app.schemas.export import ExportJobResponse, ExportRead
from app.services.export_service import ExportService

history_router = APIRouter()
download_router = APIRouter()


@history_router.get("", response_model=list[ExportRead])
async def list_exports(
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> list[ExportRead]:
    return await ExportService(session, settings).list_exports(user)


@history_router.post("/{transcript_id}/{format}", response_model=ExportJobResponse, status_code=202)
async def create_export(
    transcript_id: UUID,
    format: ExportFormat,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> ExportJobResponse:
    return await ExportService(session, settings).enqueue_export(user, transcript_id, format)


@download_router.get("/txt/{transcript_id}", response_class=FileResponse)
async def export_txt(
    transcript_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> FileResponse:
    path = await ExportService(session, settings).get_or_create_export_path(user, transcript_id, ExportFormat.TXT)
    return FileResponse(path, media_type="text/plain", filename="transcript.txt")


@download_router.get("/pdf/{transcript_id}", response_class=FileResponse)
async def export_pdf(
    transcript_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> FileResponse:
    path = await ExportService(session, settings).get_or_create_export_path(user, transcript_id, ExportFormat.PDF)
    return FileResponse(path, media_type="application/pdf", filename="transcript.pdf")


@download_router.get("/docx/{transcript_id}", response_class=FileResponse)
async def export_docx(
    transcript_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> FileResponse:
    path = await ExportService(session, settings).get_or_create_export_path(user, transcript_id, ExportFormat.DOCX)
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="transcript.docx",
    )
