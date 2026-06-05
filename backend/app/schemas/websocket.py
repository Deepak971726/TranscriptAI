from typing import Any, Literal

from pydantic import BaseModel, Field


class WebSocketIncomingEvent(BaseModel):
    event: Literal["connect", "audio_chunk", "finalize", "disconnect"]
    data: str | None = None
    language: str | None = Field(default=None, max_length=32)
    metadata: dict[str, Any] = {}


class WebSocketOutgoingEvent(BaseModel):
    event: Literal["partial_transcript", "final_transcript", "error", "connected"]
    data: dict[str, Any]
