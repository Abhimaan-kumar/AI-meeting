from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Priority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class TaskStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskExtractionItem(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = ""
    assignee: str = "Unassigned"
    deadline: str = ""
    priority: Priority = Priority.medium
    confidence: float = Field(0.5, ge=0.0, le=1.0)
    source: str = ""
    is_fallback: bool = False


class TaskExtractionResponse(BaseModel):
    tasks: list[TaskExtractionItem] = Field(default_factory=list)


class ProcessTextRequest(BaseModel):
    text: str = Field(..., min_length=1)


class UpdateTaskRequest(BaseModel):
    id: int
    status: Optional[TaskStatus] = None
    assignee: Optional[str] = None
    deadline: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None


class TaskRecord(BaseModel):
    id: int
    title: str
    description: str
    assignee: str
    deadline: str
    priority: Priority
    confidence: float
    status: TaskStatus
    source_type: str
    source_text: str
    source: str = ""
    is_fallback: bool = False
    risk_level: RiskLevel
    follow_up_message: str
    created_at: datetime
    updated_at: datetime


class AlertItem(BaseModel):
    task_id: int
    title: str
    type: str
    risk_level: RiskLevel
    reason: str
    follow_up_message: str


class ProcessResult(BaseModel):
    transcript: Optional[str] = None
    tasks: list[TaskRecord] = Field(default_factory=list)


class MeetingRecord(BaseModel):
    id: str
    user_id: str
    title: str
    date: str
    time: str
    platform: str
    meeting_link: str
    created_at: datetime


class MeetingCreateRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    date: str = Field(..., min_length=1)
    time: str = Field(..., min_length=1)
    platform: str = Field(..., min_length=1)
    meeting_link: str = Field(..., min_length=1)


class MeetingUpdateRequest(BaseModel):
    title: str = Field(..., min_length=1)
    date: str = Field(..., min_length=1)
    time: str = Field(..., min_length=1)
    platform: str = Field(..., min_length=1)
    meeting_link: str = Field(..., min_length=1)


class UserSettingsRecord(BaseModel):
    user_id: str
    emailNotifications: bool = True
    voiceReminder: bool = True
    reminderMinutes: int = 10


class UserProfileRecord(BaseModel):
    user_id: str
    name: str = ""
    mobile: str = ""
    avatarDataUrl: str = ""


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class AssistantChatResponse(BaseModel):
    reply: str
