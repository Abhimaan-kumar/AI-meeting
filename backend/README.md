# Flowstate AI Backend

FastAPI backend for meetings, extraction, follow-up, profile/settings, and assistant chat.

## Setup

1. Open terminal in backend folder.
2. Create and activate virtual environment.

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Required Environment Variables

The backend reads root .env automatically.

- VITE_SUPABASE_URL (or SUPABASE_URL)
- VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)
- GROQ_API_KEY
- NVIDIA_API_KEY

Optional:

- NVIDIA_BASE_URL
- NVIDIA_MODEL

## Run

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## API Summary

Public/General:

- GET /health
- POST /process-text
- POST /process-audio
- GET /tasks
- POST /update-task
- GET /alerts

Auth-protected (Supabase bearer token required):

- GET /meetings
- POST /meetings
- PUT /meetings/{meeting_id}
- DELETE /meetings/{meeting_id}
- GET /user-settings/{user_id}
- PUT /user-settings/{user_id}
- GET /user-profile/{user_id}
- PUT /user-profile/{user_id}
- POST /assistant/chat

## Notes

- SQLite file is backend/tasks.db.
- If assistant returns provider failure, check NVIDIA_API_KEY and restart backend.
- If protected endpoints return 401, user session token is missing/expired.
