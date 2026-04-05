import os
from typing import Any, Dict, Tuple

from dotenv import load_dotenv
from flask import Flask, abort, jsonify, request

from ai_engine.models import MeetingRecord
from ai_engine.storage import append_meeting


# Load root .env values (including Fathom secrets) before reading os.getenv.
# override=True ensures stale shell env vars do not shadow current .env values.
load_dotenv(override=True)


app = Flask(__name__)

# Header expected on each webhook request for a simple shared-secret check.
WEBHOOK_SECRET_HEADER = "X-Fathom-Secret"
WEBHOOK_SECRET = os.getenv("FATHOM_WEBHOOK_SECRET", "")


def _validate_secret(incoming_secret: str | None) -> bool:
    """Validate incoming webhook secret against configured secret value."""
    return bool(WEBHOOK_SECRET) and incoming_secret == WEBHOOK_SECRET


def _validate_payload(payload: Dict[str, Any]) -> Tuple[bool, str, MeetingRecord]:
    """Normalize payload and ensure required values exist."""
    record = MeetingRecord.from_payload(payload)

    if not record.recording_url:
        return False, "Missing required field: recording_url", record
    if not record.meeting_title:
        return False, "Missing required field: meeting_title", record
    if not record.transcript_text:
        return False, "Missing required field: transcript_text", record

    return True, "", record


@app.route("/api/fathom/callback", methods=["GET", "POST", "OPTIONS"])
def fathom_callback() -> tuple:
    """Receive Fathom callback JSON, verify, and persist meeting details."""
    if request.method == "GET":
        return (
            jsonify(
                {
                    "message": "Fathom callback listener is running",
                    "endpoint": "/api/fathom/callback",
                    "allowed_method": "POST",
                }
            ),
            200,
        )

    if request.method == "OPTIONS":
        return jsonify({"message": "OK"}), 200

    incoming_secret = request.headers.get(WEBHOOK_SECRET_HEADER)
    if not _validate_secret(incoming_secret):
        abort(401, description="Unauthorized: Secret does not match")

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    is_valid, error_message, record = _validate_payload(payload)
    if not is_valid:
        return jsonify({"error": error_message}), 400

    append_meeting(record)

    return (
        jsonify(
            {
                "message": "Meeting callback received",
                "recording_url": record.recording_url,
                "meeting_title": record.meeting_title,
            }
        ),
        200,
    )


if __name__ == "__main__":
    # Keep listener isolated for modular local usage under /ai_engine.
    app.run(host="127.0.0.1", port=5000, debug=True)
