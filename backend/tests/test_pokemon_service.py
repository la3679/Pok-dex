from datetime import datetime, timezone

import pytest

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
