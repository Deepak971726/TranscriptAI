import asyncio
from pathlib import Path
from typing import Protocol

import av
import numpy as np
from loguru import logger

from app.core.config import Settings


class TimedSegment(Protocol):
    """Marker protocol for transcription or persisted segment objects."""


class SpeakerDiarizationService:
    """Assign local speaker labels using deterministic acoustic clustering."""

    sample_rate = 16_000
    analysis_window_seconds = 2.0
    analysis_hop_seconds = 1.0
    minimum_analysis_seconds = 0.35

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def diarize_file(self, path: Path, segments: list[TimedSegment]) -> list[str]:
        if not self.settings.speaker_diarization_enabled or not segments:
            return ["Speaker"] * len(segments)

        return await asyncio.to_thread(self._diarize_sync, path, segments)

    def _diarize_sync(self, path: Path, segments: list[TimedSegment]) -> list[str]:
        expected_speakers = min(self.settings.speaker_diarization_speakers, len(segments))
        if expected_speakers <= 1 or len(segments) < expected_speakers * 2:
            return ["Speaker 1"] * len(segments)

        logger.info(
            "[DIARIZATION] Started - file='{}' segments={} expected_speakers={}",
            path.name,
            len(segments),
            expected_speakers,
        )

        samples = self._decode_audio(path)
        feature_vectors: list[np.ndarray] = []
        feature_owners: list[int] = []
        feature_durations: list[float] = []

        for index, segment in enumerate(segments):
            for start, end in self._analysis_windows(segment):
                feature_vectors.append(
                    self._extract_features(
                        samples[
                            max(0, int((start - 0.03) * self.sample_rate)) :
                            min(len(samples), int((end + 0.03) * self.sample_rate))
                        ]
                    )[:13]
                )
                feature_owners.append(index)
                feature_durations.append(end - start)

        if len(feature_vectors) < expected_speakers * 2:
            logger.warning(
                "[DIARIZATION] Insufficient voice samples - file='{}' samples={}",
                path.name,
                len(feature_vectors),
            )
            return ["Speaker 1"] * len(segments)

        features = np.stack(feature_vectors)
        features = np.nan_to_num(features, copy=False)
        standardized = self._standardize(features)

        training_indices = [
            index
            for index, duration in enumerate(feature_durations)
            if duration >= self.settings.speaker_diarization_min_segment_seconds
        ]
        if len(training_indices) < expected_speakers * 2:
            training_indices = list(range(len(feature_vectors)))

        centers = self._cluster_centers(standardized[training_indices], expected_speakers)
        feature_distances = np.sum(
            (standardized[:, np.newaxis, :] - centers[np.newaxis, :, :]) ** 2,
            axis=2,
        )
        labels = self._segment_labels(feature_distances, feature_owners, len(segments))
        labels = self._smooth_short_segments(labels, segments)
        speaker_labels = self._format_labels(labels)

        counts = {label: speaker_labels.count(label) for label in sorted(set(speaker_labels))}
        logger.info("[DIARIZATION] Completed - file='{}' speakers={} counts={}", path.name, len(counts), counts)
        return speaker_labels

    def _decode_audio(self, path: Path) -> np.ndarray:
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {path}")

        resampler = av.AudioResampler(format="fltp", layout="mono", rate=self.sample_rate)
        parts: list[np.ndarray] = []

        with av.open(str(path)) as container:
            for frame in container.decode(audio=0):
                for output in resampler.resample(frame):
                    parts.append(output.to_ndarray().reshape(-1))

        for output in resampler.resample(None):
            parts.append(output.to_ndarray().reshape(-1))

        if not parts:
            raise ValueError("Audio file contains no decodable samples")
        return np.concatenate(parts).astype(np.float32, copy=False)

    def _analysis_windows(self, segment: TimedSegment) -> list[tuple[float, float]]:
        start = self._segment_start(segment)
        end = self._segment_end(segment)
        duration = end - start
        if duration < self.minimum_analysis_seconds:
            return []
        if duration <= self.analysis_window_seconds:
            return [(start, end)]

        latest_start = end - (self.analysis_window_seconds / 2)
        starts = np.arange(start, latest_start, self.analysis_hop_seconds)
        return [
            (float(window_start), min(end, float(window_start) + self.analysis_window_seconds))
            for window_start in starts
        ]

    def _extract_features(self, samples: np.ndarray) -> np.ndarray:
        frame_size = 400
        hop_size = 160

        if len(samples) < frame_size:
            samples = np.pad(samples, (0, frame_size - len(samples)))

        normalized = samples - float(np.mean(samples))
        normalized = normalized / (float(np.std(normalized)) + 1e-6)
        normalized = np.append(normalized[0], normalized[1:] - 0.97 * normalized[:-1])

        frames = np.lib.stride_tricks.sliding_window_view(normalized, frame_size)[::hop_size]
        frames = frames * np.hanning(frame_size)
        spectrum = np.abs(np.fft.rfft(frames, 512)) ** 2
        frequencies = np.fft.rfftfreq(512, 1 / self.sample_rate)

        valid_bins = np.where((frequencies >= 80) & (frequencies <= 7_600))[0]
        frequency_bands = np.array_split(valid_bins, 24)
        log_bands = np.stack(
            [np.log(spectrum[:, band].mean(axis=1) + 1e-8) for band in frequency_bands],
            axis=1,
        )

        coefficient_index = np.arange(13)[:, np.newaxis]
        band_index = np.arange(log_bands.shape[1])[np.newaxis, :]
        cosine_basis = np.cos(
            np.pi / log_bands.shape[1] * (band_index + 0.5) * coefficient_index
        )
        cepstral = log_bands @ cosine_basis.T

        zero_crossing_rate = (np.diff(np.signbit(frames), axis=1) != 0).mean(axis=1)
        spectral_centroid = (
            (spectrum * frequencies).sum(axis=1) / (spectrum.sum(axis=1) + 1e-9)
        )
        pitch_values = self._estimate_pitch(frames)

        return np.concatenate(
            [
                cepstral.mean(axis=0),
                cepstral.std(axis=0),
                np.array(
                    [
                        zero_crossing_rate.mean(),
                        zero_crossing_rate.std(),
                        spectral_centroid.mean() / 1_000,
                        spectral_centroid.std() / 1_000,
                        np.median(pitch_values) if pitch_values else 0,
                        np.std(pitch_values) if pitch_values else 0,
                    ]
                ),
            ]
        )

    def _estimate_pitch(self, frames: np.ndarray) -> list[float]:
        pitches: list[float] = []
        frame_step = max(1, len(frames) // 20)
        minimum_lag = int(self.sample_rate / 350)
        maximum_lag = int(self.sample_rate / 70)

        for frame in frames[::frame_step]:
            autocorrelation = np.correlate(frame, frame, mode="full")[len(frame) - 1 :]
            upper_bound = min(len(autocorrelation), maximum_lag)
            if upper_bound <= minimum_lag:
                continue
            lag = minimum_lag + int(np.argmax(autocorrelation[minimum_lag:upper_bound]))
            pitches.append(self.sample_rate / lag)

        return pitches

    def _standardize(self, features: np.ndarray) -> np.ndarray:
        return (features - features.mean(axis=0)) / (features.std(axis=0) + 1e-6)

    def _cluster_centers(self, features: np.ndarray, cluster_count: int) -> np.ndarray:
        centers = [features[np.argmin(np.linalg.norm(features - features.mean(axis=0), axis=1))]]

        while len(centers) < cluster_count:
            distances = np.min(
                np.stack([np.sum((features - center) ** 2, axis=1) for center in centers]),
                axis=0,
            )
            centers.append(features[int(np.argmax(distances))])

        centers_array = np.stack(centers)
        for _ in range(50):
            labels = np.argmin(
                np.sum((features[:, np.newaxis, :] - centers_array[np.newaxis, :, :]) ** 2, axis=2),
                axis=1,
            )
            updated = np.stack(
                [
                    features[labels == index].mean(axis=0)
                    if np.any(labels == index)
                    else centers_array[index]
                    for index in range(cluster_count)
                ]
            )
            if np.allclose(updated, centers_array, atol=1e-5):
                break
            centers_array = updated

        return centers_array

    def _segment_start(self, segment: TimedSegment) -> float:
        value = getattr(segment, "start", None)
        if value is None:
            value = getattr(segment, "start_time")
        return float(value)

    def _segment_end(self, segment: TimedSegment) -> float:
        value = getattr(segment, "end", None)
        if value is None:
            value = getattr(segment, "end_time")
        return float(value)

    def _segment_labels(
        self,
        feature_distances: np.ndarray,
        feature_owners: list[int],
        segment_count: int,
    ) -> np.ndarray:
        owners = np.asarray(feature_owners)
        labels = np.full(segment_count, -1, dtype=np.int64)

        for segment_index in range(segment_count):
            segment_features = feature_distances[owners == segment_index]
            if len(segment_features):
                labels[segment_index] = int(np.argmin(segment_features.mean(axis=0)))

        for segment_index in range(segment_count):
            if labels[segment_index] >= 0:
                continue
            previous = labels[segment_index - 1] if segment_index > 0 else -1
            following = next(
                (label for label in labels[segment_index + 1 :] if label >= 0),
                -1,
            )
            labels[segment_index] = previous if previous >= 0 else following

        labels[labels < 0] = 0
        return labels

    def _smooth_short_segments(self, labels: np.ndarray, segments: list[TimedSegment]) -> np.ndarray:
        smoothed = labels.copy()
        for index in range(1, len(labels) - 1):
            duration = self._segment_end(segments[index]) - self._segment_start(segments[index])
            if duration < 0.65 and labels[index - 1] == labels[index + 1]:
                smoothed[index] = labels[index - 1]
        return smoothed

    def _format_labels(self, labels: np.ndarray) -> list[str]:
        mapping: dict[int, int] = {}
        next_speaker = 1
        formatted: list[str] = []

        for raw_label in labels.tolist():
            label = int(raw_label)
            if label not in mapping:
                mapping[label] = next_speaker
                next_speaker += 1
            formatted.append(f"Speaker {mapping[label]}")

        return formatted
