import json
import sys

from scripts.runtime import database


REQUIRED_COLLECTIONS = [
    'pokemon',
    'pokemon_species',
    'pokemon_forms',
    'pokemon_moves',
    'pokemon_types',
    'pokemon_evolutions',
    'pokemon_sightings',
    'import_logs',
]


def main():
    db = database()
    counts = {name: db[name].count_documents({}) for name in REQUIRED_COLLECTIONS}
    duplicate_pokemon_ids = list(db.pokemon.aggregate([
        {'$group': {'_id': '$pokemon_id', 'count': {'$sum': 1}}},
        {'$match': {'count': {'$gt': 1}}},
        {'$limit': 10},
    ]))
    malformed_sightings = db.pokemon_sightings.count_documents({
        '$or': [
            {'location.type': {'$ne': 'Point'}},
            {'location.coordinates.0': {'$exists': False}},
            {'location.coordinates.1': {'$exists': False}},
        ]
    })
    report = {
        'counts': counts,
        'duplicate_pokemon_ids': duplicate_pokemon_ids,
        'malformed_sightings': malformed_sightings,
        'valid': bool(counts['pokemon']) and not duplicate_pokemon_ids and not malformed_sightings,
    }
    print(json.dumps(report, indent=2, default=str))
    if not report['valid']:
        sys.exit(1)


if __name__ == '__main__':
    main()
