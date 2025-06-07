import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
SOURCE_IMAGES_PATH = os.getenv('SOURCE_IMAGES_PATH')
REDIS_URL = os.getenv('REDIS_URL')
TILES_BASE_PATH = os.getenv('TILES_BASE_PATH')
TILE_SERVICE_TASK = os.getenv('TILE_SERVICE_TASK')