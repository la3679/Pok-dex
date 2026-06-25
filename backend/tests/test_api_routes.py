import os

from flask import Flask

os.environ.setdefault('MONGO_URI', 'mongodb://localhost:27018/PokeMap')

import routes.pokemon as pokemon_routes
from routes.game import game_bp
from routes.pokemon import pokemon_bp
from services.validation import ValidationError


class StubPokemonService:
    def list_pokemon(self, args):
        return {'pokemon': [], 'totalPokemon': 0, 'totalPages': 1, 'currentPage': 1}

    def detail(self, pokemon_id):
        if pokemon_id == '404':
            raise LookupError('missing')
        return {'pokemon': {'pokemonId': pokemon_id, 'name': 'Pikachu'}}

    def forms(self, pokemon_id):
        return [{'form_name': 'pikachu'}]

    def moves(self, pokemon_id, args):
        return [{'name': 'thunder-shock', 'type': 'electric'}]

    def evolutions(self, pokemon_id):
        return {'pokemon_id': int(pokemon_id), 'evolution_chain': None}

    def sightings(self, pokemon_id, args):
        return [{'source': 'test'}]

    def map_sightings(self, args):
        return {'sightings': [], 'summary': {'total': 0, 'visible': 0}}

    def add_comment(self, pokemon_id, payload):
        if not payload or not payload.get('text'):
            raise ValidationError('Comment text is required.')
        return {'id': 'comment-1', 'text': payload['text'], 'author': 'CurrentUser'}

    def types(self):
        return [{'api_name': 'electric'}]

    def type_chart(self, args):
        return {'attacking': 'electric', 'defending': ['water'], 'multiplier': 2}

    def analytics_summary(self):
        return {'pokemon': 1350, 'sightings': 296021}

    def analytics_types(self):
        return [{'type': 'water', 'count': 100}]

    def analytics_top_stats(self, args):
        return [{'pokemon_id': 25, 'name': 'Pikachu', 'value': 90}]

    def analytics_generations(self):
        return [{'generation': 'generation-i', 'count': 151}]

    def analytics_type_stats(self):
        return [{'type': 'electric', 'averages': {'speed': 90}}]

    def analytics_extremes(self):
        return {'tallest': [], 'heaviest': []}

    def analytics_sightings(self):
        return [{'pokemon_id': 25, 'name': 'Pikachu', 'count': 10}]


def client(monkeypatch):
    app = Flask(__name__)
    app.config.update(TESTING=True)
    app.register_blueprint(pokemon_bp, url_prefix='/api')
    monkeypatch.setattr(pokemon_routes, 'service', StubPokemonService())
    return app.test_client()


def test_pokemon_routes_return_safe_json(monkeypatch):
    test_client = client(monkeypatch)

    assert test_client.get('/api/pokemon').get_json()['totalPokemon'] == 0
    assert test_client.get('/api/pokemon/25').get_json()['pokemon']['name'] == 'Pikachu'
    assert test_client.get('/api/pokemon/25/forms').get_json()['forms'][0]['form_name'] == 'pikachu'
    assert test_client.get('/api/pokemon/25/moves').get_json()['moves'][0]['type'] == 'electric'
    assert test_client.get('/api/pokemon/25/evolutions').get_json()['pokemon_id'] == 25
    assert test_client.get('/api/pokemon/25/sightings').get_json()[0]['source'] == 'test'


def test_route_error_contracts(monkeypatch):
    test_client = client(monkeypatch)

    missing = test_client.get('/api/pokemon/404')
    invalid_comment = test_client.post('/api/pokemon/25/comments', json={})

    assert missing.status_code == 404
    assert missing.get_json()['code'] == 'pokemon_not_found'
    assert invalid_comment.status_code == 400
    assert invalid_comment.get_json()['code'] == 'invalid_request'


def test_type_and_analytics_routes(monkeypatch):
    test_client = client(monkeypatch)

    assert test_client.get('/api/types').get_json()['types'][0]['api_name'] == 'electric'
    assert test_client.get('/api/type-chart').get_json()['multiplier'] == 2
    assert test_client.get('/api/analytics/summary').get_json()['pokemon'] == 1350
    assert test_client.get('/api/analytics/types').get_json()['types'][0]['type'] == 'water'
    assert test_client.get('/api/analytics/top-stats').get_json()['pokemon'][0]['value'] == 90
    assert test_client.get('/api/analytics/generations').get_json()['generations'][0]['count'] == 151
    assert test_client.get('/api/analytics/type-stats').get_json()['types'][0]['averages']['speed'] == 90
    assert test_client.get('/api/analytics/extremes').get_json() == {'tallest': [], 'heaviest': []}
    assert test_client.get('/api/analytics/sightings').get_json()['pokemon'][0]['count'] == 10


def test_legacy_game_turn_route_does_not_produce_negative_health():
    app = Flask(__name__)
    app.config.update(TESTING=True)
    app.register_blueprint(game_bp)
    test_client = app.test_client()
    payload = {
        'currentTurn': 1,
        'userTeam': [{'pokemon': {'name': 'Pikachu'}, 'health': 10, 'attackPower': 100}],
        'cpuTeam': [{'pokemon': {'name': 'Bulbasaur'}, 'health': 10, 'attackPower': 5}],
    }

    response = test_client.post('/api/game/turn', json=payload)
    body = response.get_json()

    assert response.status_code == 200
    assert all(member['health'] >= 0 for member in body['userTeam'] + body['cpuTeam'])
    assert body['gameOver'] is True
