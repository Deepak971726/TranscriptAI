from dataclasses import dataclass
import asyncio
import math
from pathlib import Path
from typing import Any, ClassVar
from faster_whisper import WhisperModel
from loguru import logger

from app.core.config import Settings


@dataclass(frozen=True)
class WhisperSegment:
    start: float
    end: float
    text: str
    confidence: float | None
    words: list[dict[str, object]] | None


@dataclass(frozen=True)
class WhisperResult:
    text: str
    language: str | None
    language_probability: float | None
    duration_seconds: int | None
    confidence: float | None
    segments: list[WhisperSegment]


class WhisperService:
    _model: ClassVar[object | None] = None
    _model_key: ClassVar[tuple[str, str, str] | None] = None
    _language_codes = {
        "english": "en",
        "spanish": "es",
        "french": "fr",
        "german": "de",
        "hindi": "hi",
        "japanese": "ja",
    }

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _load_model(self) -> object:
        model_key = (
            self.settings.whisper_model,
            self.settings.whisper_device,
            self.settings.whisper_compute_type,
        )
        cls = type(self)
        if cls._model is None or cls._model_key != model_key:
            

            logger.info("[WHISPER] Loading model - model={} device={} compute_type={}",
                        self.settings.whisper_model, self.settings.whisper_device, self.settings.whisper_compute_type)
            cls._model = WhisperModel(
                self.settings.whisper_model,
                device=self.settings.whisper_device,
                compute_type=self.settings.whisper_compute_type,
            )
            cls._model_key = model_key
            logger.info("[WHISPER] Model loaded successfully - model={} device={}", model_key[0], model_key[1])
        if cls._model is None:
            raise RuntimeError("Whisper model did not initialize")
        return cls._model

    async def transcribe_file(self, path: Path, language: str | None = None) -> WhisperResult:
        return await asyncio.to_thread(self._transcribe_sync, path, self._normalize_language(language))

    def _normalize_language(self, language: str | None) -> str | None:
        if not language:
            return None
        normalized = language.strip().lower()
        return self._language_codes.get(normalized, normalized)

    def _transcribe_sync(self, path: Path, language: str | None) -> WhisperResult:
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {path}")

        model = self._load_model()
        logger.info("[WHISPER] Transcription started - file='{}' language={}", path.name, language or "auto-detect")

        segments_iter, info = model.transcribe(
            str(path),
            language=language,
            beam_size=5,
            vad_filter=True,
            word_timestamps=True,
        )

        detected_language = getattr(info, "language", None)
        language_probability = getattr(info, "language_probability", None)
        logger.info("[WHISPER] Language detected - language={} confidence={:.0%}",
                    detected_language,
                    float(language_probability) if language_probability is not None else 0)

        segments: list[WhisperSegment] = []
        text_parts: list[str] = []
        confidences: list[float] = []

        for segment in segments_iter:
            confidence = self._segment_confidence(getattr(segment, "avg_logprob", None))
            if confidence is not None:
                confidences.append(confidence)
            words = self._map_words(getattr(segment, "words", None))
            clean_text = segment.text.strip()
            if clean_text:
                text_parts.append(clean_text)
            logger.debug("[WHISPER] Segment [{:.2f}s -> {:.2f}s] {}",
                         float(segment.start), float(segment.end), clean_text)
            segments.append(WhisperSegment(
                start=float(segment.start),
                end=float(segment.end),
                text=clean_text,
                confidence=confidence,
                words=words,
            ))

        average_confidence = round(sum(confidences) / len(confidences), 4) if confidences else None
        duration = getattr(info, "duration", None)
        logger.info("[WHISPER] Transcription finished - duration={}s segments={} confidence={} words={}",
                    int(duration) if duration else "unknown",
                    len(segments),
                    average_confidence,
                    len(" ".join(text_parts).split()))

        return WhisperResult(
            text=" ".join(text_parts).strip(),
            language=detected_language,
            language_probability=float(language_probability) if language_probability is not None else None,
            duration_seconds=int(duration) if duration else None,
            confidence=average_confidence,
            segments=segments,
        )

    def _map_words(self, words: Any) -> list[dict[str, object]] | None:
        mapped = [{"word": w.word, "start": w.start, "end": w.end, "probability": w.probability} for w in words or []]
        return mapped or None

    def _segment_confidence(self, avg_logprob: float | None) -> float | None:
        if avg_logprob is None:
            return None
        return max(0.0, min(1.0, math.exp(avg_logprob)))
