from flask import Blueprint, send_file
from io import BytesIO
from gridfs import GridFS
import bson
import gridfs
from database import get_database
from routes.errors import api_error

images_bp = Blueprint('images', __name__)

db = get_database()
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
    except (bson.errors.InvalidId, gridfs.errors.NoFile):
        return api_error('Image not found.', 404, 'image_not_found')
    except Exception:
        return api_error('Unable to load the image right now.', 500, 'image_load_failed')
