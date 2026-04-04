"""
AI Meeting-to-Action System Backend
FastAPI application for audio upload, processing, and transcription with background pipeline.
"""

import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson.objectid import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import threading
import time
from database import meetings_collection
from services.audio import save_audio_file
from services.stt import speech_to_text

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Initialize FastAPI app
app = FastAPI(
    title="AI Meeting-to-Action Backend",
    description="Backend API for processing meeting audio and generating action items",
    version="1.0.0"
)


# ============================================================================
# BACKGROUND PROCESSING PIPELINE
# ============================================================================

def process_pipeline(meeting_id: str, file_path: str):
    """
    Background processing pipeline for meeting audio.
    
    Flow:
    1. Update status to "processing"
    2. Perform speech-to-text transcription
    3. Extract tasks from transcription
    4. Update MongoDB document
    5. Set status to "completed"
    
    Args:
        meeting_id: MongoDB ObjectId as string
        file_path: Path to audio file in uploads directory
    """
    try:
        # Convert meeting_id string to ObjectId
        object_id = ObjectId(meeting_id)
        
        # Step 1: Update status to "processing"
        logger.info(f"🔄 Processing started for meeting: {meeting_id}")
        meetings_collection.update_one(
            {"_id": object_id},
            {"$set": {"status": "processing", "updated_at": datetime.utcnow()}}
        )
        
        # Step 2: Perform transcription
        logger.info(f"🎙️ Transcribing audio: {file_path}")
        time.sleep(0.5)  # Simulate slight processing delay
        
        try:
            transcription = speech_to_text(file_path)
        except Exception as e:
            logger.error(f"❌ Transcription failed for {meeting_id}: {str(e)}")
            raise
        
        # Step 3: Extract tasks from transcription (dummy implementation)
        logger.info(f"📋 Extracting tasks from transcription")
        time.sleep(0.3)  # Simulate processing delay
        
        # Dummy task extraction - in production, use NLP/AI models
        tasks = [
            {"text": "Finish backend by Friday", "status": "pending", "priority": "high"},
            {"text": "Setup database", "status": "pending", "priority": "medium"}
        ]
        
        # Step 4: Update MongoDB with transcription and tasks
        logger.info(f"💾 Updating meeting document with results")
        meetings_collection.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "transcription": transcription,
                    "tasks": tasks,
                    "status": "completed",
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        # Step 5: Log completion
        logger.info(f"✅ Processing completed for meeting: {meeting_id}")
        
    except Exception as e:
        # Handle errors in background processing
        logger.error(f"❌ Error in processing pipeline: {str(e)}", exc_info=True)
        try:
            object_id = ObjectId(meeting_id)
            meetings_collection.update_one(
                {"_id": object_id},
                {
                    "$set": {
                        "status": "error",
                        "error_message": str(e),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        except Exception as inner_error:
            logger.error(f"❌ Failed to update error status: {str(inner_error)}")


# ============================================================================
# CORS Middleware - Allow all origins (configure as needed for production)
# ============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================
@app.get("/", tags=["health"])
def health_check():
    """
    Health check endpoint to verify API is running.
    """
    logger.debug("Health check requested")
    return {
        "status": "healthy",
        "message": "AI Meeting Backend is running 🚀"
    }


# ============================================================================
# AUDIO UPLOAD ENDPOINT
# ============================================================================
@app.post("/upload-audio", tags=["audio"])
async def upload_audio(file: UploadFile = File(...)):
    """
    Upload an audio file for processing.
    
    - **file**: Audio file in webm, mpeg, wav, or mp4 format (max 10MB)
    
    Returns:
        - **message**: "uploaded" on success
        - **file_path**: Path to saved file
    """
    try:
        file_path = await save_audio_file(file)
        logger.info(f"✅ File uploaded: {file_path}")
        return {
            "message": "uploaded",
            "file_path": file_path
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading file: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process file: {str(e)}"
        )


# ============================================================================
# PROCESS AUDIO ENDPOINT (Upload + Start Background Pipeline)
# ============================================================================
@app.post("/process-audio", tags=["audio"])
async def process_audio(file: UploadFile = File(...)):
    """
    Upload an audio file and start background processing pipeline.
    
    Pipeline stages:
    1. Save file locally (synchronous)
    2. Create MongoDB document with status "uploaded"
    3. Start background thread for processing (STT + task extraction)
    4. Return immediately with meeting_id
    
    - **file**: Audio file in webm, mpeg, wav, or mp4 format (max 10MB)
    
    Returns:
        - **meeting_id**: Unique ID of the meeting document
        - **message**: Status confirmation
        - **status**: Current processing status
    """
    try:
        # Step 1: Save audio file locally
        file_path = await save_audio_file(file)
        logger.info(f"✅ File saved: {file_path}")
        
        # Step 2: Create MongoDB document with initial status
        meeting_document = {
            "audio_file": file_path,
            "transcription": None,  # Will be filled during processing
            "tasks": [],  # Will be filled during processing
            "status": "uploaded",  # Initial status
            "created_at": datetime.utcnow()
        }
        
        result = meetings_collection.insert_one(meeting_document)
        meeting_id = str(result.inserted_id)
        logger.info(f"📝 Meeting document created: {meeting_id}")
        
        # Step 3: Start background processing thread
        processing_thread = threading.Thread(
            target=process_pipeline,
            args=(meeting_id, file_path),
            daemon=True  # Thread won't block app shutdown
        )
        processing_thread.start()
        logger.info(f"🧵 Background processing started for meeting: {meeting_id}")
        
        # Step 4: Return immediately without waiting
        return {
            "meeting_id": meeting_id,
            "message": "Audio uploaded and processing started",
            "status": "uploaded"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing audio: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process audio: {str(e)}"
        )


# ============================================================================
# GET ALL MEETINGS ENDPOINT
# ============================================================================
@app.get("/meetings", tags=["meetings"])
def get_meetings():
    """
    Retrieve all meetings stored in MongoDB.
    
    Returns:
        - **meetings**: List of all meeting documents
        - **total**: Total number of meetings
    """
    try:
        # Retrieve all meetings from MongoDB
        meetings = list(meetings_collection.find())
        
        # Convert MongoDB ObjectId to string for JSON serialization
        for meeting in meetings:
            meeting["_id"] = str(meeting["_id"])
        
        logger.info(f"✅ Retrieved {len(meetings)} meetings from MongoDB")
        
        return {
            "meetings": meetings,
            "total": len(meetings)
        }
    except Exception as e:
        logger.error(f"❌ Error retrieving meetings: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve meetings: {str(e)}"
        )


# ============================================================================
# GET SINGLE MEETING ENDPOINT
# ============================================================================
@app.get("/meeting/{meeting_id}", tags=["meetings"])
def get_meeting(meeting_id: str):
    """
    Retrieve a specific meeting by ID.
    
    - **meeting_id**: The MongoDB ObjectId of the meeting
    
    Returns:
        - **meeting**: The meeting document with converted string IDs
    """
    try:
        # Validate and convert meeting_id to ObjectId
        try:
            object_id = ObjectId(meeting_id)
        except InvalidId:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid meeting ID format: {meeting_id}"
            )
        
        # Find meeting in MongoDB
        meeting = meetings_collection.find_one({"_id": object_id})
        
        if not meeting:
            raise HTTPException(
                status_code=404,
                detail=f"Meeting not found with ID: {meeting_id}"
            )
        
        # Convert ObjectId to string for JSON serialization
        meeting["_id"] = str(meeting["_id"])
        
        logger.info(f"✅ Retrieved meeting: {meeting_id}")
        
        return {"meeting": meeting}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error retrieving meeting: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve meeting: {str(e)}"
        )


# ============================================================================
# ERROR HANDLERS
# ============================================================================
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }