from __future__ import annotations

import logging
import os
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

import requests
from openai import OpenAI
from groq import Groq
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import database
from agent import FollowUpAgent
from audio import AudioTranscriber
from extract import GroqTaskExtractor
from models import (
    AlertItem,
    AssistantChatRequest,
    AssistantChatResponse,
    MeetingCreateRequest,
    MeetingRecord,
    MeetingUpdateRequest,
    ProcessResult,
    ProcessTextRequest,
    TaskRecord,
    UpdateTaskRequest,
    UserProfileRecord,
    UserSettingsRecord,
)

app = FastAPI(title="AI Meeting-to-Action Backend", version="0.1.0")
logger = logging.getLogger(__name__)


def _load_root_env_file() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"").strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_root_env_file()

SUPABASE_URL = (
    os.getenv("SUPABASE_URL")
    or os.getenv("VITE_SUPABASE_URL")
    or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
)
SUPABASE_ANON_KEY = (
    os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("VITE_SUPABASE_ANON_KEY")
    or os.getenv("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "mistralai/mistral-7b-instruct-v0.2")
GROQ_ASSISTANT_MODEL = os.getenv("GROQ_ASSISTANT_MODEL", "llama-3.1-8b-instant")
ASSISTANT_SYSTEM_PROMPT = "You are a concise productivity assistant for meeting follow-ups, blockers, reminders, and next actions."

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_transcriber: AudioTranscriber | None = None
_extractor: GroqTaskExtractor | None = None
_agent: FollowUpAgent | None = None
_assistant_client: OpenAI | None = None
_assistant_groq_client: Groq | None = None


def get_authenticated_user_id(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> str:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(status_code=500, detail="Backend auth is not configured")

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid bearer token")

    try:
        res = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
            },
            timeout=10,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=503, detail=f"Auth provider unreachable: {exc}") from exc

    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user_id = res.json().get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return str(user_id)


def get_assistant_client() -> OpenAI:
    global _assistant_client

    nvidia_api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not nvidia_api_key:
        raise HTTPException(status_code=500, detail="NVIDIA_API_KEY is not configured on backend")

    if _assistant_client is None:
        _assistant_client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=nvidia_api_key)

    return _assistant_client


def get_assistant_groq_client() -> Groq:
    global _assistant_groq_client

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured on backend")

    if _assistant_groq_client is None:
        _assistant_groq_client = Groq(api_key=groq_api_key)

    return _assistant_groq_client


@app.on_event("startup")
def startup() -> None:
    database.init_db()


def get_transcriber() -> AudioTranscriber:
    global _transcriber
    if _transcriber is None:
        _transcriber = AudioTranscriber(model_size="base", device="cpu")
    return _transcriber


def get_extractor() -> GroqTaskExtractor:
    global _extractor
    if _extractor is None:
        _extractor = GroqTaskExtractor(model_name="llama-3.1-8b-instant")
    return _extractor


def get_agent() -> FollowUpAgent:
    global _agent
    if _agent is None:
        _agent = FollowUpAgent(model_name="llama-3.1-8b-instant")
    return _agent


def _assistant_messages(message: str) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": ASSISTANT_SYSTEM_PROMPT},
        {"role": "user", "content": message},
    ]


def _ask_nvidia_assistant(message: str) -> str | None:
    completion = get_assistant_client().chat.completions.create(
        model=NVIDIA_MODEL,
        messages=_assistant_messages(message),
        temperature=0.5,
        top_p=1,
        max_tokens=1024,
        stream=False,
    )
    return completion.choices[0].message.content if completion.choices else None


def _ask_groq_assistant(message: str) -> str | None:
    completion = get_assistant_groq_client().chat.completions.create(
        model=GROQ_ASSISTANT_MODEL,
        messages=_assistant_messages(message),
        temperature=0.5,
        max_tokens=1024,
    )
    return completion.choices[0].message.content if completion.choices else None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "Flowstate backend is running",
        "health": "/health",
        "docs": "/docs",
    }


