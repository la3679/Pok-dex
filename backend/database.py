from functools import lru_cache

from pymongo import MongoClient

from config import Config


@lru_cache
def get_client():
    return MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=3000)


def get_database():
    return get_client()[Config.MONGO_DATABASE]
