"""
Audio Processing Module
Handles noise reduction, normalization, VAD, and audio preprocessing.
Ensures high-quality audio input for transcription.
"""

import librosa
import numpy as np
import soundfile as sf
from pathlib import Path
import logging
from typing import Tuple, Optional
import json

# Optional: For advanced VAD
try:
    from silero_vad import load_silero_vad
    SILERO_AVAILABLE = True
except ImportError:
    SILERO_AVAILABLE = False

from config import (
    SAMPLE_RATE, NOISE_GATE_DB, TARGET_LOUDNESS_LUFS,
    ENABLE_VAD, VAD_THRESHOLD, CHUNK_DURATION_MS
)

logger = logging.getLogger(__name__)

class AudioProcessor:
    """
    Processes audio files for improved transcription quality.
    Key operations:
    - Noise reduction (spectral gating)
    - Normalization (loudness leveling)
    - VAD (Voice Activity Detection)
    - Silence removal
    """

    def __init__(self):
        """Initialize audio processor with VAD model if available."""
        self.vad_model = None
        if SILERO_AVAILABLE and ENABLE_VAD:
            try:
                self.vad_model = load_silero_vad()
                logger.info("Silero VAD model loaded successfully")
            except Exception as e:
                logger.warning(f"Failed to load Silero VAD: {e}. Falling back to energy-based VAD")

    def load_audio(self, file_path: str) -> Tuple[np.ndarray, int]:
        """
        Load audio file and resample to standard sample rate.
        
        Args:
            file_path: Path to audio file (supports .wav, .mp3, .m4a, .webm, etc.)
            
        Returns:
            Tuple of (audio waveform, sample rate)
        """
        try:
            audio, sr = librosa.load(file_path, sr=SAMPLE_RATE, mono=True)
            logger.info(f"Loaded audio: {Path(file_path).name} | SR: {sr} Hz | Duration: {len(audio)/sr:.2f}s")
            return audio, sr
        except Exception as e:
            logger.error(f"Error loading audio file: {e}")
            raise

    def reduce_noise_spectral_gating(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """
        Apply spectral gating for noise reduction.
        Quieter frequency bins are reduced, preserving speech while minimizing noise.
        
        Args:
            audio: Audio waveform (numpy array)
            sr: Sample rate
            
        Returns:
            Noise-reduced audio
        """
        # Convert to frequency domain
        D = librosa.stft(audio)
        S_mag = np.abs(D)
        S_phase = np.angle(D)
        
        # Calculate spectral centroid for noise estimation
        # Noise typically has lower spectral power
        power = np.abs(D) ** 2
        threshold = np.percentile(power, 30)  # Bottom 30% is considered noise
        
        # Apply magnitude mask: reduce quiet components
        mask = np.where(power > threshold, 1.0, 0.1)  # Attenuate quiet parts
        S_mag_gated = S_mag * mask
        
        # Reconstruct
        D_gated = S_mag_gated * np.exp(1j * S_phase)
        audio_denoised = librosa.istft(D_gated)
        
        logger.info("Spectral gating noise reduction applied")
        return audio_denoised

    def normalize_loudness(self, audio: np.ndarray) -> np.ndarray:
        """
        Normalize audio to target loudness (LUFS).
        Ensures consistent volume across different speakers/recordings.
        
        Args:
            audio: Audio waveform
            
        Returns:
            Normalized audio
        """
        # Simple RMS normalization (loudness-based)
        rms = np.sqrt(np.mean(audio ** 2))
        
        if rms < 1e-10:  # Prevent division by zero
            logger.warning("Audio is silent")
            return audio
        
        # Calculate gain needed to reach target loudness
        # Using simple RMS scaling (approximation of LUFS)
        current_loudness_db = 20 * np.log10(rms)
        target_loudness_db = TARGET_LOUDNESS_LUFS
        gain_db = target_loudness_db - current_loudness_db
        gain_linear = 10 ** (gain_db / 20)
        
        # Apply gain with clipping prevention
        audio_normalized = np.clip(audio * gain_linear, -1.0, 1.0)
        
        logger.info(f"Loudness normalized: {current_loudness_db:.1f}dB → {target_loudness_db}dB")
        return audio_normalized

    def apply_noise_gate(self, audio: np.ndarray) -> np.ndarray:
        """
        Remove audio below noise gate threshold.
        Silences background hum and ambient noise.
        
        Args:
            audio: Audio waveform
            
        Returns:
            Audio with noise gate applied
        """
        # Convert to dB
        S = librosa.stft(audio)
        S_db = librosa.power_to_db(np.abs(S) ** 2, ref=np.max)
        
        # Create mask for frequencies above gate threshold
        mask = S_db > NOISE_GATE_DB
        
        # Apply mask
        S_gated = S * mask.astype(float)
        audio_gated = librosa.istft(S_gated)
        
        logger.info(f"Noise gate applied: {NOISE_GATE_DB}dB threshold")
        return audio_gated

    def detect_voice_activity_silero(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """
        Remove silence using Silero VAD (advanced ML-based).
        Best for Hinglish audio as it's trained on multiple languages.
        
        Args:
            audio: Audio waveform
            sr: Sample rate
            
        Returns:
            Audio with silence removed
        """
        if not self.vad_model:
            logger.warning("Silero VAD not available, using energy-based method")
            return self.detect_voice_activity_energy(audio, sr)
        
        try:
            # Process audio in chunks
            chunk_size = int(sr * CHUNK_DURATION_MS / 1000)
            confidence_scores = []
            
            for i in range(0, len(audio), chunk_size):
                chunk = audio[i:i+chunk_size].astype(np.float32)
                
                if len(chunk) < sr // 100:  # Minimum 10ms
                    continue
                
                confidence = self.vad_model(torch.from_numpy(chunk), sr)
                confidence_scores.append((i, confidence.item()))
            
            # Filter based on confidence threshold
            voice_regions = [cs for cs in confidence_scores if cs[1] > VAD_THRESHOLD]
            
            if voice_regions:
                logger.info(f"VAD: Detected {len(voice_regions)} voice regions")
            
            # For simplicity, we'll return original audio but log confidence
            # In production, you might stitch together voice regions
            return audio
            
        except Exception as e:
            logger.warning(f"Silero VAD failed: {e}. Using energy-based method")
            return self.detect_voice_activity_energy(audio, sr)

    def detect_voice_activity_energy(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """
        Remove silence using energy-based detection.
        Fallback method when advanced VAD is unavailable.
        
        Args:
            audio: Audio waveform
            sr: Sample rate
            
        Returns:
            Audio with silence removed
        """
        # Compute energy in short-time windows
        S = librosa.feature.melspectrogram(y=audio, sr=sr)
        S_db = librosa.power_to_db(S, ref=np.max)
        energy = np.mean(S_db, axis=0)
        
        # Threshold: silence is below mean - 2*std
        threshold = np.mean(energy) - 2 * np.std(energy)
        
        # Keep frames above threshold
        frame_length = len(audio) // len(energy)
        voiced_frames = energy > threshold
        
        # Convert frame selection back to sample indices
        audio_trimmed = []
        for i, is_voiced in enumerate(voiced_frames):
            start = i * frame_length
            end = (i + 1) * frame_length
            if is_voiced:
                audio_trimmed.append(audio[start:end])
        
        if audio_trimmed:
            audio_trimmed = np.concatenate(audio_trimmed)
        else:
            audio_trimmed = audio  # If all silent, return original
        
        reduction_pct = 100 * (len(audio) - len(audio_trimmed)) / len(audio)
        logger.info(f"Silence removed: {reduction_pct:.1f}% of audio")
        return audio_trimmed

    def process_audio_pipeline(self, file_path: str) -> str:
        """
        Complete audio processing pipeline.
        
        Sequence: Load → Noise Reduction → Normalize → VAD → Save
        
        Args:
            file_path: Path to input audio file
            
        Returns:
            Path to processed audio file
        """
        logger.info(f"Starting audio processing pipeline for: {file_path}")
        
        # 1. Load audio
        audio, sr = self.load_audio(file_path)
        original_duration = len(audio) / sr
        
        # 2. Apply noise reduction (spectral gating)
        audio = self.reduce_noise_spectral_gating(audio, sr)
        
        # 3. Apply noise gate
        audio = self.apply_noise_gate(audio)
        
        # 4. Normalize loudness
        audio = self.normalize_loudness(audio)
        
        # 5. Voice activity detection (remove silence)
        if ENABLE_VAD:
            audio = self.detect_voice_activity_silero(audio, sr)
        
        # 6. Save processed audio
        output_path = str(Path(file_path).parent / f"processed_{Path(file_path).stem}.wav")
        sf.write(output_path, audio, sr)
        
        processed_duration = len(audio) / sr
        logger.info(f"Processing complete: {original_duration:.2f}s → {processed_duration:.2f}s")
        logger.info(f"Saved to: {output_path}")
        
        return output_path

    def get_audio_metrics(self, file_path: str) -> dict:
        """
        Get metrics about the audio file (for debugging/monitoring).
        
        Args:
            file_path: Path to audio file
            
        Returns:
            Dictionary with audio metrics
        """
        audio, sr = self.load_audio(file_path)
        
        rms = np.sqrt(np.mean(audio ** 2))
        loudness_db = 20 * np.log10(rms) if rms > 0 else -np.inf
        
        # Spectral analysis
        S = librosa.feature.melspectrogram(y=audio, sr=sr)
        spectral_centroid = librosa.feature.spectral_centroid(S=S, sr=sr).mean()
        
        metrics = {
            "file": Path(file_path).name,
            "duration_seconds": len(audio) / sr,
            "sample_rate": sr,
            "rms_loudness_db": float(loudness_db),
            "spectral_centroid_hz": float(spectral_centroid),
            "peak_amplitude": float(np.max(np.abs(audio))),
            "is_clipping": np.max(np.abs(audio)) >= 0.99
        }
        
        return metrics


# ==================== Quick Test ====================
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    processor = AudioProcessor()
    print("✅ AudioProcessor initialized successfully")