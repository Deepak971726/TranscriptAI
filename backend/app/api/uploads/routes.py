from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import get_current_user, get_db_session
from app.schemas.auth import CurrentUser
from app.schemas.upload import AudioUploadResponse
from app.services.upload_service import UploadService

router = APIRouter()


@router.post("/audio", response_model=AudioUploadResponse, status_code=202)
async def upload_audio(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> AudioUploadResponse:
    return await UploadService(session, settings).upload_audio(user, file, background_tasks)
