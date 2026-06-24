from datetime import datetime


def iso(value):
    return value.isoformat() if isinstance(value, datetime) else value


def pokemon_card(record):
    types = record.get('types', [])
    stats = record.get('stats', {})
    return {
        '_id': str(record['pokemon_id']),
        'pokemon': {
            'pokemonId': str(record['pokemon_id']),
            'name': record['name'],
            'hp': stats.get('hp', 0),
            'attack': stats.get('attack', 0),
            'defense': stats.get('defense', 0),
            'speed': stats.get('speed', 0),
            'special_attack': stats.get('special-attack', 0),
            'special_defense': stats.get('special-defense', 0),
            'height': (record.get('height_decimeters') or 0) / 10,
            'weight': (record.get('weight_hectograms') or 0) / 10,
            'capture_rate': record.get('capture_rate'),
            'base_experience': record.get('base_experience'),
            'primary_type': types[0] if types else None,
            'secondary_type': types[1] if len(types) > 1 else None,
        },
        'image_path': None,
        'image_url': record.get('sprites', {}).get('official_artwork') or record.get('sprites', {}).get('default'),
        'abilities': [
            {'name': ability.get('name'), 'is_hidden': ability.get('is_hidden', False)}
            for ability in record.get('abilities', [])
        ],
    }


def comment(document):
    return {
        'id': str(document.get('_id', document.get('source_id', ''))),
        'text': document['text'],
        'author': document['author'],
        'date': iso(document['created_at']),
    }


def sighting(document):
    return {
        'location': document['location'],
        'date': iso(document.get('appeared_at')),
        'source': document.get('source'),
    }
