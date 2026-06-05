from fastapi import APIRouter, Depends, WebSocket

from app.core.config import Settings, get_settings
from app.services.websocket_service import WebSocketTranscriptionService

router = APIRouter()


@router.websocket("/ws/transcribe")
async def transcribe_websocket(
    websocket: WebSocket,
    settings: Settings = Depends(get_settings),
) -> None:
    await WebSocketTranscriptionService(settings).handle_connection(websocket)
