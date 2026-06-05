from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db_session
from app.schemas.auth import CurrentUser
from app.schemas.dashboard import DashboardStats
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def read_dashboard_stats(
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> DashboardStats:
    return await DashboardService(session).get_stats(user)
