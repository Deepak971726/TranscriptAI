from dataclasses import dataclass
from pathlib import Path

import numpy as np

from app.core.config import Settings
from app.services.speaker_diarization_service import SpeakerDiarizationService


@dataclass(frozen=True)
class Segment:
    start: float
    end: float


@dataclass(frozen=True)
class StoredSegment:
    start_time: float
    end_time: float


def test_diarization_assigns_two_stable_speakers(monkeypatch) -> None:
    settings = Settings(
        database_url="sqlite+aiosqlite:///:memory:",
        speaker_diarization_enabled=True,
        speaker_diarization_speakers=2,
    )
    service = SpeakerDiarizationService(settings)
    segments = [
        Segment(0, 1.5),
        Segment(2, 3.5),
        Segment(4, 5.5),
        Segment(6, 7.5),
        Segment(8, 9.5),
        Segment(10, 11.5),
    ]
    feature_vectors = iter(
        [
            np.array([0.0, 0.1, 0.0]),
            np.array([5.0, 4.9, 5.1]),
            np.array([0.2, 0.0, 0.1]),
            np.array([5.2, 5.0, 4.8]),
            np.array([0.1, 0.2, 0.0]),
            np.array([4.9, 5.1, 5.0]),
        ]
    )

    monkeypatch.setattr(service, "_decode_audio", lambda _path: np.zeros(200_000))
    monkeypatch.setattr(service, "_extract_features", lambda _samples: next(feature_vectors))

    labels = service._diarize_sync(Path("test.mp3"), segments)

    assert labels == [
        "Speaker 1",
        "Speaker 2",
        "Speaker 1",
        "Speaker 2",
        "Speaker 1",
        "Speaker 2",
    ]


def test_diarization_accepts_persisted_segment_timestamps(monkeypatch) -> None:
    settings = Settings(
        database_url="sqlite+aiosqlite:///:memory:",
        speaker_diarization_enabled=True,
        speaker_diarization_speakers=2,
    )
    service = SpeakerDiarizationService(settings)
    segments = [
        StoredSegment(0, 1.5),
        StoredSegment(2, 3.5),
        StoredSegment(4, 5.5),
        StoredSegment(6, 7.5),
    ]
    feature_vectors = iter(
        [
            np.array([0.0, 0.1, 0.0]),
            np.array([5.0, 4.9, 5.1]),
            np.array([0.1, 0.0, 0.2]),
            np.array([5.1, 5.0, 4.9]),
        ]
    )

    monkeypatch.setattr(service, "_decode_audio", lambda _path: np.zeros(200_000))
    monkeypatch.setattr(service, "_extract_features", lambda _samples: next(feature_vectors))

    labels = service._diarize_sync(Path("test.mp3"), segments)

    assert labels == ["Speaker 1", "Speaker 2", "Speaker 1", "Speaker 2"]


async def test_disabled_diarization_uses_neutral_label() -> None:
    settings = Settings(
        database_url="sqlite+aiosqlite:///:memory:",
        speaker_diarization_enabled=False,
    )
    service = SpeakerDiarizationService(settings)

    labels = await service.diarize_file(Path("unused.mp3"), [Segment(0, 1)])

    assert labels == ["Speaker"]
