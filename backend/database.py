import os
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)

database = client.legal_dms_db

# Collections
documents_collection = database.get_collection("documents")
cases_collection = database.get_collection("cases")
audit_logs_collection = database.get_collection("audit_logs")
officers_collection = database.get_collection("officers_directory")