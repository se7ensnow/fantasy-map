import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

SOURCE_IMAGES_PATH = os.getenv("SOURCE_IMAGES_PATH", "/shared_uploads")

TILES_OUTPUT_PATH = os.getenv("TILES_OUTPUT_PATH", "/tiles")

MAP_SERVICE_URL = os.getenv("MAP_SERVICE_URL", "http://map_service:8000")