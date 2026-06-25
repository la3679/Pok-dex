import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent


def create_app():
    load_dotenv(BASE_DIR / '.env.local')

    from config import Config
    from routes.game import game_bp
    from routes.health import health_bp
    from routes.images import images_bp
    from routes.docs import docs_bp
    from routes.pokemon import pokemon_bp
    from routes.errors import api_error

    Config.validate()

    app = Flask(__name__)
    CORS(app, resources={r'/api/*': {'origins': Config.FRONTEND_ORIGINS}})
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(docs_bp, url_prefix='/api')
    app.register_blueprint(pokemon_bp, url_prefix='/api')
    app.register_blueprint(images_bp)
    app.register_blueprint(game_bp)

    @app.errorhandler(404)
    def api_not_found(error):
        if request.path.startswith('/api/'):
            return api_error('API endpoint not found.', 404, 'endpoint_not_found')
        return error

    @app.errorhandler(405)
    def api_method_not_allowed(error):
        if request.path.startswith('/api/'):
            return api_error('HTTP method is not allowed for this endpoint.', 405, 'method_not_allowed')
        return error

    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true', host='0.0.0.0', port=5000)
