import argparse
import json

from scripts.pipeline import PokeApiClient, create_indexes, sync_forms_from_pokemon, sync_resource
from scripts.runtime import database


def parse_args():
    parser = argparse.ArgumentParser(description='Fetch canonical Pokémon records from PokéAPI.')
    parser.add_argument('--max-records', type=int, help='Optional development-only cap for a smoke import.')
    parser.add_argument('--restart', action='store_true', help='Restart each resource instead of resuming its checkpoint.')
    parser.add_argument('--delay', type=float, default=0.08, help='Delay between PokéAPI requests in seconds.')
    parser.add_argument('--skip-moves', action='store_true', help='Skip move metadata for a faster smoke import.')
    return parser.parse_args()


def main():
    args = parse_args()
    db = database()
    client = PokeApiClient(delay_seconds=args.delay)
    resources = ['pokemon', 'pokemon-species', 'type', 'evolution-chain']
    if not args.skip_moves:
        resources.insert(2, 'move')

    results = [
        sync_resource(db, client, resource, max_records=args.max_records, resume=not args.restart)
        for resource in resources
    ]
    forms = sync_forms_from_pokemon(db)
    create_indexes(db)
    print(json.dumps({'status': 'completed', 'resources': results, 'forms': forms}, indent=2))


if __name__ == '__main__':
    main()
