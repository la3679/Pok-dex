from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / '.env.local')

from config import Config
from database import get_database


def database():
    Config.validate()
    return get_database()
