from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.repositories.transcript_repository import TranscriptRepository
from app.schemas.auth import CurrentUser
from app.schemas.dashboard import DashboardStats


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.transcript_repository = TranscriptRepository(session)

    async def get_stats(self, user: CurrentUser) -> DashboardStats:
        logger.info("[DASHBOARD] Fetching stats - user_id={}", user.id)
        total_seconds = await self.transcript_repository.total_duration_seconds_for_user(user.id)
        stats = DashboardStats(
            total_transcripts=await self.transcript_repository.count_for_user(user.id),
            total_audio_files=await self.transcript_repository.audio_count_for_user(user.id),
            total_minutes=round(total_seconds / 60),
            languages_used=await self.transcript_repository.languages_used_for_user(user.id),
        )
        logger.info(
            "[DASHBOARD] Stats ready - user_id={} transcripts={} audio_files={} total_minutes={} languages={}",
            user.id, stats.total_transcripts, stats.total_audio_files, stats.total_minutes, stats.languages_used,
        )
        return stats
