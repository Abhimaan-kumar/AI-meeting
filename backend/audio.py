from __future__ import annotations

import os
from pathlib import Path

from faster_whisper import WhisperModel


class AudioTranscriber:
    def __init__(self, model_size: str = "base", device: str = "cpu") -> None:
        self._language = os.getenv("WHISPER_LANGUAGE", "en").strip() or None
        self._beam_size = int(os.getenv("WHISPER_BEAM_SIZE", "5"))
        self._model = WhisperModel(model_size, device=device, compute_type="int8")

    def transcribe(self, file_path: str | Path) -> str:
        segments, _ = self._model.transcribe(
            str(file_path),
            task="transcribe",
            language=self._language,
            vad_filter=True,
            beam_size=self._beam_size,
            condition_on_previous_text=False,
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()
        return text
