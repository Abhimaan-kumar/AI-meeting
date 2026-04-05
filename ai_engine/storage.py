import json
from pathlib import Path
from typing import List

from ai_engine.models import MeetingRecord


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "meetings.json"

LEGACY_RECORDING_URL_MAP = {
    "https://fathom.video/share/demo-recording-001": "https://example.com/#flowstate-demo-recording-001",
    "https://fathom.video/share/step5-expected-keys": "https://example.com/#flowstate-step5-expected-keys",
    "https://fathom.video/share/step6-alt-keys": "https://example.com/#flowstate-step6-alt-keys",
}


def _normalize_recording_url(value: object) -> str:
    """Map legacy placeholder recording URLs to safe demo URLs."""
    text = str(value or "").strip()
    return LEGACY_RECORDING_URL_MAP.get(text, text)


def _ensure_data_file() -> None:
    """Create the data directory and JSON file if they do not exist."""
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text("[]", encoding="utf-8")


def load_meetings() -> List[dict]:
    """Load all meeting records from disk."""
    _ensure_data_file()

    try:
        content = DATA_FILE.read_text(encoding="utf-8")
        data = json.loads(content)
    except json.JSONDecodeError:
        data = []

    if isinstance(data, list):
        changed = False
        for meeting in data:
            if not isinstance(meeting, dict):
                continue
            if "recording_url" not in meeting:
                continue
            normalized = _normalize_recording_url(meeting.get("recording_url"))
            if meeting.get("recording_url") != normalized:
                meeting["recording_url"] = normalized
                changed = True

        if changed:
            DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return data
    return []


def append_meeting(record: MeetingRecord) -> None:
    """Append a new meeting record and persist the full list."""
    meetings = load_meetings()
    record.recording_url = _normalize_recording_url(record.recording_url)
    meetings.append(record.to_dict())
    DATA_FILE.write_text(json.dumps(meetings, indent=2), encoding="utf-8")
