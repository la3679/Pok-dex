import time
from collections.abc import Callable
from datetime import datetime, timezone
from urllib.parse import urlparse

import requests
from pymongo import UpdateOne

API_ROOT = 'https://pokeapi.co/api/v2'
RESOURCE_COLLECTIONS = {
    'pokemon': 'pokemon',
    'pokemon-species': 'pokemon_species',
    'move': 'pokemon_moves',
    'type': 'pokemon_types',
    'evolution-chain': 'pokemon_evolutions',
}


def utc_now():
    return datetime.now(timezone.utc)


def resource_id(url):
    if not url:
        return None
    path_parts = [part for part in urlparse(url).path.split('/') if part]
    return int(path_parts[-1]) if path_parts and path_parts[-1].isdigit() else None


def display_name(name):
    return name.replace('-', ' ').title()


def normalize_pokemon(payload):
    stats = {item['stat']['name']: item['base_stat'] for item in payload.get('stats', [])}
    forms = [
        {
            'form_name': form['name'],
            'form_url': form['url'],
            'is_default': form['name'] == payload['name'],
        }
        for form in payload.get('forms', [])
    ]
    return {
        'pokemon_id': payload['id'],
        'api_name': payload['name'],
        'name': display_name(payload['name']),
        'species_id': resource_id(payload.get('species', {}).get('url')),
        'is_default': payload.get('is_default', False),
        'order': payload.get('order'),
        'height_decimeters': payload.get('height'),
        'weight_hectograms': payload.get('weight'),
        'base_experience': payload.get('base_experience'),
        'types': [item['type']['name'] for item in sorted(payload.get('types', []), key=lambda item: item['slot'])],
        'stats': stats,
        'abilities': [
            {
                'name': item['ability']['name'],
                'is_hidden': item['is_hidden'],
                'slot': item['slot'],
            }
            for item in payload.get('abilities', [])
        ],
        'move_names': sorted({item['move']['name'] for item in payload.get('moves', [])}),
        'forms': forms,
        'sprites': {
            'default': payload.get('sprites', {}).get('front_default'),
            'official_artwork': payload.get('sprites', {}).get('other', {}).get('official-artwork', {}).get('front_default'),
        },
        'source': {'provider': 'pokeapi', 'url': payload.get('location_area_encounters')},
        'updated_at': utc_now(),
    }


def normalize_species(payload):
    return {
        'species_id': payload['id'],
        'api_name': payload['name'],
        'name': display_name(payload['name']),
        'generation': (payload.get('generation') or {}).get('name'),
        'capture_rate': payload.get('capture_rate'),
        'base_happiness': payload.get('base_happiness'),
        'gender_rate': payload.get('gender_rate'),
        'hatch_counter': payload.get('hatch_counter'),
        'is_baby': payload.get('is_baby', False),
        'is_legendary': payload.get('is_legendary', False),
        'is_mythical': payload.get('is_mythical', False),
        'evolves_from_species': (payload.get('evolves_from_species') or {}).get('name'),
        'evolution_chain_id': resource_id((payload.get('evolution_chain') or {}).get('url')),
        'color': (payload.get('color') or {}).get('name'),
        'habitat': (payload.get('habitat') or {}).get('name'),
        'shape': (payload.get('shape') or {}).get('name'),
        'updated_at': utc_now(),
    }


def normalize_move(payload):
    return {
        'move_id': payload['id'],
        'api_name': payload['name'],
        'name': display_name(payload['name']),
        'type': payload.get('type', {}).get('name'),
        'damage_class': payload.get('damage_class', {}).get('name'),
        'power': payload.get('power'),
        'accuracy': payload.get('accuracy'),
        'pp': payload.get('pp'),
        'priority': payload.get('priority'),
        'effect_chance': payload.get('effect_chance'),
        'target': payload.get('target', {}).get('name'),
        'updated_at': utc_now(),
    }


def normalize_type(payload):
    relations = payload.get('damage_relations', {})
    return {
        'type_id': payload['id'],
        'api_name': payload['name'],
        'name': display_name(payload['name']),
        'damage_relations': {
            relation: [entry['name'] for entry in values]
            for relation, values in relations.items()
        },
        'updated_at': utc_now(),
    }


def normalize_evolution_chain(payload):
    return {
        'evolution_chain_id': payload['id'],
        'chain': payload.get('chain', {}),
        'updated_at': utc_now(),
    }


NORMALIZERS: dict[str, Callable] = {
    'pokemon': normalize_pokemon,
    'pokemon-species': normalize_species,
    'move': normalize_move,
    'type': normalize_type,
    'evolution-chain': normalize_evolution_chain,
}
IDENTIFIER_FIELDS = {
    'pokemon': 'pokemon_id',
    'pokemon-species': 'species_id',
    'move': 'move_id',
    'type': 'type_id',
    'evolution-chain': 'evolution_chain_id',
}


