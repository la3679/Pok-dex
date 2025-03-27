from flask import Blueprint, send_file, jsonify
from io import BytesIO
from pymongo import MongoClient
from config import Config
from gridfs import GridFS
import bson

images_bp = Blueprint('images', __name__)

# MongoDB connection with authentication
client = MongoClient(Config.MONGO_URI)
db = client['PokeMap']
fs = GridFS(db, collection='images')

@images_bp.route('/api/images/<image_id>', methods=['GET'])
def get_image(image_id):
    try:
        # Convert the image_id string to ObjectId
        image_id = bson.ObjectId(image_id)
        # Retrieve the image from GridFS
        image = fs.get(image_id)
        # Serve the image
        return send_file(
            BytesIO(image.read()),
            mimetype='image/png',
            as_attachment=False
        )
    except (bson.errors.InvalidId, gridfs.errors.NoFile) as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500