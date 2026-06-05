from base64 import b64decode
from pathlib import Path
from uuid import uuid4

from fastapi import WebSocket
from loguru import logger
from pydantic import ValidationError

from app.core.config import Settings
from app.schemas.websocket import WebSocketIncomingEvent, WebSocketOutgoingEvent
from app.services.whisper_service import WhisperService


class WebSocketTranscriptionService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.whisper_service = WhisperService(settings)

    async def handle_connection(self, websocket: WebSocket) -> None:
        await websocket.accept()
        connection_id = uuid4().hex[:8]
        logger.info("[WS] Client connected - connection_id={} client={}", connection_id, websocket.client)
        chunks: list[bytes] = []
        language: str | None = None
        await self._send(websocket, "connected", {"message": "ready"})

        while True:
            try:
                payload = await websocket.receive_json()
                event = WebSocketIncomingEvent.model_validate(payload)

                if event.event == "audio_chunk":
                    if event.data:
                        chunks.append(b64decode(event.data))
                    language = event.language or language
                    logger.debug("[WS] Audio chunk received - connection_id={} total_chunks={} language={}", connection_id, len(chunks), language)
                    await self._send(websocket, "partial_transcript", {"text": "", "chunks_received": len(chunks), "is_final": False})

                elif event.event == "finalize":
                    logger.info("[WS] Finalize requested - connection_id={} chunks={} language={}", connection_id, len(chunks), language)
                    final = await self._finalize(connection_id, chunks, language)
                    await self._send(websocket, "final_transcript", final)
                    chunks.clear()
                    logger.info("[WS] Final transcript sent - connection_id={}", connection_id)

                elif event.event == "disconnect":
                    logger.info("[WS] Client requested disconnect - connection_id={}", connection_id)
                    await websocket.close()
                    return

            except ValidationError as exc:
                logger.warning("[WS] Invalid event payload - connection_id={} errors={}", connection_id, exc.errors())
                await self._send(websocket, "error", {"message": exc.errors()})
            except Exception as exc:
                logger.exception("[WS] Unexpected error - connection_id={} error={}", connection_id, exc)
                await self._send(websocket, "error", {"message": "Transcription failed"})

        logger.info("[WS] Connection closed - connection_id={}", connection_id)

    async def _finalize(self, connection_id: str, chunks: list[bytes], language: str | None) -> dict[str, object]:
        if not chunks:
            logger.warning("[WS] Finalize called with no audio chunks - connection_id={}", connection_id)
            return {"text": "", "segments": [], "language": language, "is_final": True}

        self.settings.temp_directory.mkdir(parents=True, exist_ok=True)
        temp_path = self.settings.temp_directory / f"live-{uuid4().hex}.webm"
        temp_path.write_bytes(b"".join(chunks))
        size_bytes = temp_path.stat().st_size
        logger.info("[WS] Temp audio written - connection_id={} path={} size={}B chunks={}", connection_id, temp_path.name, size_bytes, len(chunks))

        try:
            logger.info("[WS] Starting transcription - connection_id={} language={}", connection_id, language or "auto-detect")
            result = await self.whisper_service.transcribe_file(temp_path, language=language)
            logger.info("[WS] Transcription done - connection_id={} language={} segments={} confidence={}", connection_id, result.language, len(result.segments), result.confidence)
            return {
                "text": result.text,
                "language": result.language,
                "confidence": result.confidence,
                "segments": [segment.__dict__ for segment in result.segments],
                "is_final": True,
            }
        finally:
            Path(temp_path).unlink(missing_ok=True)
            logger.info("[WS] Temp audio deleted - connection_id={} path={}", connection_id, temp_path.name)

    async def _send(self, websocket: WebSocket, event: str, data: dict[str, object]) -> None:
        outgoing = WebSocketOutgoingEvent(event=event, data=data)
        await websocket.send_json(outgoing.model_dump())
