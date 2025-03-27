from flask import Flask
from flask_cors import CORS
from config import Config
from routes.pokemon import pokemon_bp
from routes.images import images_bp
from routes.game import game_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Register blueprints
app.register_blueprint(pokemon_bp, url_prefix='/api')
app.register_blueprint(images_bp)
app.register_blueprint(game_bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)