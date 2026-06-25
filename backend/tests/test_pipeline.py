from scripts.pipeline import normalize_pokemon, normalize_species, resource_id
from scripts.import_existing_datasets import imported_types


def test_resource_id_extracts_pokeapi_identifiers():
    assert resource_id('https://pokeapi.co/api/v2/pokemon/25/') == 25
    assert resource_id(None) is None


def test_normalize_pokemon_creates_a_canonical_document():
    payload = {
        'id': 25,
        'name': 'pikachu',
        'is_default': True,
        'order': 35,
        'height': 4,
        'weight': 60,
        'base_experience': 112,
        'species': {'url': 'https://pokeapi.co/api/v2/pokemon-species/25/'},
        'stats': [{'stat': {'name': 'speed'}, 'base_stat': 90}],
        'types': [{'slot': 1, 'type': {'name': 'electric'}}],
        'abilities': [{'slot': 1, 'is_hidden': False, 'ability': {'name': 'static'}}],
        'moves': [{'move': {'name': 'thunderbolt'}}],
        'forms': [{'name': 'pikachu', 'url': 'https://pokeapi.co/api/v2/pokemon-form/25/'}],
        'sprites': {
            'front_default': 'https://example.test/pikachu.png',
            'other': {'official-artwork': {'front_default': 'https://example.test/pikachu-art.png'}},
        },
        'location_area_encounters': 'https://pokeapi.co/api/v2/pokemon/25/encounters',
    }

    document = normalize_pokemon(payload)

    assert document['pokemon_id'] == 25
    assert document['name'] == 'Pikachu'
    assert document['species_id'] == 25
    assert document['types'] == ['electric']
    assert document['stats'] == {'speed': 90}
    assert document['move_names'] == ['thunderbolt']
    assert document['sprites']['official_artwork'].endswith('pikachu-art.png')


def test_normalize_species_preserves_battle_and_species_metadata():
    payload = {
        'id': 25,
        'name': 'pikachu',
        'generation': {'name': 'generation-i'},
        'capture_rate': 190,
        'base_happiness': 50,
        'gender_rate': 4,
        'hatch_counter': 10,
        'is_baby': False,
        'is_legendary': False,
        'is_mythical': False,
        'evolves_from_species': {'name': 'pichu'},
        'evolution_chain': {'url': 'https://pokeapi.co/api/v2/evolution-chain/10/'},
        'color': {'name': 'yellow'},
        'habitat': {'name': 'forest'},
        'shape': {'name': 'quadruped'},
    }

    document = normalize_species(payload)

    assert document['capture_rate'] == 190
    assert document['evolution_chain_id'] == 10
    assert document['evolves_from_species'] == 'pichu'


def test_existing_stats_type_import_reconstructs_damage_relationships():
    rows = [
        {'PrimaryType': 'grass', 'SecondaryType': '', 'against_Fire': 2, 'against_Water': 0.5},
        {'PrimaryType': 'fire', 'SecondaryType': '', 'against_Grass': 2, 'against_Water': 2},
    ]

    records = {record['api_name']: record for record in imported_types(rows)}

    assert 'grass' in records['fire']['damage_relations']['double_damage_to']
    assert 'fire' in records['water']['damage_relations']['double_damage_to']
