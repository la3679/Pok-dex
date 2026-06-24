from database import get_database


class PokemonRepository:
    def __init__(self):
        self.db = get_database()

    def list_pokemon(self, query, sort_field, sort_direction, skip, limit):
        total = self.db.pokemon.count_documents(query)
        records = list(self.db.pokemon.find(query).sort(sort_field, sort_direction).skip(skip).limit(limit))
        return records, total

    def find_pokemon(self, pokemon_id):
        return self.db.pokemon.find_one({'pokemon_id': pokemon_id})

    def find_species(self, species_id):
        return self.db.pokemon_species.find_one({'species_id': species_id}) if species_id else None

    def find_forms(self, pokemon_id):
        return list(self.db.pokemon_forms.find({'pokemon_id': pokemon_id}, {'_id': 0}).sort('form_name', 1))

    def find_moves(self, move_names, limit):
        return list(self.db.pokemon_moves.find({'api_name': {'$in': move_names}}, {'_id': 0}).sort('name', 1).limit(limit))

    def find_evolution_chain(self, chain_id):
        return self.db.pokemon_evolutions.find_one({'evolution_chain_id': chain_id}, {'_id': 0}) if chain_id else None

    def find_comments(self, pokemon_id):
        return list(self.db.pokemon_comments.find({'pokemon_id': pokemon_id}, {'_id': 0}).sort('created_at', -1))

    def add_comment(self, document):
        self.db.pokemon_comments.insert_one(document)

    def find_sightings(self, pokemon_id, limit, longitude=None, latitude=None, radius_km=None):
        query = {'pokemon_id': pokemon_id}
        if longitude is not None and latitude is not None:
            query['location'] = {
                '$nearSphere': {
                    '$geometry': {'type': 'Point', 'coordinates': [longitude, latitude]},
                    '$maxDistance': radius_km * 1000,
                }
            }
            return list(self.db.pokemon_sightings.find(query, {'_id': 0}).limit(limit))
        return list(self.db.pokemon_sightings.find(query, {'_id': 0}).sort('appeared_at', -1).limit(limit))

    def list_map_sightings(self, query, limit, longitude=None, latitude=None, radius_km=None):
        if longitude is not None and latitude is not None:
            query = {
                **query,
                'location': {
                    '$nearSphere': {
                        '$geometry': {'type': 'Point', 'coordinates': [longitude, latitude]},
                        '$maxDistance': radius_km * 1000,
                    }
                },
            }
            return list(self.db.pokemon_sightings.find(query, {'_id': 0}).limit(limit))
        return list(self.db.pokemon_sightings.find(query, {'_id': 0}).sort('appeared_at', -1).limit(limit))

    def sighting_count(self, query):
        return self.db.pokemon_sightings.count_documents(query)

    def pokemon_map_metadata(self, pokemon_ids):
        rows = self.db.pokemon.find({'pokemon_id': {'$in': list(pokemon_ids)}}, {'_id': 0, 'pokemon_id': 1, 'name': 1, 'types': 1, 'sprites': 1})
        return {row['pokemon_id']: row for row in rows}

    def find_type(self, api_name):
        return self.db.pokemon_types.find_one({'api_name': api_name}, {'_id': 0})

    def list_types(self):
        return list(self.db.pokemon_types.find({}, {'_id': 0}).sort('type_id', 1))

    def species_ids(self, query):
        return [row['species_id'] for row in self.db.pokemon_species.find(query, {'species_id': 1, '_id': 0})]

    def analytics_summary(self):
        return {
            'pokemon': self.db.pokemon.count_documents({}),
            'forms': self.db.pokemon_forms.count_documents({}),
            'species': self.db.pokemon_species.count_documents({}),
            'moves': self.db.pokemon_moves.count_documents({}),
            'types': self.db.pokemon_types.count_documents({}),
            'sightings': self.db.pokemon_sightings.count_documents({}),
            'comments': self.db.pokemon_comments.count_documents({}),
        }