@app.post("/process-text", response_model=ProcessResult)
def process_text(payload: ProcessTextRequest) -> ProcessResult:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text cannot be empty")

    try:
        tasks = get_extractor().extract_tasks(text)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Task extraction failed: {exc}") from exc

    if any(task.is_fallback for task in tasks):
        logger.info("Fallback triggered for /process-text transcript")

    real_tasks = [task for task in tasks if not task.is_fallback]
    fallback_tasks = [task for task in tasks if task.is_fallback]

    stored = [database.create_task(task, source_type="text", source_text=text) for task in real_tasks]
    typed_tasks = [TaskRecord.model_validate(item) for item in stored]

    now = datetime.now(timezone.utc)
    typed_tasks.extend(
        [
            TaskRecord(
                id=0,
                title=task.title,
                description=task.description,
                assignee=task.assignee,
                deadline=task.deadline,
                priority=task.priority,
                confidence=task.confidence,
                status="open",
                source_type="text",
                source_text=text,
                source=task.source,
                is_fallback=True,
                risk_level="low",
                follow_up_message="",
                created_at=now,
                updated_at=now,
            )
            for task in fallback_tasks
        ]
    )

    return ProcessResult(tasks=typed_tasks)


@app.post("/process-audio", response_model=ProcessResult)
async def process_audio(file: Annotated[UploadFile, File(...)]) -> ProcessResult:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".wav", ".mp3", ".m4a", ".ogg"}:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use WAV/MP3/M4A/OGG")

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            temp_path = Path(tmp.name)
            tmp.write(await file.read())

        transcript = get_transcriber().transcribe(temp_path)
        if not transcript:
            raise HTTPException(status_code=400, detail="No speech detected in the audio")

        tasks = get_extractor().extract_tasks(transcript)
        if any(task.is_fallback for task in tasks):
            logger.info("Fallback triggered for /process-audio transcript")

        real_tasks = [task for task in tasks if not task.is_fallback]
        fallback_tasks = [task for task in tasks if task.is_fallback]

        stored = [database.create_task(task, source_type="audio", source_text=transcript) for task in real_tasks]
        typed_tasks = [TaskRecord.model_validate(item) for item in stored]

        now = datetime.now(timezone.utc)
        typed_tasks.extend(
            [
                TaskRecord(
                    id=0,
                    title=task.title,
                    description=task.description,
                    assignee=task.assignee,
                    deadline=task.deadline,
                    priority=task.priority,
                    confidence=task.confidence,
                    status="open",
                    source_type="audio",
                    source_text=transcript,
                    source=task.source,
                    is_fallback=True,
                    risk_level="low",
                    follow_up_message="",
                    created_at=now,
                    updated_at=now,
                )
                for task in fallback_tasks
            ]
        )

        return ProcessResult(transcript=transcript, tasks=typed_tasks)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Audio processing failed: {exc}") from exc
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink(missing_ok=True)


@app.get("/tasks", response_model=list[TaskRecord])
def get_tasks() -> list[TaskRecord]:
    rows = database.list_tasks()
    return [TaskRecord.model_validate(row) for row in rows]


@app.post("/update-task", response_model=TaskRecord)
def update_task(payload: UpdateTaskRequest) -> TaskRecord:
    update_fields = payload.model_dump(exclude={"id"}, exclude_none=True)
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated = database.update_task(payload.id, update_fields)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskRecord.model_validate(updated)


@app.get("/alerts", response_model=list[AlertItem])
def get_alerts() -> list[AlertItem]:
    tasks = database.list_tasks()
    alerts = get_agent().build_alerts(tasks)

    for alert in alerts:
        database.update_agent_fields(
            task_id=alert.task_id,
            risk_level=alert.risk_level.value,
            follow_up_message=alert.follow_up_message,
        )

    return alerts


@app.get("/maintenance/task-stats")
def maintenance_task_stats() -> dict[str, int]:
    total_tasks = database.count_tasks(include_fallback=True)
    fallback_tasks = database.count_fallback_tasks()
    real_tasks = database.count_tasks(include_fallback=False)
    return {
        "total_tasks": total_tasks,
        "real_tasks": real_tasks,
        "fallback_tasks": fallback_tasks,
    }


@app.post("/maintenance/cleanup-fallback-tasks")
def cleanup_fallback_tasks() -> dict[str, int]:
    deleted = database.delete_fallback_tasks()
    logger.info("Cleanup removed %s fallback task rows", deleted)
    return {
        "deleted_fallback_tasks": deleted,
        "remaining_fallback_tasks": database.count_fallback_tasks(),
    }


@app.get("/meetings", response_model=list[MeetingRecord])
def get_meetings(
    user_id: str,
    current_user_id: Annotated[str, Depends(get_authenticated_user_id)],
) -> list[MeetingRecord]:
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    rows = database.list_meetings(user_id)
    return [MeetingRecord.model_validate(row) for row in rows]


