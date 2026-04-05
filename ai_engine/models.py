from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable


def _get_nested_value(payload: Dict[str, Any], key_path: str) -> Any:
    """Safely read nested dictionary values using dot-path syntax."""
    current: Any = payload
    for part in key_path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _extract_text(payload: Dict[str, Any], aliases: Iterable[str]) -> str:
    """Return the first non-empty value from provided key aliases."""
    for alias in aliases:
        value = _get_nested_value(payload, alias) if "." in alias else payload.get(alias)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ""


@dataclass
class MeetingRecord:
    """Represents a single webhook payload stored for later website access."""

    recording_url: str
    meeting_title: str
    transcript_text: str
    received_at: str

    @classmethod
    def from_payload(cls, payload: Dict[str, Any]) -> "MeetingRecord":
        """Build a normalized record from webhook JSON payload."""
        return cls(
            recording_url=_extract_text(
                payload,
                (
                    "recording_url",
                    "recordingUrl",
                    "recording.url",
                    "recording.link",
                    "video_url",
                    "videoUrl",
                    "url",
                ),
            ),
            meeting_title=_extract_text(
                payload,
                (
                    "meeting_title",
                    "meetingTitle",
                    "meeting_name",
                    "meetingName",
                    "title",
                    "name",
                ),
            ),
            transcript_text=_extract_text(
                payload,
                (
                    "transcript_text",
                    "transcriptText",
                    "transcript",
                    "recording.transcript",
                    "content.transcript",
                ),
            ),
            received_at=datetime.now(timezone.utc).isoformat(),
        )

    def to_dict(self) -> Dict[str, str]:
        """Convert dataclass to a JSON-serializable dictionary."""
        return asdict(self)
