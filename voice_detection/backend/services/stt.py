"""
Speech-to-Text Service Module
Integrates Faster-Whisper for efficient audio transcription.
Handles transcription with proper error handling and logging.
"""

import logging
from typing import Optional
from pathlib import Path

# Import STT components
from transcription_engine import TranscriptionEngine
from config import PRIMARY_LANGUAGE

# Audio processor will be imported lazily if needed
_AUDIO_PROCESSOR_IMPORT_ATTEMPTED = False
_AUDIO_PROCESSOR_AVAILABLE = False
AudioProcessor = None

# ============================================================================
# LOGGING SETUP
# ============================================================================
logger = logging.getLogger(__name__)

# ============================================================================
# GLOBAL INSTANCES (Initialized Once for Efficiency)
# ============================================================================
# These are created once at startup and reused across requests
# This avoids loading heavy models multiple times
_transcription_engine: Optional[TranscriptionEngine] = None
_audio_processor: Optional[object] = None


def _try_load_audio_processor():
    """
    Attempt to load audio processor lazily (deferred import).
    Returns True if successful, False otherwise.
    """
    global _AUDIO_PROCESSOR_IMPORT_ATTEMPTED, _AUDIO_PROCESSOR_AVAILABLE, AudioProcessor
    
    if _AUDIO_PROCESSOR_IMPORT_ATTEMPTED:
        return _AUDIO_PROCESSOR_AVAILABLE
    
    _AUDIO_PROCESSOR_IMPORT_ATTEMPTED = True
    
    try:
        from audio_processor import AudioProcessor as AP
        AudioProcessor = AP
        _AUDIO_PROCESSOR_AVAILABLE = True
        logger.info("✅ Audio processor module available")
        return True
    except ImportError as e:
        logger.warning(f"⚠️ Audio processor not available: {str(e)}. Using direct file transcription.")
        _AUDIO_PROCESSOR_AVAILABLE = False
        return False


def _initialize_engines():
    """
    Initialize transcription engine and optionally audio processor on first use.
    Uses lazy initialization to avoid startup delays.
    """
    global _transcription_engine, _audio_processor, _AUDIO_PROCESSOR_AVAILABLE
    
    if _transcription_engine is None:
        logger.info("🚀 Initializing Faster-Whisper transcription engine...")
        try:
            _transcription_engine = TranscriptionEngine()
            logger.info("✅ Transcription engine initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize transcription engine: {str(e)}")
            raise
    
    if _audio_processor is None and _AUDIO_PROCESSOR_AVAILABLE:
        logger.info("🎵 Initializing audio processor...")
        try:
            _audio_processor = AudioProcessor()
            logger.info("✅ Audio processor initialized successfully")
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize audio processor: {str(e)}. Continuing without audio preprocessing.")
            _AUDIO_PROCESSOR_AVAILABLE = False


def speech_to_text(file_path: str, language: Optional[str] = PRIMARY_LANGUAGE) -> str:
    """
    Convert audio file to text using Faster-Whisper transcription engine.
    
    This function handles:
    1. Engine initialization (lazy loading on first call)
    2. Audio validation
    3. Transcription using Faster-Whisper
    4. Error handling and logging
    
    Args:
        file_path: Path to the audio file
                  Supported formats: .wav, .mp3, .m4a, .webm, .mp4, .ogg, .flac
        language: Language code for transcription (default: Hindi from config)
                 Examples: "en" for English, "hi" for Hindi, None for auto-detect
    
    Returns:
        str: Extracted text from the audio file
        
    Raises:
        FileNotFoundError: If the audio file doesn't exist
        RuntimeError: If transcription fails
        
    Example:
        >>> text = speech_to_text("uploads/meeting.webm")
        >>> print(text)
        "We should finish backend by Friday"
    """
    try:
        # Step 0: Try to load audio processor if not attempted yet
        _try_load_audio_processor()
        
        # Step 1: Initialize engines if not already done
        _initialize_engines()
        
        # Step 2: Validate file exists
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            logger.error(f"❌ Audio file not found: {file_path}")
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        logger.info(f"🎙️ Starting transcription for: {file_path_obj.name}")
        
        # Step 3: Transcribe audio using Faster-Whisper
        # Direct transcription without preprocessing for compatibility
        # To enable preprocessing in future:
        # - Ensure torchaudio is properly installed
        # - Uncomment the lines below:
        # if _AUDIO_PROCESSOR_AVAILABLE and _audio_processor:
        #     audio, sr = _audio_processor.load_audio(file_path)
        #     audio = _audio_processor.reduce_noise_spectral_gating(audio, sr)
        #     ... (save preprocessed audio and use that path)
        
        transcription_result = _transcription_engine.transcribe(
            str(file_path),
            language=language,
            task="transcribe"  # Other option: "translate" (to English)
        )
        
        # Step 4: Extract and validate transcribed text
        transcribed_text = transcription_result.text.strip()
        
        if not transcribed_text:
            logger.warning(f"⚠️ No speech detected in: {file_path_obj.name}")
            return ""
        
        # Step 5: Log success with details
        logger.info(
            f"✅ Transcription complete: {file_path_obj.name} | "
            f"Language: {transcription_result.language} | "
            f"Confidence: {transcription_result.confidence:.2f} | "
            f"Duration: {transcription_result.processing_time_seconds:.2f}s"
        )
        logger.debug(f"📝 Transcribed text: {transcribed_text[:100]}...")
        
        return transcribed_text
        
    except FileNotFoundError:
        logger.error(f"❌ File not found: {file_path}")
        raise
    except Exception as e:
        logger.error(f"❌ Error during transcription: {str(e)}", exc_info=True)
        raise RuntimeError(f"Transcription failed: {str(e)}")
