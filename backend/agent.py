from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from groq import Groq

from models import AlertItem, RiskLevel, TaskStatus


def _parse_datetime(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


class FollowUpAgent:
    def __init__(self, model_name: str = "llama-3.1-8b-instant") -> None:
        self._model_name = model_name
        api_key = os.getenv("GROQ_API_KEY")
        self._client = Groq(api_key=api_key) if api_key else None

    def _risk_level(self, overdue_days: int, inactive_days: int) -> RiskLevel:
        if overdue_days >= 3 or inactive_days >= 7:
            return RiskLevel.high
        if overdue_days > 0 or inactive_days >= 3:
            return RiskLevel.medium
        return RiskLevel.low

    def _generate_follow_up(self, task: dict, reason: str, risk_level: RiskLevel) -> str:
        if self._client is None:
            return (
                f"Hi {task['assignee']}, quick follow-up on '{task['title']}'. {reason} "
                f"Current risk is {risk_level.value}. Please share an update and next step."
            )

        prompt = (
            "Write a short, professional follow-up message (max 40 words) for this task. "
            f"Task title: {task['title']}. Assignee: {task['assignee']}. "
            f"Reason: {reason}. Risk: {risk_level.value}."
        )
        try:
            response = self._client.chat.completions.create(
                model=self._model_name,
                temperature=0.3,
                max_tokens=80,
                messages=[
                    {"role": "system", "content": "Write concise professional follow-up messages."},
                    {"role": "user", "content": prompt},
                ],
            )
            message = (response.choices[0].message.content or "").strip()
            return message or "Please provide an update on this task."
        except Exception:
            return "Please provide an update on this task."

    def build_alerts(self, tasks: list[dict]) -> list[AlertItem]:
        now = datetime.now(timezone.utc)
        alerts: list[AlertItem] = []

        for task in tasks:
            if task["status"] == TaskStatus.completed.value:
                continue

            reasons: list[str] = []
            alert_type = ""

            deadline = _parse_datetime(task["deadline"])
            overdue_days = 0
            if deadline and deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            if deadline and deadline < now:
                overdue_days = (now - deadline).days
                reasons.append("Task is overdue")
                alert_type = "overdue"

            updated_at = _parse_datetime(task["updated_at"])
            inactive_days = 0
            if updated_at and updated_at.tzinfo is None:
                updated_at = updated_at.replace(tzinfo=timezone.utc)
            if updated_at and updated_at < now - timedelta(days=3):
                inactive_days = (now - updated_at).days
                reasons.append(f"No updates in {inactive_days} days")
                if not alert_type:
                    alert_type = "inactive"

            if not reasons:
                continue

            risk = self._risk_level(overdue_days=overdue_days, inactive_days=inactive_days)
            reason = "; ".join(reasons)
            follow_up = self._generate_follow_up(task, reason, risk)

            alerts.append(
                AlertItem(
                    task_id=task["id"],
                    title=task["title"],
                    type=alert_type,
                    risk_level=risk,
                    reason=reason,
                    follow_up_message=follow_up,
                )
            )

        return alerts