@app.post("/meetings", response_model=MeetingRecord)
def create_meeting(
    payload: MeetingCreateRequest,
    current_user_id: Annotated[str, Depends(get_authenticated_user_id)],
) -> MeetingRecord:
    if payload.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    row = database.create_meeting(
        meeting_id=str(uuid.uuid4()),
        user_id=payload.user_id,
        title=payload.title,
        date=payload.date,
        time=payload.time,
        platform=payload.platform,
        meeting_link=payload.meeting_link,
    )
    return MeetingRecord.model_validate(row)


@app.put("/meetings/{meeting_id}", response_model=MeetingRecord)
def update_meeting(
    meeting_id: str,
    payload: MeetingUpdateRequest,
    current_user_id: Annotated[str, Depends(get_authenticated_user_id)],
) -> MeetingRecord:
    existing = database.get_meeting(meeting_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if existing["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    updated = database.update_meeting(
        meeting_id=meeting_id,
        user_id=current_user_id,
        title=payload.title,
        date=payload.date,
        time=payload.time,
        platform=payload.platform,
        meeting_link=payload.meeting_link,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return MeetingRecord.model_validate(updated)


@app.delete("/meetings/{meeting_id}")
def delete_meeting(
    meeting_id: str,
    current_user_id: Annotated[str, Depends(get_authenticated_user_id)],
) -> dict[str, bool]:
    deleted = database.delete_meeting(meeting_id=meeting_id, user_id=current_user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"deleted": True}


@app.get("/user-settings/{user_id}", response_model=UserSettingsRecord)
def get_user_settings(
    user_id: str,
    current_user_id: Annotated[str, Depends(get_authenticated_user_id)],
) -> UserSettingsRecord:
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    row = database.get_user_settings(user_id)
    return UserSettingsRecord.model_validate(row)


@app.put("/user-settings/{user_id}", response_model=UserSettingsRecord)
def update_user_settings(
    user_id: str,
    payload: UserSettingsRecord,
    current_user_id: Annotated[str, Depends(get_authenticated_user_id)],
) -> UserSettingsRecord:
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    row = database.upsert_user_settings(
        user_id=user_id,
        email_notifications=payload.emailNotifications,
        voice_reminder=payload.voiceReminder,
        reminder_minutes=payload.reminderMinutes,
    )
    return UserSettingsRecord.model_validate(row)


@app.get("/user-profile/{user_id}", response_model=UserProfileRecord)
def get_user_profile(
    user_id: str,
    current_user_id: Annotated[str, Depends(get_authenticated_user_id)],
) -> UserProfileRecord:
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    row = database.get_user_profile(user_id)
    return UserProfileRecord.model_validate(row)


@app.put("/user-profile/{user_id}", response_model=UserProfileRecord)
def update_user_profile(
    user_id: str,
    payload: UserProfileRecord,
    current_user_id: Annotated[str, Depends(get_authenticated_user_id)],
) -> UserProfileRecord:
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    row = database.upsert_user_profile(
        user_id=user_id,
        name=payload.name,
        mobile=payload.mobile,
        avatar_data_url=payload.avatarDataUrl,
    )
    return UserProfileRecord.model_validate(row)


@app.post("/assistant/chat", response_model=AssistantChatResponse)
def assistant_chat(
    payload: AssistantChatRequest,
    current_user_id: Annotated[str, Depends(get_authenticated_user_id)],
) -> AssistantChatResponse:
    _ = current_user_id

    nvidia_api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("OPENAI_API_KEY")
    groq_api_key = os.getenv("GROQ_API_KEY")

    if not nvidia_api_key and not groq_api_key:
        raise HTTPException(
            status_code=500,
            detail="No assistant provider key configured. Set NVIDIA_API_KEY or GROQ_API_KEY.",
        )

    if nvidia_api_key:
        try:
            reply = _ask_nvidia_assistant(payload.message)
            if reply:
                return AssistantChatResponse(reply=reply)
            logger.warning("NVIDIA assistant provider returned empty response; trying Groq fallback")
        except Exception as exc:
            logger.warning("NVIDIA assistant provider failed; trying Groq fallback: %s", exc)

    if groq_api_key:
        try:
            reply = _ask_groq_assistant(payload.message)
            if not reply:
                raise HTTPException(status_code=502, detail="Assistant provider returned empty response")
            return AssistantChatResponse(reply=reply)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Assistant provider call failed: {exc}") from exc

    raise HTTPException(status_code=502, detail="Assistant provider unavailable")
