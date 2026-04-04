#!/usr/bin/env python3
"""
Quick test script for AI Meeting-to-Action Backend
Run this after starting the server: uvicorn main.py --reload
"""

import requests
import json
from pathlib import Path


BASE_URL = "http://localhost:8000"


def test_health_check():
    """Test the health check endpoint."""
    print("\n" + "="*60)
    print("TEST 1: Health Check (GET /)")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("✅ PASSED")


def test_upload_audio():
    """Test the upload audio endpoint."""
    print("\n" + "="*60)
    print("TEST 2: Upload Audio (POST /upload-audio)")
    print("="*60)
    
    # Create a minimal dummy audio file for testing
    # In practice, you'd use a real audio file
    test_audio_path = Path("test_audio.webm")
    
    try:
        # If you have a real audio file, use that instead:
        # test_audio_path = Path("your_audio_file.webm")
        
        if not test_audio_path.exists():
            print(f"⚠️  Test audio file not found: {test_audio_path}")
            print("   To test this endpoint, please provide a real audio file.")
            print("   Usage: Place an audio file (e.g., meeting.webm) in the backend directory")
            print("   and update the test_audio_path variable above.")
            return
        
        with open(test_audio_path, 'rb') as f:
            files = {'file': (test_audio_path.name, f, 'audio/webm')}
            response = requests.post(f"{BASE_URL}/upload-audio", files=files)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        assert response.status_code == 200
        assert response.json()["message"] == "uploaded"
        assert "file_path" in response.json()
        print("✅ PASSED")
        
    except Exception as e:
        print(f"❌ Error: {e}")


def test_process_audio():
    """Test the process audio endpoint."""
    print("\n" + "="*60)
    print("TEST 3: Process Audio (POST /process-audio)")
    print("="*60)
    
    test_audio_path = Path("test_audio.webm")
    
    try:
        if not test_audio_path.exists():
            print(f"⚠️  Test audio file not found: {test_audio_path}")
            print("   To test this endpoint, please provide a real audio file.")
            print("   Usage: Place an audio file (e.g., meeting.webm) in the backend directory")
            return
        
        with open(test_audio_path, 'rb') as f:
            files = {'file': (test_audio_path.name, f, 'audio/webm')}
            response = requests.post(f"{BASE_URL}/process-audio", files=files)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        assert response.status_code == 200
        assert "text" in response.json()
        assert response.json()["text"] == "We should finish backend by Friday. Rahul take care of API."
        print("✅ PASSED")
        
    except Exception as e:
        print(f"❌ Error: {e}")


def test_invalid_file_type():
    """Test error handling for invalid file type."""
    print("\n" + "="*60)
    print("TEST 4: Invalid File Type Error Handling")
    print("="*60)
    
    # Create a dummy PDF file to test rejection
    test_file_path = Path("test_file.pdf")
    test_file_path.write_bytes(b"PDF dummy content")
    
    try:
        with open(test_file_path, 'rb') as f:
            files = {'file': (test_file_path.name, f, 'application/pdf')}
            response = requests.post(f"{BASE_URL}/upload-audio", files=files)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        assert response.status_code == 400
        assert "Invalid file type" in response.json()["error"]
        print("✅ PASSED - Correctly rejected invalid file type")
        
    finally:
        test_file_path.unlink()


def test_empty_file():
    """Test error handling for empty file."""
    print("\n" + "="*60)
    print("TEST 5: Empty File Error Handling")
    print("="*60)
    
    test_file_path = Path("empty_file.webm")
    test_file_path.write_bytes(b"")  # Create empty file
    
    try:
        with open(test_file_path, 'rb') as f:
            files = {'file': (test_file_path.name, f, 'audio/webm')}
            response = requests.post(f"{BASE_URL}/upload-audio", files=files)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        assert response.status_code == 400
        assert "empty" in response.json()["error"].lower()
        print("✅ PASSED - Correctly rejected empty file")
        
    finally:
        test_file_path.unlink()


def test_server_connection():
    """Test if server is running."""
    print("\n" + "="*60)
    print("Checking server connection...")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=2)
        print(f"✅ Server is running at {BASE_URL}")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {BASE_URL}")
        print("\nPlease start the server first:")
        print("  cd backend")
        print("  uvicorn main.py --reload")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests."""
    print("\n" + "="*80)
    print("AI MEETING-TO-ACTION BACKEND - TEST SUITE")
    print("="*80)
    
    if not test_server_connection():
        return
    
    try:
        test_health_check()
        test_invalid_file_type()
        test_empty_file()
        test_upload_audio()
        test_process_audio()
        
        print("\n" + "="*80)
        print("Test Summary")
        print("="*80)
        print("✅ All basic tests completed!")
        print("\nNext steps:")
        print("1. Test with FastAPI Swagger UI: http://localhost:8000/docs")
        print("2. Upload real audio files using the /upload-audio endpoint")
        print("3. Process audio files using the /process-audio endpoint")
        print("="*80 + "\n")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")


if __name__ == "__main__":
    main()
