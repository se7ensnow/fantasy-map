import os
import dotenv

dotenv.load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL")
TILE_SERVICE_TASK = os.getenv("TILE_SERVICE_TASK")

S3_ENDPOINT = os.getenv("S3_ENDPOINT")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_BUCKET = os.getenv("S3_BUCKET")
S3_SECURE = os.getenv("S3_SECURE", "false").lower() == "true"

MAX_TAGS_PER_MAP = 10
MAX_TAG_LEN = 25
SHARE_ID_TRIES = 10
DESCRIPTION_MAX_LENGTH = 50000