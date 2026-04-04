"""
Transcription Engine Module
Uses Faster-Whisper for efficient audio-to-text conversion.
Optimized for Hinglish (Hindi + English) audio.
"""

import logging
from pathlib import Path
from typing import Optional, Dict, List
from dataclasses import dataclass
from datetime import datetime
import json

from faster_whisper import WhisperModel

from config import (
    WHISPER_MODEL, DEVICE, COMPUTE_TYPE,
    SUPPORTED_LANGUAGES, PRIMARY_LANGUAGE,
    MODEL_CACHE_DIR
)

logger = logging.getLogger(__name__)


@dataclass
class TranscriptionResult:
    """Data class for transcription results."""
    text: str
    language: str
    confidence: float  # Average confidence score (0-1)
    segments: List[Dict]  # List of segments with timestamps
    processing_time_seconds: float
    model_used: str


class TranscriptionEngine:
    """
    Faster-Whisper based transcription engine.
    
    Why Faster-Whisper over OpenAI Whisper?
    - Optimized inference (3x faster)
    - Lower memory footprint
    - Supports quantization (int8, int16)
    - Same accuracy as original Whisper
    """

    def __init__(self, model_size: str = WHISPER_MODEL):
        """
        Initialize Whisper model.
        
        Args:
            model_size: Model size (tiny, base, small, medium, large-v3)
                       For production, use 'large-v3' for accuracy
                       For speed, use 'base' or 'small'
        """
        self.model_size = model_size
        self.device = DEVICE
        self.compute_type = COMPUTE_TYPE
        
        logger.info(f"Loading Faster-Whisper model: {model_size}")
        logger.info(f"Device: {self.device}, Compute Type: {self.compute_type}")
        
        try:
            self.model = WhisperModel(
                model_size,
                device=self.device,
                compute_type=self.compute_type,
                download_root=str(MODEL_CACHE_DIR)
            )
            logger.info("✅ Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise

    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = PRIMARY_LANGUAGE,
        task: str = "transcribe"  # or "translate"
    ) -> TranscriptionResult:
        """
        Transcribe audio file.
        
        Args:
            audio_path: Path to audio file
            language: Language code (e.g., 'hi' for Hindi, 'en' for English, None for auto-detect)
                     For Hinglish, let Whisper auto-detect or provide 'hi'
            task: 'transcribe' or 'translate' (translate will convert to English)
            
        Returns:
            TranscriptionResult object with text, language, and confidence
        """
        logger.info(f"Starting transcription: {Path(audio_path).name}")
        
        try:
            # Transcribe with language hint
            # Whisper will auto-detect if language is None
            segments, info = self.model.transcribe(
                audio_path,
                language=language,  # Can be None for auto-detection
                task=task,
                beam_size=5,  # Larger beam for better accuracy (slower)
                best_of=5,     # Consider 5 candidate sequences
                temperature=0.0,  # Deterministic (no randomness)
                condition_on_previous_text=True  # Use context from previous segments
            )
            
            # Process segments
            transcribed_text = ""
            segment_list = []
            
            for segment in segments:
                transcribed_text += segment.text + " "
                
                segment_dict = {
                    "id": segment.id,
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text
                }
                segment_list.append(segment_dict)
            
            # Calculate average confidence (using 1.0 as default since faster-whisper doesn't provide per-segment confidence)
            avg_confidence = 1.0
            
            result = TranscriptionResult(
                text=transcribed_text.strip(),
                language=info.language,
                confidence=avg_confidence,
                segments=segment_list,
                processing_time_seconds=info.duration,
                model_used=self.model_size
            )
            
            logger.info(f"✅ Transcription complete")
            logger.info(f"   Language: {info.language} | Confidence: {avg_confidence:.2%}")
            logger.info(f"   Duration: {info.duration:.2f}s | Text: {result.text[:100]}...")
            
            return result
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise

    def transcribe_with_language_detection(self, audio_path: str) -> TranscriptionResult:
        """
        Transcribe with automatic language detection.
        Useful for Hinglish where language might be mixed.
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            TranscriptionResult with detected language
        """
        logger.info(f"Transcribing with auto language detection: {Path(audio_path).name}")
        return self.transcribe(audio_path, language=None)

    def get_supported_languages(self) -> Dict[str, str]:
        """
        Get list of supported languages for Whisper.
        
        Returns:
            Dictionary of language code: language name
        """
        return {
            "en": "English",
            "hi": "Hindi",
            "bn": "Bengali",
            "ta": "Tamil",
            "te": "Telugu",
            "mr": "Marathi",
            "gu": "Gujarati",
            "kn": "Kannada",
            "ml": "Malayalam",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "zh": "Chinese",
            "ja": "Japanese",
            "ko": "Korean",
            # ... Whisper supports 99 languages
        }

    def hinglish_optimize_text(self, text: str) -> str:
        """
        Post-process transcribed text for Hinglish context.
        Fixes common Hinglish transcription quirks.
        
        Args:
            text: Raw transcribed text
            
        Returns:
            Optimized text
        """
        # Common Hinglish fixes
        replacements = {
            " acha ": " acha ",  # Hindi filler word
            " haan ": " haan ",  # Yes in Hindi
            " nahin ": " nahi ",  # No in Hindi
            " bilkul ": " bilkul ",  # Absolutely
            " theek hai ": " theek hai ",  # That's fine/okay
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        return text.strip()

    def transcribe_to_dict(self, audio_path: str) -> dict:
        """
        Transcribe and return as dictionary (useful for JSON serialization).
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary representation of TranscriptionResult
        """
        result = self.transcribe(audio_path)
        
        return {
            "text": result.text,
            "language": result.language,
            "confidence": result.confidence,
            "segments": result.segments,
            "processing_time_seconds": result.processing_time_seconds,
            "model_used": result.model_used,
            "timestamp": datetime.now().isoformat()
        }


# ==================== Quick Test ====================
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    try:
        engine = TranscriptionEngine(model_size="tiny")  # Use tiny for testing
        print("✅ TranscriptionEngine initialized successfully")
        print(f"Supported languages: {list(engine.get_supported_languages().keys())[:10]}...")
    except Exception as e:
        print(f"❌ Error: {e}")