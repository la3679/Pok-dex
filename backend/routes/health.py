from flask import Blueprint, current_app, jsonify
from pymongo.errors import PyMongoError

from database import get_client
from routes.errors import api_error


health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    try:
        get_client().admin.command('ping')
    except PyMongoError:
        current_app.logger.warning('Health check failed because MongoDB is unavailable.')
        return api_error('Database is unavailable.', 503, 'database_unavailable')

    return jsonify({'status': 'ok', 'service': 'pokedex-api', 'database': 'ok'}), 200
