from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

from models import TaskExtractionItem

DB_PATH = Path(__file__).parent / "tasks.db"

_conn: sqlite3.Connection | None = None
_lock = Lock()

LEGACY_MEETING_LINK_MAP = {
    "https://fathom.video/share/demo-recording-001": "https://example.com/#flowstate-demo-recording-001",
    "https://fathom.video/share/step5-expected-keys": "https://example.com/#flowstate-step5-expected-keys",
    "https://fathom.video/share/step6-alt-keys": "https://example.com/#flowstate-step6-alt-keys",
}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_meeting_link(meeting_link: str) -> str:
    normalized = (meeting_link or "").strip()
    return LEGACY_MEETING_LINK_MAP.get(normalized, normalized)


def get_connection() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
    return _conn


def init_db() -> None:
    conn = get_connection()
    with _lock:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                assignee TEXT NOT NULL,
                deadline TEXT NOT NULL,
                priority TEXT NOT NULL,
                confidence REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'open',
                source_type TEXT NOT NULL,
                source_text TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT '',
                is_fallback INTEGER NOT NULL DEFAULT 0,
                risk_level TEXT NOT NULL DEFAULT 'low',
                follow_up_message TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        # Backward-compatible migration for existing DBs created before `source` existed.
        columns = {row["name"] for row in conn.execute("PRAGMA table_info(tasks)").fetchall()}
        if "source" not in columns:
            conn.execute("ALTER TABLE tasks ADD COLUMN source TEXT NOT NULL DEFAULT ''")
        if "is_fallback" not in columns:
            conn.execute("ALTER TABLE tasks ADD COLUMN is_fallback INTEGER NOT NULL DEFAULT 0")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS meetings (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                platform TEXT NOT NULL,
                meeting_link TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        for old_link, new_link in LEGACY_MEETING_LINK_MAP.items():
            conn.execute(
                "UPDATE meetings SET meeting_link = ? WHERE meeting_link = ?",
                (new_link, old_link),
            )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id TEXT PRIMARY KEY,
                email_notifications INTEGER NOT NULL DEFAULT 1,
                voice_reminder INTEGER NOT NULL DEFAULT 1,
                reminder_minutes INTEGER NOT NULL DEFAULT 10,
                updated_at TEXT NOT NULL
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id TEXT PRIMARY KEY,
                name TEXT NOT NULL DEFAULT '',
                mobile TEXT NOT NULL DEFAULT '',
                avatar_data_url TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL
            )
            """
        )

        conn.commit()


def row_to_task_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "assignee": row["assignee"],
        "deadline": row["deadline"],
        "priority": row["priority"],
        "confidence": row["confidence"],
        "status": row["status"],
        "source_type": row["source_type"],
        "source_text": row["source_text"],
        "source": row["source"],
        "is_fallback": bool(row["is_fallback"]),
        "risk_level": row["risk_level"],
        "follow_up_message": row["follow_up_message"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def create_task(task: TaskExtractionItem, source_type: str, source_text: str) -> dict[str, Any]:
    now = _utc_now()
    conn = get_connection()
    with _lock:
        cursor = conn.execute(
            """
            INSERT INTO tasks (
                title, description, assignee, deadline, priority,
                confidence, status, source_type, source_text, source, is_fallback,
                risk_level, follow_up_message, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, 'low', '', ?, ?)
            """,
            (
                task.title,
                task.description,
                task.assignee,
                task.deadline,
                task.priority.value,
                task.confidence,
                source_type,
                source_text,
                task.source,
                1 if task.is_fallback else 0,
                now,
                now,
            ),
        )
        conn.commit()
        task_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()

    if row is None:
        raise RuntimeError("Failed to fetch inserted task")
    return row_to_task_dict(row)


def list_tasks() -> list[dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM tasks ORDER BY created_at DESC").fetchall()
    return [row_to_task_dict(row) for row in rows]


def count_tasks(include_fallback: bool = True) -> int:
    conn = get_connection()
    if include_fallback:
        row = conn.execute("SELECT COUNT(*) AS count FROM tasks").fetchone()
    else:
        row = conn.execute("SELECT COUNT(*) AS count FROM tasks WHERE is_fallback = 0").fetchone()
    return int(row["count"] if row else 0)


def count_fallback_tasks() -> int:
    conn = get_connection()
    row = conn.execute("SELECT COUNT(*) AS count FROM tasks WHERE is_fallback = 1").fetchone()
    return int(row["count"] if row else 0)


def delete_fallback_tasks() -> int:
    conn = get_connection()
    with _lock:
        cursor = conn.execute("DELETE FROM tasks WHERE is_fallback = 1")
        conn.commit()
        return int(cursor.rowcount or 0)


def get_task(task_id: int) -> dict[str, Any] | None:
    conn = get_connection()
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return row_to_task_dict(row) if row else None


def update_task(task_id: int, fields: dict[str, Any]) -> dict[str, Any] | None:
    if not fields:
        return get_task(task_id)

    allowed = {"status", "assignee", "deadline", "title", "description", "priority"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return get_task(task_id)

    updates["updated_at"] = _utc_now()

    set_clause = ", ".join([f"{col} = ?" for col in updates.keys()])
    values = list(updates.values()) + [task_id]

    conn = get_connection()
    with _lock:
        conn.execute(f"UPDATE tasks SET {set_clause} WHERE id = ?", values)
        conn.commit()
    return get_task(task_id)


def update_agent_fields(task_id: int, risk_level: str, follow_up_message: str) -> None:
    conn = get_connection()
    with _lock:
        conn.execute(
            """
            UPDATE tasks
            SET risk_level = ?, follow_up_message = ?, updated_at = ?
            WHERE id = ?
            """,
            (risk_level, follow_up_message, _utc_now(), task_id),
        )
        conn.commit()


def row_to_meeting_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row["title"],
        "date": row["date"],
        "time": row["time"],
        "platform": row["platform"],
        "meeting_link": _normalize_meeting_link(str(row["meeting_link"])),
        "created_at": row["created_at"],
    }


def list_meetings(user_id: str) -> list[dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT * FROM meetings
        WHERE user_id = ?
        ORDER BY date ASC, time ASC
        """,
        (user_id,),
    ).fetchall()
    return [row_to_meeting_dict(row) for row in rows]


