from flask import jsonify


def api_error(message, status_code, code):
    return jsonify({'error': message, 'code': code}), status_code
