# Quick Start Guide - AI Meeting-to-Action Backend

## Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `python-multipart` - For form data handling

### 2. Run the Server
```bash
cd backend
uvicorn main.py --reload
```

Server will start at: **http://localhost:8000**

### 3. Access Endpoints
- **API Documentation:** http://localhost:8000/docs (Swagger UI)
- **Alternative docs:** http://localhost:8000/redoc (ReDoc)
- **Health check:** http://localhost:8000/

---

## Available Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | Health check |
| POST | `/upload-audio` | Upload audio file only |
| POST | `/process-audio` | Upload audio + transcribe |

---

## Testing

### Option 1: FastAPI Swagger UI (Recommended for first test)
1. Go to: http://localhost:8000/docs
2. Click "Try it out" on any endpoint
3. Click "Choose File" to upload an audio file
4. Click "Execute"

### Option 2: Using Python Test Script
```bash
cd backend
python test_api.py
```

### Option 3: Using cURL
```bash
# Upload audio
curl -X POST http://localhost:8000/upload-audio \
  -F "file=@path/to/audio.webm"

# Process audio (upload + STT)
curl -X POST http://localhost:8000/process-audio \
  -F "file=@path/to/audio.webm"
```

### Option 4: JavaScript/Frontend
```javascript
const formData = new FormData();
const audioBlob = /* your audio blob */;
formData.append('file', audioBlob, 'meeting.webm');

const response = await fetch('http://localhost:8000/process-audio', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.text);  // Transcribed text
```

---

## Project Structure

```
backend/
├── main.py                  # FastAPI app (endpoints, middleware)
├── services/
│   ├── __init__.py
│   ├── audio.py            # File upload & validation
│   └── stt.py              # Speech-to-text (dummy implementation)
├── uploads/                # Uploaded files storage
├── requirements.txt        # Python dependencies
├── test_api.py            # Test script
└── venv/                  # Virtual environment
```

---

## Code Organization

### Services Design

**`services/audio.py`** - File handling
- `validate_file_type(file)` - Validates audio file type
- `save_audio_file(file)` - Saves file with UUID naming

**`services/stt.py`** - Speech-to-text
- `speech_to_text(file_path)` - Converts audio to text (currently dummy)

---

## Features

✅ **Phase 1-7 Complete:**
- Audio upload with validation
- File size limits (10MB)
- UUID-based unique filenames
- Multipart form-data support
- CORS middleware (all origins)
- Health check endpoint
- Error handling with details
- Logging for debugging
- Modular service architecture
- FastAPI Swagger documentation

---

## Configuration

### File Size Limit
Edit: `services/audio.py` line 10
```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # Change value here
```

### Allowed Audio Types
Edit: `services/audio.py` line 11
```python
ALLOWED_AUDIO_TYPES = {"audio/webm", "audio/mpeg", "audio/wav", "audio/mp4"}
```

### CORS Origins (Production)
Edit: `main.py` line 23
```python
allow_origins=["http://localhost:3000", "https://yourdomain.com"]
```

---

## Common Issues

### Issue: "ModuleNotFoundError: No module named 'fastapi'"
**Solution:** Install dependencies with `pip install -r requirements.txt`

### Issue: "Port 8000 already in use"
**Solution:** Use a different port: `uvicorn main.py --port 8001 --reload`

### Issue: File not found after upload
**Solution:** Check `backend/uploads/` directory. Files are saved there with UUID names.

### Issue: "Invalid file type" error
**Solution:** Use audio files only. Supported: .webm, .mpeg, .wav, .mp4

---

## Next Steps

### 1. Integrate Real STT
Replace dummy in `services/stt.py`:
```python
# Example: OpenAI Whisper
def speech_to_text(file_path: str) -> str:
    import openai
    with open(file_path, 'rb') as audio_file:
        transcript = openai.Audio.transcribe("whisper-1", audio_file)
    return transcript['text']
```

### 2. Add Database
Track uploads and transcriptions in a database (SQLite, PostgreSQL, etc.)

### 3. Deploy to Production
- Set specific CORS origins
- Use environment variables for configuration
- Add authentication
- Enable HTTPS
- Set up monitoring

---

## Useful Commands

```bash
# Run with specific port
uvicorn main.py --port 8001 --reload

# Run without auto-reload (production)
uvicorn main.py

# Run with workers (production)
uvicorn main.py --workers 4

# Check if port is in use (Windows)
netstat -ano | findstr :8000

# Kill process on port 8000 (Windows)
taskkill /PID <PID> /F
```

---

## API Response Examples

### Success Response (200)
```json
{
  "message": "uploaded",
  "file_path": "uploads/550e8400-e29b-41d4-a716-446655440000.webm"
}
```

### Error Response (400)
```json
{
  "error": "Invalid file type: video/mp4. Allowed types: audio/webm, audio/mpeg, audio/wav, audio/mp4",
  "status_code": 400
}
```

---

## Support

For help:
1. Check `API_DOCUMENTATION.md` for full API details
2. Review inline code comments in `main.py` and `services/`
3. Check `test_api.py` for testing examples
4. Visit http://localhost:8000/docs for interactive API documentation
