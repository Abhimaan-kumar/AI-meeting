# AI Meeting-to-Action Backend - API Documentation

## Overview
Complete FastAPI backend for audio upload, validation, storage, and speech-to-text processing.

---

## Running the Server

```bash
# Install dependencies (if not already done)
pip install -r requirements.txt

# Run with uvicorn
uvicorn main.py --reload

# Server will be available at:
# http://localhost:8000
# API docs: http://localhost:8000/docs (Swagger UI)
# Alternative docs: http://localhost:8000/redoc (ReDoc)
```

---

## API Endpoints

### 1. Health Check
**Endpoint:** `GET /`

**Response (200):**
```json
{
  "status": "healthy",
  "message": "AI Meeting Backend is running 🚀"
}
```

---

### 2. Upload Audio
**Endpoint:** `POST /upload-audio`

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`
- Allowed types: `audio/webm`, `audio/mpeg`, `audio/wav`, `audio/mp4`
- Max size: 10 MB

**Success Response (200):**
```json
{
  "message": "uploaded",
  "file_path": "uploads/550e8400-e29b-41d4-a716-446655440000.webm"
}
```

**Error Responses:**
```json
// Invalid file type (400)
{
  "error": "Invalid file type: video/mp4. Allowed types: audio/webm, audio/mpeg, audio/wav, audio/mp4",
  "status_code": 400
}

// File too large (413)
{
  "error": "File size (15728640 bytes) exceeds maximum allowed size (10485760 bytes)",
  "status_code": 413
}

// Empty file (400)
{
  "error": "File is empty",
  "status_code": 400
}
```

---

### 3. Process Audio (Upload + STT)
**Endpoint:** `POST /process-audio`

**Request:**
- Same as `/upload-audio`
- Content-Type: `multipart/form-data`
- Field name: `file`

**Success Response (200):**
```json
{
  "text": "We should finish backend by Friday. Rahul take care of API.",
  "file_path": "uploads/550e8400-e29b-41d4-a716-446655440000.webm"
}
```

**Error Responses:**
Same as `/upload-audio`

---

## Testing with cURL

### Upload Audio
```bash
# Using an audio file
curl -X POST http://localhost:8000/upload-audio \
  -F "file=@/path/to/audio.webm"

# Response
curl -X POST http://localhost:8000/upload-audio \
  -F "file=@./meeting.webm"
```

### Process Audio
```bash
curl -X POST http://localhost:8000/process-audio \
  -F "file=@/path/to/audio.webm"
```

---

## Testing with Python

```python
import requests

# Upload audio
files = {'file': open('meeting.webm', 'rb')}
response = requests.post('http://localhost:8000/upload-audio', files=files)
print(response.json())

# Process audio
files = {'file': open('meeting.webm', 'rb')}
response = requests.post('http://localhost:8000/process-audio', files=files)
print(response.json())
```

---

## Testing with JavaScript/Frontend

```javascript
// Upload audio
const formData = new FormData();
formData.append('file', audioBlob, 'meeting.webm');

const uploadResponse = await fetch('http://localhost:8000/upload-audio', {
  method: 'POST',
  body: formData
});
const uploadData = await uploadResponse.json();
console.log(uploadData);

// Process audio
const processResponse = await fetch('http://localhost:8000/process-audio', {
  method: 'POST',
  body: formData
});
const processData = await processResponse.json();
console.log(processData.text);
```

---

## File Structure

```
backend/
├── main.py                      # FastAPI app with endpoints
├── services/
│   ├── __init__.py              # Package init
│   ├── audio.py                 # Audio upload/validation logic
│   │  ├── validate_file_type()
│   │  └── save_audio_file()
│   └── stt.py                   # Speech-to-text service
│      └── speech_to_text(file_path)
├── uploads/                     # Uploaded files directory
└── requirements.txt             # Dependencies
```

---

## Configuration

### File Size Limit
Edit in `services/audio.py`:
```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
```

### Allowed Audio Types
Edit in `services/audio.py`:
```python
ALLOWED_AUDIO_TYPES = {"audio/webm", "audio/mpeg", "audio/wav", "audio/mp4"}
```

### CORS Origins
Edit in `main.py`:
```python
# For production, change from "*" to specific origins
allow_origins=["http://localhost:3000", "https://yourdomain.com"]
```

---

## Future Enhancements

### Speech-to-Text Integration
Replace dummy implementation in `services/stt.py`:

**OpenAI Whisper:**
```python
def speech_to_text(file_path: str) -> str:
    import openai
    with open(file_path, 'rb') as audio_file:
        transcript = openai.Audio.transcribe("whisper-1", audio_file)
    return transcript['text']
```

**Google Cloud Speech-to-Text:**
```python
from google.cloud import speech
def speech_to_text(file_path: str) -> str:
    client = speech.SpeechClient()
    # Implementation here
```

---

## Logging

The application logs:
- Successfully uploaded files: `✅ File uploaded: {filename} (Size: {size} bytes)`
- Processing start: `🎙️ Processing audio: {file_path}`
- Transcription: `📝 Transcribed: {text}`
- Errors: `❌ Error: {message}`

View logs in terminal output.

---

## Error Handling

- **400 Bad Request:** Invalid file type or empty file
- **413 Payload Too Large:** File exceeds 10MB
- **500 Internal Server Error:** Server-side processing error

All errors return JSON with error message and status code.

---

## Production Deployment Checklist

- [ ] Set specific CORS origins instead of "*"
- [ ] Add environment variables for file paths
- [ ] Implement database for metadata tracking
- [ ] Add authentication/API keys
- [ ] Enable HTTPS/SSL
- [ ] Set up proper logging (not just print)
- [ ] Add rate limiting
- [ ] Configure uploads directory outside source code
- [ ] Implement file cleanup/expiration
- [ ] Add STT provider integration (Whisper, etc.)
- [ ] Set up monitoring and error tracking

---

## Questions?

See inline code comments in:
- `main.py` - API endpoints and middleware
- `services/audio.py` - File handling logic
- `services/stt.py` - Speech-to-text interface
