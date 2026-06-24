import os

import pytest
from pymongo.errors import PyMongoError

os.environ.setdefault('MONGO_URI', 'mongodb://localhost:27018/PokeMap')

from app import app
from routes import health


class HealthyClient:
    class Admin:
        @staticmethod
        def command(command):
            assert command == 'ping'
            return {'ok': 1}

    admin = Admin()


@pytest.fixture
def client():
    app.config.update(TESTING=True)
    return app.test_client()


def test_health_reports_ready_when_database_responds(client, monkeypatch):
    monkeypatch.setattr(health, 'get_client', lambda: HealthyClient())

    response = client.get('/api/health')

    assert response.status_code == 200
    assert response.get_json() == {
        'status': 'ok',
        'service': 'pokedex-api',
        'database': 'ok',
    }


def test_health_reports_unavailable_database(client, monkeypatch):
    def unavailable_client():
        raise PyMongoError('unavailable')

    monkeypatch.setattr(health, 'get_client', unavailable_client)

    response = client.get('/api/health')

    assert response.status_code == 503
    assert response.get_json() == {
        'error': 'Database is unavailable.',
        'code': 'database_unavailable',
    }


def test_unknown_api_route_returns_a_safe_json_error(client):
    response = client.get('/api/not-a-route')

    assert response.status_code == 404
    assert response.get_json() == {
        'error': 'API endpoint not found.',
        'code': 'endpoint_not_found',
    }
