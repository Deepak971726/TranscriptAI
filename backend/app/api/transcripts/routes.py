from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import get_current_user, get_db_session
from app.schemas.auth import CurrentUser
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.transcript import TranscriptListItem, TranscriptQuery, TranscriptRead, TranscriptUpdate
from app.services.transcript_service import TranscriptService

router = APIRouter()


def transcript_query(
    search: str | None = Query(default=None, max_length=200),
    language: str | None = Query(default=None, max_length=32),
    status_filter: str | None = Query(default=None, alias="status", max_length=32),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
) -> TranscriptQuery:
    return TranscriptQuery(search=search, language=language, status=status_filter, sort_by=sort_by, sort_order=sort_order)


def pagination(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
) -> PaginationParams:
    return PaginationParams(page=page, size=size)


@router.get("", response_model=PaginatedResponse[TranscriptListItem])
async def list_transcripts(
    query: TranscriptQuery = Depends(transcript_query),
    pagination_params: PaginationParams = Depends(pagination),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[TranscriptListItem]:
    result = await TranscriptService(session).list_transcripts(user, query, pagination_params)
    statuses = [item.status for item in result.items]
    if statuses:
        logger.info("[ROUTE] Transcript statuses in response: {}", statuses)
    return result


@router.get("/search", response_model=PaginatedResponse[TranscriptListItem])
async def search_transcripts(
    query: TranscriptQuery = Depends(transcript_query),
    pagination_params: PaginationParams = Depends(pagination),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[TranscriptListItem]:
    return await TranscriptService(session).list_transcripts(user, query, pagination_params)


@router.get("/{transcript_id}", response_model=TranscriptRead)
async def read_transcript(
    transcript_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> TranscriptRead:
    return await TranscriptService(session).get_transcript(user, transcript_id)


@router.put("/{transcript_id}", response_model=TranscriptRead)
async def update_transcript(
    transcript_id: UUID,
    payload: TranscriptUpdate,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> TranscriptRead:
    return await TranscriptService(session).update_transcript(user, transcript_id, payload)


@router.delete("/{transcript_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transcript(
    transcript_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    await TranscriptService(session).delete_transcript(user, transcript_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{transcript_id}/process", response_model=TranscriptRead, status_code=status.HTTP_202_ACCEPTED)
async def process_transcript(
    transcript_id: UUID,
    background_tasks: BackgroundTasks,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> TranscriptRead:
    logger.info("[ROUTE] Manual reprocess requested - user={} transcript_id={}", user.id, transcript_id)
    return await TranscriptService(session).process_transcript(user, transcript_id, settings, background_tasks)


@router.post("/{transcript_id}/diarize", response_model=TranscriptRead)
async def diarize_transcript(
    transcript_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> TranscriptRead:
    logger.info("[ROUTE] Speaker identification requested - user={} transcript_id={}", user.id, transcript_id)
    return await TranscriptService(session).diarize_transcript(user, transcript_id, settings)
