import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Config:
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'sppa_bank_db')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
