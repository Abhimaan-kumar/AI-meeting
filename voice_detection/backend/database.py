"""
MongoDB database module for the AI Meeting-to-Action system.
Handles connection and collection management for storing meeting metadata.
"""

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os


# ============================================================================
# MONGODB CONNECTION CONFIGURATION
# ============================================================================

# MongoDB connection string (update for production environment)
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = "meeting_db"
COLLECTION_NAME = "meetings"


# ============================================================================
# DATABASE CONNECTION
# ============================================================================

try:
    # Create MongoDB client
    client = MongoClient(MONGODB_URL)
    
    # Verify connection
    client.admin.command("ping")
    print(f"✅ Connected to MongoDB at {MONGODB_URL}")
    
except ConnectionFailure as e:
    print(f"❌ Failed to connect to MongoDB: {str(e)}")
    print(f"📌 Make sure MongoDB is running at {MONGODB_URL}")
    raise


# ============================================================================
# DATABASE AND COLLECTION SETUP
# ============================================================================

# Access database
database = client[DATABASE_NAME]

# Access or create collection
meetings_collection = database[COLLECTION_NAME]

# Create index on created_at for efficient sorting
meetings_collection.create_index("created_at", name="created_at_index")

print(f"✅ Database '{DATABASE_NAME}' and collection '{COLLECTION_NAME}' ready")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def close_database_connection():
    """
    Close MongoDB connection (useful for shutdown hooks).
    """
    if client:
        client.close()
        print("✅ MongoDB connection closed")
