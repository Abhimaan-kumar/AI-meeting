"""
Configuration settings for the Speech-to-Text transcription module.
Handles model selection, language settings, and processing parameters.
"""

import os
from pathlib import Path

# ==================== Model Configuration ====================
# Using faster-whisper for reduced latency (runs on CPU/GPU efficiently)
# For production-grade accuracy, use 'large-v3'; for speed, use 'small' or 'medium'
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")  # Options: tiny, base, small, medium, large-v3
DEVICE = os.getenv("DEVICE", "cpu")  # Options: cpu, cuda
COMPUTE_TYPE = os.getenv("COMPUTE_TYPE", "int8")  # Options: default, int8, int16, float16, float32

# ==================== Language Configuration ====================
# Hinglish support: Hindi (hi) + English (en)
# Whisper automatically detects language, but we can hint at it
SUPPORTED_LANGUAGES = ["en", "hi"]  # English and Hindi
PRIMARY_LANGUAGE = os.getenv("PRIMARY_LANGUAGE", "hi")  # Bias detection towards Hindi

# ==================== Audio Processing Configuration ====================
SAMPLE_RATE = 16000  # Standard sample rate for audio processing (16 kHz)
CHUNK_DURATION_MS = 500  # Duration of each audio chunk for VAD processing
MAX_FILE_SIZE_MB = 100  # Maximum file size to accept (prevents memory overload)

# ==================== Noise Reduction Configuration ====================
# Noise gate: Remove anything quieter than this threshold (in dB)
NOISE_GATE_DB = -40

# Normalization target loudness (LUFS - Loudness Units relative to Full Scale)
TARGET_LOUDNESS_LUFS = -20

# Enable VAD (Voice Activity Detection) to remove silence
ENABLE_VAD = True
VAD_THRESHOLD = 0.5  # Confidence threshold for voice detection (0-1)

# ==================== Directories ====================
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
MODEL_CACHE_DIR = Path.home() / ".cache" / "whisper"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
MODEL_CACHE_DIR.mkdir(exist_ok=True, parents=True)

# ==================== API Configuration ====================
MAX_WORKERS = 4  # Number of concurrent transcription tasks
TRANSCRIPTION_TIMEOUT_SECONDS = 300  # Max time to wait for transcription

# ==================== Hinglish Context ====================
# Custom vocabulary/terms that might be missed in Hinglish audio
HINGLISH_COMMON_TERMS = {
    "namaste": "Namaste",
    "dhanyavaad": "Dhanyavaad",
    "haan": "Haan",
    "nahi": "Nahi",
    "bilkul": "Bilkul",
    "theek hai": "Theek hai"
}

print(f"[CONFIG] Whisper Model: {WHISPER_MODEL}")
print(f"[CONFIG] Device: {DEVICE}")
print(f"[CONFIG] Sample Rate: {SAMPLE_RATE} Hz")
print(f"[CONFIG] VAD Enabled: {ENABLE_VAD}")