"""Audio file handling and management service."""

import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException


# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_AUDIO_TYPES = {"audio/webm", "audio/mpeg", "audio/wav", "audio/mp4"}
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"


def validate_file_type(file: UploadFile) -> None:
    """
    Validate that the uploaded file is an audio file.
    
    Args:
        file: The uploaded file
        
    Raises:
        HTTPException: If file type is not allowed
    """
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed types: {', '.join(ALLOWED_AUDIO_TYPES)}"
        )


async def save_audio_file(file: UploadFile) -> str:
    """
    Save an uploaded audio file to the uploads directory.
    
    Args:
        file: The uploaded file object
        
    Returns:
        str: The relative file path where the file was saved
        
    Raises:
        HTTPException: If file validation or saving fails
    """
    # Validate file type
    validate_file_type(file)
    
    # Ensure uploads directory exists
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File size ({file_size} bytes) exceeds maximum allowed size ({MAX_FILE_SIZE} bytes)"
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )
    
    # Generate unique filename with UUID
    unique_filename = f"{uuid.uuid4()}.webm"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Log file upload
    relative_path = f"uploads/{unique_filename}"
    print(f"✅ File uploaded: {unique_filename} (Size: {file_size} bytes)")
    
    return relative_path
