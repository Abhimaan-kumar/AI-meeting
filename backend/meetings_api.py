from pydantic import BaseModel
from typing import List


class Meeting(BaseModel):
    id: str
    title: str
    date: str
    time: str
    platform: str
    meeting_link: str
    user_email: str


# Structure-ready endpoints for future integration.
# Wiring into FastAPI app is intentionally deferred.
meeting_store: List[Meeting] = []


def create_meeting(payload: Meeting) -> Meeting:
    meeting_store.append(payload)
    return payload


def get_meetings() -> List[Meeting]:
    return meeting_store
