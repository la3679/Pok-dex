import os


class Config:
    MONGO_URI = os.getenv('MONGO_URI')
    MONGO_DATABASE = os.getenv('MONGO_DATABASE', 'PokeMap')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    FRONTEND_ORIGINS = [
        origin.strip()
        for origin in os.getenv('FRONTEND_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
        if origin.strip()
    ]

    @classmethod
    def validate(cls):
        if not cls.MONGO_URI:
            raise RuntimeError('MONGO_URI must be set in backend/.env.local or the process environment.')
