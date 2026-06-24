import math
import re
from datetime import datetime, time, timezone

from repositories.pokemon_repository import PokemonRepository
from serializers.pokemon import comment as serialize_comment
from serializers.pokemon import pokemon_card, sighting
from services.validation import ValidationError, decimal, integer, optional_integer


SORT_OPTIONS = {
    'No.': ('pokemon_id', 1),
    'Name': ('name', 1),
    'HP': ('stats.hp', -1),
    'Attack': ('stats.attack', -1),
    'Defense': ('stats.defense', -1),
    'Speed': ('stats.speed', -1),
    'Height': ('height_decimeters', -1),
    'Weight': ('weight_hectograms', -1),
    'Capture Rate': ('capture_rate', 1),
}


class PokemonService:
    def __init__(self, repository=None):
        self.repository = repository or PokemonRepository()

    def list_pokemon(self, args):
        page = integer(args.get('page'), 'page', default=1, minimum=1)
        per_page = integer(args.get('perPage'), 'perPage', default=20, minimum=1, maximum=100)
        sort_option = args.get('sortOption', 'No.')
        if sort_option not in SORT_OPTIONS:
            raise ValidationError('sortOption is not supported.')

        query = self._build_list_query(args)
        sort_field, sort_direction = SORT_OPTIONS[sort_option]
        records, total = self.repository.list_pokemon(query, sort_field, sort_direction, (page - 1) * per_page, per_page)
        return {
            'pokemon': [pokemon_card(record) for record in records],
            'totalPokemon': total,
            'totalPages': max(1, math.ceil(total / per_page)),
            'currentPage': page,
        }

    def _build_list_query(self, args):
        query = {}
        search_term = (args.get('searchTerm') or '').strip()
        if search_term:
            query['name'] = {'$regex': re.escape(search_term), '$options': 'i'}
        primary_type = (args.get('primaryType') or '').strip().lower()
        secondary_type = (args.get('secondaryType') or '').strip().lower()
        if primary_type:
            query['types.0'] = primary_type
        if secondary_type:
            query['types.1'] = secondary_type
        ability = (args.get('ability') or '').strip().lower()
        if ability:
            query['abilities.name'] = ability
        form = (args.get('form') or '').strip().lower()
        if form:
            query['forms.form_name'] = form

        self._range(query, 'height_decimeters', decimal(args.get('minHeight'), 'minHeight', minimum=0), decimal(args.get('maxHeight'), 'maxHeight', minimum=0), scale=10)
        self._range(query, 'weight_hectograms', decimal(args.get('minWeight'), 'minWeight', minimum=0), decimal(args.get('maxWeight'), 'maxWeight', minimum=0), scale=10)
        self._range(query, 'capture_rate', optional_integer(args.get('minCaptureRate'), 'minCaptureRate', minimum=0), optional_integer(args.get('maxCaptureRate'), 'maxCaptureRate', minimum=0))

        generation = (args.get('generation') or '').strip().lower()
        legendary = (args.get('legendary') or '').strip().lower()
        if legendary and legendary not in {'true', 'false'}:
            raise ValidationError('legendary must be true or false.')
        species_query = {}
        if generation:
            species_query['generation'] = generation
        if legendary:
            species_query['is_legendary'] = legendary == 'true'
        if species_query:
            species_ids = self.repository.species_ids(species_query)
            query['species_id'] = {'$in': species_ids}
        return query

    @staticmethod
    def _range(query, field, minimum, maximum, scale=1):
        if minimum is None and maximum is None:
            return
        if minimum is not None and maximum is not None and minimum > maximum:
            raise ValidationError(f'{field} minimum cannot exceed maximum.')
        conditions = {}
        if minimum is not None:
            conditions['$gte'] = minimum * scale
        if maximum is not None:
            conditions['$lte'] = maximum * scale
        query[field] = conditions

    def detail(self, pokemon_id):
        record = self._require_pokemon(pokemon_id)
        species = self.repository.find_species(record.get('species_id')) or {}
        response = pokemon_card({**record, 'capture_rate': species.get('capture_rate')})
        response.update({
            'species': self._serialize_species(species),
            'comments': [serialize_comment(item) for item in self.repository.find_comments(record['pokemon_id'])],
            'sightings': [],
        })
        return response

    def forms(self, pokemon_id):
        record = self._require_pokemon(pokemon_id)
        return self.repository.find_forms(record['pokemon_id'])

    def moves(self, pokemon_id, args):
        record = self._require_pokemon(pokemon_id)
        limit = integer(args.get('limit'), 'limit', default=50, minimum=1, maximum=100)
        return self.repository.find_moves(record.get('move_names', []), limit)

    def evolutions(self, pokemon_id):
        record = self._require_pokemon(pokemon_id)
        species = self.repository.find_species(record.get('species_id')) or {}
        chain = self.repository.find_evolution_chain(species.get('evolution_chain_id'))
        return {'pokemon_id': record['pokemon_id'], 'evolution_chain': chain}

    def sightings(self, pokemon_id, args):
        record = self._require_pokemon(pokemon_id)
        latitude = decimal(args.get('latitude'), 'latitude', minimum=-90, maximum=90)
        longitude = decimal(args.get('longitude'), 'longitude', minimum=-180, maximum=180)
        if (latitude is None) != (longitude is None):
            raise ValidationError('latitude and longitude must be supplied together.')
        radius = decimal(args.get('radius'), 'radius', default=10, minimum=0.1, maximum=500)
        limit = integer(args.get('limit'), 'limit', default=1000, minimum=1, maximum=5000)
        records = self.repository.find_sightings(record['pokemon_id'], limit, longitude, latitude, radius)
        return [sighting(item) for item in records]

    def map_sightings(self, args):
        pokemon_id = optional_integer(args.get('pokemonId'), 'pokemonId', minimum=1)
        latitude = decimal(args.get('latitude'), 'latitude', minimum=-90, maximum=90)
        longitude = decimal(args.get('longitude'), 'longitude', minimum=-180, maximum=180)
        if (latitude is None) != (longitude is None):
            raise ValidationError('latitude and longitude must be supplied together.')
        radius = decimal(args.get('radius'), 'radius', default=25, minimum=0.1, maximum=500)
        limit = integer(args.get('limit'), 'limit', default=1000, minimum=1, maximum=5000)
        query = {}
        if pokemon_id:
            self._require_pokemon(pokemon_id)
            query['pokemon_id'] = pokemon_id
        start = self._date(args.get('dateFrom'), 'dateFrom', end=False)
        end = self._date(args.get('dateTo'), 'dateTo', end=True)
        if start and end and start > end:
            raise ValidationError('dateFrom cannot be later than dateTo.')
        if start or end:
            query['appeared_at'] = {}
            if start:
                query['appeared_at']['$gte'] = start
            if end:
                query['appeared_at']['$lte'] = end
        records = self.repository.list_map_sightings(query, limit, longitude, latitude, radius)
        metadata = self.repository.pokemon_map_metadata({record['pokemon_id'] for record in records})
        items = []
        for record in records:
            pokemon = metadata.get(record['pokemon_id'], {})
            items.append({
                'id': record.get('source_id') or f"{record['pokemon_id']}:{record.get('appeared_at', '')}",
                'pokemon_id': record['pokemon_id'],
                'pokemon_name': pokemon.get('name', f"Pokémon #{record['pokemon_id']}"),
                'types': pokemon.get('types', []),
                'image_url': pokemon.get('sprites', {}).get('official_artwork') or pokemon.get('sprites', {}).get('default'),
                'location': record['location'],
                'date': record.get('appeared_at').isoformat() if record.get('appeared_at') else None,
                'source': record.get('source'),
            })
        all_filtered = self.repository.sighting_count(query)
        dates = [item['date'] for item in items if item['date']]
        return {
            'sightings': items,
            'summary': {
                'total': all_filtered,
                'visible': len(items),
                'radius_km': radius if latitude is not None else None,
                'first_date': min(dates) if dates else None,
                'latest_date': max(dates) if dates else None,
            },
        }

    def add_comment(self, pokemon_id, payload):
        record = self._require_pokemon(pokemon_id)
        payload = payload or {}
        text = (payload.get('text') or '').strip()
        author = (payload.get('author') or 'CurrentUser').strip()
        if not text:
            raise ValidationError('Comment text is required.')
        if len(text) > 1000:
            raise ValidationError('Comment text must not exceed 1000 characters.')
        if not author or len(author) > 80:
            raise ValidationError('author must contain between 1 and 80 characters.')
        document = {
            'source': 'api',
            'pokemon_id': record['pokemon_id'],
            'text': text,
            'author': author,
            'created_at': datetime.now(timezone.utc),
        }
        self.repository.add_comment(document)
        return serialize_comment(document)

    def types(self):
        return self.repository.list_types()

    def type_chart(self, args):
        attacking = (args.get('attacking') or '').strip().lower()
        defending = [value.strip().lower() for value in (args.get('defending') or '').split(',') if value.strip()]
        if not attacking or not defending:
            raise ValidationError('attacking and defending type values are required.')
        attacking_type = self.repository.find_type(attacking)
        if not attacking_type:
            raise ValidationError('attacking is not a supported type.')
        multiplier = 1
        relations = attacking_type.get('damage_relations', {})
        for defending_type in defending:
            if not self.repository.find_type(defending_type):
                raise ValidationError(f'{defending_type} is not a supported type.')
            if defending_type in relations.get('double_damage_to', []):
                multiplier *= 2
            elif defending_type in relations.get('half_damage_to', []):
                multiplier *= 0.5
            elif defending_type in relations.get('no_damage_to', []):
                multiplier = 0
        return {'attacking': attacking, 'defending': defending, 'multiplier': multiplier}

    def analytics_summary(self):
        return self.repository.analytics_summary()

    def analytics_types(self):
        return list(self.repository.db.pokemon.aggregate([
            {'$unwind': '$types'},
            {'$group': {'_id': '$types', 'count': {'$sum': 1}}},
            {'$project': {'_id': 0, 'type': '$_id', 'count': 1}},
            {'$sort': {'count': -1, 'type': 1}},
        ]))

    def analytics_top_stats(self, args):
        stat = (args.get('stat') or 'attack').strip().lower()
        if stat not in {'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'}:
            raise ValidationError('stat is not supported.')
        limit = integer(args.get('limit'), 'limit', default=10, minimum=1, maximum=50)
        return list(self.repository.db.pokemon.find({}, {'_id': 0, 'name': 1, 'pokemon_id': 1, f'stats.{stat}': 1}).sort(f'stats.{stat}', -1).limit(limit))

    def _require_pokemon(self, pokemon_id):
        pokemon_id = integer(pokemon_id, 'pokemonId', minimum=1)
        record = self.repository.find_pokemon(pokemon_id)
        if not record:
            raise LookupError('Pokémon not found.')
        return record

    @staticmethod
    def _date(value, name, end):
        if not value:
            return None
        try:
            parsed = datetime.fromisoformat(value).date()
        except ValueError:
            raise ValidationError(f'{name} must use YYYY-MM-DD.') from None
        return datetime.combine(parsed, time.max if end else time.min, tzinfo=timezone.utc)

    @staticmethod
    def _serialize_species(species):
        keys = ('species_id', 'name', 'generation', 'capture_rate', 'is_baby', 'is_legendary', 'is_mythical', 'color', 'habitat', 'shape')
        return {key: species.get(key) for key in keys}
