from fastapi import APIRouter

from app.api.auth.routes import router as auth_router
from app.api.dashboard.routes import router as dashboard_router
from app.api.exports.routes import download_router, history_router
from app.api.settings.routes import router as settings_router
from app.api.transcripts.routes import router as transcripts_router
from app.api.uploads.routes import router as uploads_router
from app.api.users.routes import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(uploads_router, prefix="/uploads", tags=["uploads"])
api_router.include_router(transcripts_router, prefix="/transcripts", tags=["transcripts"])
api_router.include_router(history_router, prefix="/exports", tags=["exports"])
api_router.include_router(download_router, prefix="/export", tags=["exports"])
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])