def create_meeting(
    meeting_id: str,
    user_id: str,
    title: str,
    date: str,
    time: str,
    platform: str,
    meeting_link: str,
) -> dict[str, Any]:
    now = _utc_now()
    normalized_link = _normalize_meeting_link(meeting_link)
    conn = get_connection()
    with _lock:
        conn.execute(
            """
            INSERT INTO meetings (id, user_id, title, date, time, platform, meeting_link, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (meeting_id, user_id, title, date, time, platform, normalized_link, now),
        )
        conn.commit()

    row = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    if row is None:
        raise RuntimeError("Failed to fetch inserted meeting")
    return row_to_meeting_dict(row)


def get_meeting(meeting_id: str) -> dict[str, Any] | None:
    conn = get_connection()
    row = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    return row_to_meeting_dict(row) if row else None


def update_meeting(
    meeting_id: str,
    user_id: str,
    title: str,
    date: str,
    time: str,
    platform: str,
    meeting_link: str,
) -> dict[str, Any] | None:
    conn = get_connection()
    normalized_link = _normalize_meeting_link(meeting_link)
    with _lock:
        conn.execute(
            """
            UPDATE meetings
            SET title = ?, date = ?, time = ?, platform = ?, meeting_link = ?
            WHERE id = ? AND user_id = ?
            """,
            (title, date, time, platform, normalized_link, meeting_id, user_id),
        )
        conn.commit()

    return get_meeting(meeting_id)


def delete_meeting(meeting_id: str, user_id: str) -> bool:
    conn = get_connection()
    with _lock:
        cursor = conn.execute("DELETE FROM meetings WHERE id = ? AND user_id = ?", (meeting_id, user_id))
        conn.commit()
        return int(cursor.rowcount or 0) > 0


def get_user_settings(user_id: str) -> dict[str, Any]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user_id,)).fetchone()

    if row is None:
        return {
            "user_id": user_id,
            "emailNotifications": True,
            "voiceReminder": True,
            "reminderMinutes": 10,
        }

    return {
        "user_id": row["user_id"],
        "emailNotifications": bool(row["email_notifications"]),
        "voiceReminder": bool(row["voice_reminder"]),
        "reminderMinutes": int(row["reminder_minutes"]),
    }


def upsert_user_settings(user_id: str, email_notifications: bool, voice_reminder: bool, reminder_minutes: int) -> dict[str, Any]:
    conn = get_connection()
    with _lock:
        conn.execute(
            """
            INSERT INTO user_settings (user_id, email_notifications, voice_reminder, reminder_minutes, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id)
            DO UPDATE SET
                email_notifications = excluded.email_notifications,
                voice_reminder = excluded.voice_reminder,
                reminder_minutes = excluded.reminder_minutes,
                updated_at = excluded.updated_at
            """,
            (user_id, 1 if email_notifications else 0, 1 if voice_reminder else 0, reminder_minutes, _utc_now()),
        )
        conn.commit()

    return get_user_settings(user_id)


def get_user_profile(user_id: str) -> dict[str, Any]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()

    if row is None:
        return {
            "user_id": user_id,
            "name": "",
            "mobile": "",
            "avatarDataUrl": "",
        }

    return {
        "user_id": row["user_id"],
        "name": row["name"],
        "mobile": row["mobile"],
        "avatarDataUrl": row["avatar_data_url"],
    }


def upsert_user_profile(user_id: str, name: str, mobile: str, avatar_data_url: str) -> dict[str, Any]:
    conn = get_connection()
    with _lock:
        conn.execute(
            """
            INSERT INTO user_profiles (user_id, name, mobile, avatar_data_url, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id)
            DO UPDATE SET
                name = excluded.name,
                mobile = excluded.mobile,
                avatar_data_url = excluded.avatar_data_url,
                updated_at = excluded.updated_at
            """,
            (user_id, name, mobile, avatar_data_url, _utc_now()),
        )
        conn.commit()

    return get_user_profile(user_id)