class PokeApiClient:
    def __init__(self, delay_seconds=0.08, timeout_seconds=30):
        self.delay_seconds = delay_seconds
        self.timeout_seconds = timeout_seconds
        self.session = requests.Session()

    def get_json(self, url, retries=3):
        for attempt in range(retries):
            try:
                response = self.session.get(url, timeout=self.timeout_seconds)
                response.raise_for_status()
                time.sleep(self.delay_seconds)
                return response.json()
            except requests.RequestException:
                if attempt == retries - 1:
                    raise
                time.sleep((attempt + 1) * 2)

    def list_resource(self, resource):
        payload = self.get_json(f'{API_ROOT}/{resource}?limit=100000&offset=0')
        return payload['count'], payload['results']


def sync_resource(db, client, resource, max_records=None, resume=True, batch_size=25):
    collection = db[RESOURCE_COLLECTIONS[resource]]
    normalizer = NORMALIZERS[resource]
    identifier = IDENTIFIER_FIELDS[resource]
    log_id = f'pokeapi:{resource}'
    expected_count, entries = client.list_resource(resource)
    target_count = min(len(entries), max_records) if max_records else len(entries)
    checkpoint = db.import_logs.find_one({'_id': log_id}) if resume else None
    start_index = min(checkpoint.get('next_index', 0), target_count) if checkpoint else 0

    db.import_logs.update_one(
        {'_id': log_id},
        {'$set': {
            'provider': 'pokeapi',
            'resource': resource,
            'status': 'running',
            'expected_count': expected_count,
            'target_count': target_count,
            'started_at': utc_now(),
        }},
        upsert=True,
    )

    operations = []
    for index, entry in enumerate(entries[start_index:target_count], start=start_index):
        document = normalizer(client.get_json(entry['url']))
        operations.append(UpdateOne({identifier: document[identifier]}, {'$set': document}, upsert=True))

        if len(operations) == batch_size or index == target_count - 1:
            collection.bulk_write(operations, ordered=False)
            operations.clear()
            db.import_logs.update_one(
                {'_id': log_id},
                {'$set': {'next_index': index + 1, 'updated_at': utc_now()}},
            )

    db.import_logs.update_one(
        {'_id': log_id},
        {'$set': {'status': 'completed', 'next_index': target_count, 'completed_at': utc_now()}},
    )
    return {'resource': resource, 'expected_count': expected_count, 'processed_count': target_count}


def sync_forms_from_pokemon(db, batch_size=250):
    operations = []
    processed = 0
    for pokemon in db.pokemon.find({}, {'pokemon_id': 1, 'species_id': 1, 'forms': 1}):
        for form in pokemon.get('forms', []):
            document = {
                'pokemon_id': pokemon['pokemon_id'],
                'species_id': pokemon.get('species_id'),
                'form_name': form['form_name'],
                'form_url': form['form_url'],
                'is_default': form['is_default'],
                'updated_at': utc_now(),
            }
            operations.append(UpdateOne(
                {'pokemon_id': document['pokemon_id'], 'form_name': document['form_name']},
                {'$set': document},
                upsert=True,
            ))
        if len(operations) >= batch_size:
            db.pokemon_forms.bulk_write(operations, ordered=False)
            processed += len(operations)
            operations.clear()
    if operations:
        db.pokemon_forms.bulk_write(operations, ordered=False)
        processed += len(operations)
    return processed


def create_indexes(db):
    db.pokemon.create_index('pokemon_id', unique=True)
    db.pokemon.create_index('api_name', unique=True)
    db.pokemon.create_index('name')
    db.pokemon.create_index('types')
    db.pokemon.create_index('species_id')
    db.pokemon.create_index('abilities.name')
    db.pokemon.create_index('forms.form_name')
    db.pokemon.create_index('stats.attack')
    db.pokemon.create_index('stats.defense')
    db.pokemon.create_index('stats.speed')
    db.pokemon_forms.create_index([('pokemon_id', 1), ('form_name', 1)], unique=True)
    db.pokemon_forms.create_index('species_id')
    db.pokemon_species.create_index('species_id', unique=True)
    db.pokemon_species.create_index('generation')
    db.pokemon_species.create_index('is_legendary')
    db.pokemon_species.create_index('is_mythical')
    db.pokemon_moves.create_index('move_id', unique=True)
    db.pokemon_types.create_index('type_id', unique=True)
    db.pokemon_evolutions.create_index('evolution_chain_id', unique=True)
    db.pokemon_sightings.create_index([('location', '2dsphere')])
    db.pokemon_sightings.create_index([('pokemon_id', 1), ('appeared_at', -1)])
    db.pokemon_sightings.create_index([('source', 1), ('source_id', 1)], unique=True)
    db.pokemon_comments.create_index([('pokemon_id', 1), ('created_at', -1)])
