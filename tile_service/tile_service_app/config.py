import os
import dotenv

dotenv.load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
MAP_SERVICE_URL = os.getenv("MAP_SERVICE_URL", "http://map-service:8000")

S3_ENDPOINT = os.getenv("S3_ENDPOINT")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_BUCKET = os.getenv("S3_BUCKET")
S3_SECURE = os.getenv("S3_SECURE", "false").lower() == "true"