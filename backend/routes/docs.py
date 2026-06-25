from flask import Blueprint, jsonify, render_template_string

from openapi import build_openapi_spec


docs_bp = Blueprint('docs', __name__)


@docs_bp.route('/docs/openapi.json', methods=['GET'])
def openapi_json():
    return jsonify(build_openapi_spec()), 200


@docs_bp.route('/docs', methods=['GET'])
def swagger_ui():
    return render_template_string(
        """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pokédex Atlas API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #0f1418; }
      .topbar { display: none; }
      .swagger-ui .info .title, .swagger-ui .info p { color: #182026; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true,
        tryItOutEnabled: true
      });
    </script>
  </body>
</html>
        """,
    ), 200
