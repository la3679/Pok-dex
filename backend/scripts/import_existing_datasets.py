import argparse
import json
from datetime import datetime, timezone

from pymongo import UpdateOne

from scripts.pipeline import create_indexes
from scripts.runtime import database


TYPE_NAMES = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
    'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]
SOURCE_TYPE_FIELDS = {'fighting': 'Fight'}


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


def slug(value):
    return '-'.join(str(value or '').strip().lower().replace('_', ' ').split())


def number(value, default=0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def integer(value, default=0):
    return int(number(value, default))


def imported_types(rows):
    """Reconstruct the type chart from the local stats dataset's defensive multipliers."""
    pure_types = {}
    for row in rows:
        primary = slug(row.get('PrimaryType'))
        secondary = slug(row.get('SecondaryType'))
        if primary in TYPE_NAMES and not secondary and primary not in pure_types:
            pure_types[primary] = row

    documents = []
    for index, attacking in enumerate(TYPE_NAMES, start=1):
        field = f"against_{SOURCE_TYPE_FIELDS.get(attacking, attacking.title())}"
        relations = {'double_damage_to': [], 'half_damage_to': [], 'no_damage_to': []}
        for defending, row in pure_types.items():
            multiplier = number(row.get(field), 1)
            if multiplier == 0:
                relations['no_damage_to'].append(defending)
            elif multiplier > 1:
                relations['double_damage_to'].append(defending)
            elif multiplier < 1:
                relations['half_damage_to'].append(defending)
        documents.append({
            'type_id': index,
            'api_name': attacking,
            'name': attacking.title(),
            'damage_relations': relations,
            'source': 'existing_stats_dataset',
            'updated_at': utc_now(),
        })
    return documents


def import_stats(db, batch_size=250):
    """Normalize the checked-in/local PokemonStats collection without a network download."""
    rows = list(db.PokemonStats.find({}))
    pokemon_operations = []
    species_operations = []
    form_operations = []
    for row in rows:
        pokemon_id = integer(row.get('No'))
        if pokemon_id <= 0:
            continue
        api_name = slug(row.get('name_url') or row.get('Name'))
        types = [slug(row.get('PrimaryType')), slug(row.get('SecondaryType'))]
        types = [pokemon_type for pokemon_type in types if pokemon_type in TYPE_NAMES]
        abilities = []
        for field, hidden in [('Ability1', False), ('Ability2', False), ('HiddenAbility', True)]:
            ability = slug(row.get(field))
            if ability:
                abilities.append({'name': ability, 'is_hidden': hidden, 'slot': len(abilities) + 1})
        document = {
            'pokemon_id': pokemon_id,
            'api_name': api_name,
            'name': row.get('Name') or api_name.title(),
            'species_id': pokemon_id,
            'is_default': True,
            'order': pokemon_id,
            'height_decimeters': round(number(row.get('Height (m)')) * 10),
            'weight_hectograms': round(number(row.get('Weight (kg)')) * 10),
            'base_experience': None,
            'types': types,
            'stats': {
                'hp': integer(row.get('HP')),
                'attack': integer(row.get('Att')),
                'defense': integer(row.get('Def')),
                'special-attack': integer((row.get('S') or {}).get('Att')),
                'special-defense': integer((row.get('S') or {}).get('Def')),
                'speed': integer(row.get('Spd')),
            },
            'abilities': abilities,
            'move_names': [],
            'forms': [{'form_name': api_name, 'form_url': None, 'is_default': True}],
            'sprites': {
                'default': f'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{pokemon_id}.png',
                'official_artwork': f'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{pokemon_id}.png',
            },
            'source': {'provider': 'existing_stats_dataset'},
            'updated_at': utc_now(),
        }
        species = {
            'species_id': pokemon_id,
            'api_name': api_name,
            'name': document['name'],
            'generation': f"generation-{integer(row.get('Generation'))}",
            'capture_rate': integer(row.get('Capture Rate')),
            'base_happiness': integer(row.get('Base Happiness')),
            'is_baby': False,
            'is_legendary': bool(integer(row.get('overall_legendary'))),
            'is_mythical': False,
            'updated_at': utc_now(),
        }
        form = {'pokemon_id': pokemon_id, 'species_id': pokemon_id, 'form_name': api_name, 'form_url': None, 'is_default': True, 'updated_at': utc_now()}
        pokemon_operations.append(UpdateOne({'pokemon_id': pokemon_id}, {'$set': document}, upsert=True))
        species_operations.append(UpdateOne({'species_id': pokemon_id}, {'$set': species}, upsert=True))
        form_operations.append(UpdateOne({'pokemon_id': pokemon_id, 'form_name': api_name}, {'$set': form}, upsert=True))

    for operations, collection in [(pokemon_operations, db.pokemon), (species_operations, db.pokemon_species), (form_operations, db.pokemon_forms)]:
        for start in range(0, len(operations), batch_size):
            collection.bulk_write(operations[start:start + batch_size], ordered=False)
    type_operations = [UpdateOne({'api_name': document['api_name']}, {'$set': document}, upsert=True) for document in imported_types(rows)]
    db.pokemon_types.bulk_write(type_operations, ordered=False)
    create_indexes(db)
    return {'pokemon': len(pokemon_operations), 'species': len(species_operations), 'forms': len(form_operations), 'types': len(type_operations)}


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
    parser.add_argument('--skip-stats', action='store_true')
    parser.add_argument('--restart-sightings', action='store_true', help='Restart the normalized sightings migration from the first source row.')
    args = parser.parse_args()
    db = database()
    create_indexes(db)

    result = {}
    if not args.skip_stats:
        result['stats'] = import_stats(db)
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
