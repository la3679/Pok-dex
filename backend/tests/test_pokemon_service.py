from datetime import datetime, timezone

import pytest
from flask import Flask

from routes.pokemon import pokemon_bp
from services.pokemon_service import PokemonService
from services.validation import ValidationError


class FakeRepository:
    def __init__(self):
        self.records = [{
            'pokemon_id': 25,
            'name': 'Pikachu',
            'types': ['electric'],
            'stats': {'hp': 35, 'attack': 55, 'defense': 40, 'speed': 90, 'special-attack': 50, 'special-defense': 50},
            'abilities': [{'name': 'static', 'is_hidden': False}],
            'height_decimeters': 4,
            'weight_hectograms': 60,
            'sprites': {},
        }]
        self.type_records = {
            'fire': {'api_name': 'fire', 'damage_relations': {'double_damage_to': ['grass'], 'half_damage_to': [], 'no_damage_to': []}},
            'grass': {'api_name': 'grass', 'damage_relations': {'double_damage_to': [], 'half_damage_to': [], 'no_damage_to': []}},
        }

    def list_pokemon(self, query, sort_field, sort_direction, skip, limit):
        return self.records, len(self.records)

    def find_pokemon(self, pokemon_id):
        return self.records[0] if pokemon_id == 25 else None

    def species_ids(self, query):
        return []

    def find_type(self, name):
        return self.type_records.get(name)


def test_list_pokemon_returns_legacy_compatible_card_shape():
    result = PokemonService(FakeRepository()).list_pokemon({'page': '1', 'perPage': '20'})

    assert result['totalPokemon'] == 1
    assert result['pokemon'][0]['pokemon']['pokemonId'] == '25'
    assert result['pokemon'][0]['pokemon']['primary_type'] == 'electric'
    assert result['pokemon'][0]['pokemon']['special_attack'] == 50
    assert result['pokemon'][0]['abilities'] == [{'name': 'static', 'is_hidden': False}]


def test_list_pokemon_rejects_invalid_page_size():
    with pytest.raises(ValidationError):
        PokemonService(FakeRepository()).list_pokemon({'perPage': '101'})


def test_type_chart_calculates_effectiveness():
    result = PokemonService(FakeRepository()).type_chart({'attacking': 'fire', 'defending': 'grass'})

    assert result['multiplier'] == 2


def test_map_sightings_returns_enriched_summary():
    class MapRepository(FakeRepository):
        def list_map_sightings(self, query, limit, longitude=None, latitude=None, radius_km=None):
            assert query['pokemon_id'] == 25
            return [{'pokemon_id': 25, 'location': {'type': 'Point', 'coordinates': [-73.9, 40.7]}, 'appeared_at': datetime(2024, 1, 2, tzinfo=timezone.utc), 'source': 'test'}]

        def pokemon_map_metadata(self, pokemon_ids):
            return {25: {'pokemon_id': 25, 'name': 'Pikachu', 'types': ['electric'], 'sprites': {}}}

        def sighting_count(self, query):
            return 1

    result = PokemonService(MapRepository()).map_sightings({'pokemonId': '25', 'limit': '10'})

    assert result['summary']['visible'] == 1
    assert result['sightings'][0]['pokemon_name'] == 'Pikachu'


def test_map_sightings_applies_an_inclusive_date_range():
    class DateMapRepository(FakeRepository):
        def __init__(self):
            super().__init__()
            self.query = None

        def list_map_sightings(self, query, limit, longitude=None, latitude=None, radius_km=None):
            self.query = query
            return [{'pokemon_id': 25, 'location': {'type': 'Point', 'coordinates': [-73.9, 40.7]}, 'appeared_at': datetime(2024, 1, 2, 15, tzinfo=timezone.utc), 'source': 'test'}]

        def pokemon_map_metadata(self, pokemon_ids):
            return {25: {'pokemon_id': 25, 'name': 'Pikachu', 'types': ['electric'], 'sprites': {}}}

        def sighting_count(self, query):
            return 1

    repository = DateMapRepository()
    result = PokemonService(repository).map_sightings({
        'pokemonId': '25',
        'dateFrom': '2024-01-02',
        'dateTo': '2024-01-02',
    })

    appeared_at = repository.query['appeared_at']
    assert appeared_at['$gte'] == datetime(2024, 1, 2, 0, 0, tzinfo=timezone.utc)
    assert appeared_at['$lte'] == datetime(2024, 1, 2, 23, 59, 59, 999999, tzinfo=timezone.utc)
    assert result['summary']['total'] == 1


def test_analytics_service_uses_repository_aggregations():
    class AnalyticsRepository(FakeRepository):
        def __init__(self):
            super().__init__()
            self.stat_request = None

        def analytics_summary(self):
            return {'pokemon': 10, 'sightings': 20, 'legendary': 1, 'mythical': 1}

        def analytics_types(self):
            return [{'type': 'electric', 'count': 2}]

        def analytics_generations(self):
            return [{'generation': 'generation-i', 'count': 10, 'legendary': 1, 'mythical': 1}]

        def analytics_type_stats(self):
            return [{'type': 'electric', 'count': 2, 'averages': {'attack': 70}}]

        def analytics_top_stats(self, stat, limit):
            self.stat_request = (stat, limit)
            return [{'pokemon_id': 25, 'name': 'Pikachu', 'types': ['electric'], 'value': 55}]

        def analytics_extremes(self):
            return {'tallest': [], 'heaviest': []}

        def analytics_sightings(self):
            return [{'pokemon_id': 25, 'name': 'Pikachu', 'types': ['electric'], 'count': 4}]

    repository = AnalyticsRepository()
    service = PokemonService(repository)

    assert service.analytics_summary()['sightings'] == 20
    assert service.analytics_types()[0]['type'] == 'electric'
    assert service.analytics_generations()[0]['generation'] == 'generation-i'
    assert service.analytics_type_stats()[0]['averages']['attack'] == 70
    assert service.analytics_top_stats({'stat': 'speed', 'limit': '3'})[0]['value'] == 55
    assert repository.stat_request == ('speed', 3)
    assert service.analytics_extremes() == {'tallest': [], 'heaviest': []}
    assert service.analytics_sightings()[0]['count'] == 4


def test_analytics_rejects_unsupported_stat():
    with pytest.raises(ValidationError):
        PokemonService(FakeRepository()).analytics_top_stats({'stat': 'friendship'})


def test_analytics_dashboard_routes_are_registered():
    app = Flask(__name__)
    app.register_blueprint(pokemon_bp, url_prefix='/api')
    rules = {rule.rule for rule in app.url_map.iter_rules()}

    assert {
        '/api/analytics/summary',
        '/api/analytics/types',
        '/api/analytics/top-stats',
        '/api/analytics/generations',
        '/api/analytics/type-stats',
        '/api/analytics/extremes',
        '/api/analytics/sightings',
    }.issubset(rules)
