import argparse
import json

from scripts.fetch_pokemon_data import PokeApiClient, create_indexes, sync_forms_from_pokemon, sync_resource
from scripts.import_existing_datasets import import_comments, import_sightings, import_stats
from scripts.runtime import database


def main():
    parser = argparse.ArgumentParser(description='Seed the complete local Pokédex database.')
    parser.add_argument('--max-records', type=int, help='Optional development-only PokéAPI smoke-import cap.')
    parser.add_argument('--skip-moves', action='store_true')
    parser.add_argument('--skip-legacy', action='store_true')
    parser.add_argument('--restart', action='store_true')
    args = parser.parse_args()

    db = database()
    client = PokeApiClient()
    resources = ['pokemon', 'pokemon-species', 'type', 'evolution-chain']
    if not args.skip_moves:
        resources.insert(2, 'move')
    result = {
        'pokeapi': [
            sync_resource(db, client, resource, max_records=args.max_records, resume=not args.restart)
            for resource in resources
        ]
    }
    result['forms'] = sync_forms_from_pokemon(db)
    if not args.skip_legacy:
        result['legacy'] = {
            'stats': import_stats(db),
            'sightings': import_sightings(db, resume=not args.restart),
            'comments': import_comments(db),
        }
    create_indexes(db)
    print(json.dumps({'status': 'completed', 'result': result}, indent=2, default=str))


if __name__ == '__main__':
    main()
