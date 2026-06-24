import argparse
import json
from datetime import datetime, timezone

from pymongo import UpdateOne

from scripts.pipeline import create_indexes
from scripts.runtime import database


def utc_now():
    return datetime.now(timezone.utc)


def parse_date(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            return None
    return None


def import_sightings(db, batch_size=1000, resume=True):
    source = db.PokemonSightings
    target = db.pokemon_sightings
    log_id = 'legacy:sightings'
    checkpoint = db.import_logs.find_one({'_id': log_id}) if resume else None
    last_source_id = checkpoint.get('last_source_id') if checkpoint else None
    query = {'_id': {'$gt': last_source_id}} if last_source_id else {}
    total = source.count_documents({})
    db.import_logs.update_one(
        {'_id': log_id},
        {'$set': {
            'provider': 'predictemall',
            'resource': 'sightings',
            'status': 'running',
            'source_count': total,
            'started_at': utc_now(),
        }},
        upsert=True,
    )
    operations = []
    imported = 0
    processed = 0
    last_processed_id = last_source_id

    for row in source.find(query, {'_id': 1, 'class': 1, 'latitude': 1, 'longitude': 1, 'appearedLocalTime': 1}).sort('_id', 1):
        processed += 1
        last_processed_id = str(row['_id'])
        try:
            latitude = float(row['latitude'])
            longitude = float(row['longitude'])
            pokemon_id = int(row['class'])
        except (KeyError, TypeError, ValueError):
            if processed % batch_size:
                continue
            db.import_logs.update_one(
                {'_id': log_id},
                {'$set': {'last_source_id': last_processed_id, 'processed_count': processed, 'updated_at': utc_now()}},
            )
            continue

        document = {
            'source': 'predictemall',
            'source_id': str(row['_id']),
            'pokemon_id': pokemon_id,
            'location': {'type': 'Point', 'coordinates': [longitude, latitude]},
            'appeared_at': parse_date(row.get('appearedLocalTime')),
            'updated_at': utc_now(),
        }
        operations.append(UpdateOne(
            {'source': document['source'], 'source_id': document['source_id']},
            {'$set': document},
            upsert=True,
        ))

        if processed % batch_size == 0:
            if operations:
                target.bulk_write(operations, ordered=False)
                imported += len(operations)
                operations.clear()
            db.import_logs.update_one(
                {'_id': log_id},
                {'$set': {'last_source_id': last_processed_id, 'processed_count': processed, 'updated_at': utc_now()}},
            )

    if operations:
        target.bulk_write(operations, ordered=False)
        imported += len(operations)
    db.import_logs.update_one(
        {'_id': log_id},
        {'$set': {
            'status': 'completed',
            'last_source_id': last_processed_id,
            'processed_count': processed,
            'completed_at': utc_now(),
        }},
    )
    return imported


def import_comments(db):
    operations = []
    for record in db.MergedPokemonSightings.find({}, {'pokemon.pokemonId': 1, 'comments': 1}):
        pokemon_id = record.get('pokemon', {}).get('pokemonId')
        for index, comment in enumerate(record.get('comments', [])):
            source_id = f"{record['_id']}:{index}"
            document = {
                'source': 'legacy_merged_collection',
                'source_id': source_id,
                'pokemon_id': int(pokemon_id) if str(pokemon_id).isdigit() else pokemon_id,
                'text': comment.get('text', ''),
                'author': comment.get('author', 'CurrentUser'),
                'created_at': parse_date(comment.get('date')) or utc_now(),
            }
            operations.append(UpdateOne(
                {'source': document['source'], 'source_id': source_id},
                {'$set': document},
                upsert=True,
            ))

    if operations:
        db.pokemon_comments.bulk_write(operations, ordered=False)
    return len(operations)


def main():
    parser = argparse.ArgumentParser(description='Normalize the existing local project datasets into target collections.')
    parser.add_argument('--skip-sightings', action='store_true')
    parser.add_argument('--skip-comments', action='store_true')
    parser.add_argument('--restart-sightings', action='store_true', help='Restart the normalized sightings migration from the first source row.')
    args = parser.parse_args()
    db = database()
    create_indexes(db)

    result = {}
    if not args.skip_sightings:
        result['sightings'] = import_sightings(db, resume=not args.restart_sightings)
    if not args.skip_comments:
        result['comments'] = import_comments(db)
    create_indexes(db)
    db.import_logs.update_one(
        {'_id': 'legacy:import'},
        {'$set': {'status': 'completed', 'result': result, 'completed_at': utc_now()}},
        upsert=True,
    )
    print(json.dumps({'status': 'completed', 'result': result}, indent=2, default=str))


if __name__ == '__main__':
    main()
