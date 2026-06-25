from flask import Flask

from routes.docs import docs_bp


def client():
    app = Flask(__name__)
    app.config.update(TESTING=True)
    app.register_blueprint(docs_bp, url_prefix='/api')
    return app.test_client()


def test_openapi_json_documents_major_endpoints():
    response = client().get('/api/docs/openapi.json')
    spec = response.get_json()

    assert response.status_code == 200
    assert spec['openapi'] == '3.0.3'
    assert spec['info']['title'] == 'Pokédex Atlas API'
    assert '/api/pokemon' in spec['paths']
    assert '/api/sightings' in spec['paths']
    assert '/api/analytics/summary' in spec['paths']
    assert '/api/game/turn' in spec['paths']
    assert spec['paths']['/api/pokemon']['get']['parameters'][1]['name'] == 'perPage'


def test_swagger_ui_route_points_to_openapi_spec():
    response = client().get('/api/docs')
    html = response.get_data(as_text=True)

    assert response.status_code == 200
    assert 'SwaggerUIBundle' in html
    assert '/api/docs/openapi.json' in html
