import os
from dotenv import load_dotenv

load_dotenv()

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")
MAP_SERVICE_URL = os.getenv("MAP_SERVICE_URL")
FRONTEND_URL = os.getenv("FRONTEND_URL")