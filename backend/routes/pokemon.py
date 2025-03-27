from flask import Blueprint, jsonify, request
from pymongo import MongoClient
from config import Config
from datetime import datetime
import logging

pokemon_bp = Blueprint('pokemon', __name__)

# MongoDB connection with authentication
client = MongoClient(Config.MONGO_URI)
db = client['PokeMap']
merged_collection = db['MergedPokemonSightings']

# Ensure geospatial index on sightings.location
merged_collection.create_index([("sightings.location", "2dsphere")])

@pokemon_bp.route('/pokemon', methods=['GET'])
def get_all_pokemon():
    try:
        # Extract query parameters
        search_term = request.args.get('searchTerm', '').strip()
        primary_type = request.args.get('primaryType', '').strip()
        secondary_type = request.args.get('secondaryType', '').strip()
        min_height = request.args.get('minHeight', type=float)
        max_height = request.args.get('maxHeight', type=float)
        min_weight = request.args.get('minWeight', type=float)
        max_weight = request.args.get('maxWeight', type=float)
        min_capture_rate = request.args.get('minCaptureRate', type=int)
        max_capture_rate = request.args.get('maxCaptureRate', type=int)
        legendary = request.args.get('legendary', '').strip().lower()
        sort_option = request.args.get('sortOption', 'No.').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('perPage', type=int)  # Optional

        # Build the MongoDB query
        query = {}

        if search_term:
            query['pokemon.name'] = {'$regex': search_term, '$options': 'i'}
        if primary_type:
            query['pokemon.primary_type'] = {'$regex': f'^{primary_type}$', '$options': 'i'}
        if secondary_type:
            query['pokemon.secondary_type'] = {'$regex': f'^{secondary_type}$', '$options': 'i'}
        if min_height is not None or max_height is not None:
            height_query = {}
            if min_height is not None:
                height_query['$gte'] = min_height
            if max_height is not None:
                height_query['$lte'] = max_height
            query['pokemon.height'] = height_query
        if min_weight is not None or max_weight is not None:
            weight_query = {}
            if min_weight is not None:
                weight_query['$gte'] = min_weight
            if max_weight is not None:
                weight_query['$lte'] = max_weight
            query['pokemon.weight'] = weight_query
        if min_capture_rate is not None or max_capture_rate is not None:
            capture_rate_query = {}
            if min_capture_rate is not None:
                capture_rate_query['$gte'] = min_capture_rate
            if max_capture_rate is not None:
                capture_rate_query['$lte'] = max_capture_rate
            query['pokemon.capture_rate'] = capture_rate_query
        if legendary in ['true', 'false']:
            query['pokemon.legendary'] = legendary == 'true'

        # Sorting
        sort_field = 'pokemon.pokemonId'
        sort_direction = 1
        if sort_option == 'Name':
            sort_field = 'pokemon.name'
        elif sort_option == 'HP':
            sort_field = 'pokemon.hp'
            sort_direction = -1
        elif sort_option == 'Attack':
            sort_field = 'pokemon.attack'
            sort_direction = -1
        elif sort_option == 'Defense':
            sort_field = 'pokemon.defense'
            sort_direction = -1
        elif sort_option == 'Speed':
            sort_field = 'pokemon.speed'
            sort_direction = -1
        elif sort_option == 'Height':
            sort_field = 'pokemon.height'
            sort_direction = -1
        elif sort_option == 'Weight':
            sort_field = 'pokemon.weight'
            sort_direction = -1
        elif sort_option == 'Capture Rate':
            sort_field = 'pokemon.capture_rate'
            sort_direction = 1

        total_pokemon = merged_collection.count_documents(query)
        total_pages = 1
        skip = 0
        limit = None
        if per_page:
            skip = (page - 1) * per_page
            limit = per_page
            total_pages = (total_pokemon + per_page - 1) // per_page

        pokemon_data = list(
            merged_collection
            .find(query)
            .sort(sort_field, sort_direction)
            .skip(skip)
            .limit(limit if limit else total_pokemon)
        )

        for pokemon in pokemon_data:
            pokemon['_id'] = str(pokemon['_id'])
            if pokemon.get('image_path'):
                pokemon['image_path'] = str(pokemon['image_path'])
            for sighting in pokemon.get('sightings', []):
                if isinstance(sighting['date'], datetime):
                    sighting['date'] = sighting['date'].isoformat()
            for comment in pokemon.get('comments', []):
                if isinstance(comment['date'], datetime):
                    comment['date'] = comment['date'].isoformat()

        return jsonify({
            'pokemon': pokemon_data,
            'totalPokemon': total_pokemon,
            'totalPages': total_pages,
            'currentPage': page
        }), 200

    except Exception as e:
        logging.error(f"Error in get_all_pokemon: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@pokemon_bp.route('/pokemon/<pokemonId>', methods=['GET'])
def get_pokemon_by_id(pokemonId):
    try:
        # Use pokemonId as a string directly, no conversion to int
        pokemon = merged_collection.find_one({"pokemon.pokemonId": pokemonId})
        if not pokemon:
            logging.debug(f"No Pokémon found for ID: {pokemonId}")
            return jsonify({"error": f"No Pokémon found with ID {pokemonId}. Check if the ID exists in the database."}), 404

        # Convert ObjectId to string for JSON serialization
        pokemon['_id'] = str(pokemon['_id'])
        if pokemon.get('image_path'):
            pokemon['image_path'] = str(pokemon['image_path'])
        # Convert datetime objects to ISO format
        for sighting in pokemon.get('sightings', []):
            if isinstance(sighting['date'], datetime):
                sighting['date'] = sighting['date'].isoformat()
        for comment in pokemon.get('comments', []):
            if isinstance(comment['date'], datetime):
                comment['date'] = comment['date'].isoformat()

        return jsonify(pokemon), 200
    except Exception as e:
        logging.error(f"Error in get_pokemon_by_id for ID {pokemonId}: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@pokemon_bp.route('/pokemon/<pokemonId>/sightings', methods=['GET'])
def get_sightings_by_area(pokemonId):
    try:
        # Keep pokemonId as a string, no conversion
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)
        radius = request.args.get('radius', 10, type=float)

        pokemon = merged_collection.find_one({"pokemon.pokemonId": pokemonId})
        if not pokemon:
            logging.debug(f"No Pokémon found for sightings with ID: {pokemonId}")
            return jsonify({"error": f"Pokémon with ID {pokemonId} not found"}), 404

        sightings = pokemon.get('sightings', [])
        filtered_sightings = sightings

        if latitude is not None and longitude is not None:
            center = [longitude, latitude]  # [lng, lat] order for MongoDB
            radius_in_radians = radius / 6378.137  # Earth's radius in km

            pipeline = [
                {"$match": {"pokemon.pokemonId": pokemonId}},  # String match
                {"$unwind": "$sightings"},
                {
                    "$match": {
                        "sightings.location": {
                            "$geoWithin": {
                                "$centerSphere": [center, radius_in_radians]
                            }
                        }
                    }
                },
                {
                    "$group": {
                        "_id": "$_id",
                        "sightings": {"$push": "$sightings"}
                    }
                }
            ]

            result = list(merged_collection.aggregate(pipeline))
            filtered_sightings = result[0]['sightings'] if result else []

        for sighting in filtered_sightings:
            if isinstance(sighting['date'], datetime):
                sighting['date'] = sighting['date'].isoformat()

        return jsonify(filtered_sightings), 200
    except Exception as e:
        logging.error(f"Error in get_sightings_by_area for ID {pokemonId}: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@pokemon_bp.route('/pokemon/<pokemonId>/comments', methods=['POST'])
def add_comment(pokemonId):
    try:
        # Keep pokemonId as a string, no conversion
        data = request.get_json()
        if not data or 'text' not in data or not data['text'].strip():
            logging.debug(f"Invalid comment data for Pokémon ID {pokemonId}: {data}")
            return jsonify({"error": "Comment text is required"}), 400

        new_comment = {
            "text": data['text'],
            "author": data.get('author', 'CurrentUser'),
            "date": datetime.utcnow()
        }

        result = merged_collection.update_one(
            {"pokemon.pokemonId": pokemonId},  # String match
            {"$push": {"comments": new_comment}}
        )

        if result.matched_count == 0:
            logging.debug(f"No Pokémon found for comment with ID: {pokemonId}")
            return jsonify({"error": f"Pokémon with ID {pokemonId} not found"}), 404
        if result.modified_count == 0:
            logging.debug(f"Comment not added for Pokémon ID {pokemonId} - no changes made")
            return jsonify({"error": f"Comment not added for Pokémon ID {pokemonId}"}), 500

        new_comment['date'] = new_comment['date'].isoformat()
        return jsonify(new_comment), 201
    except Exception as e:
        logging.error(f"Error in add_comment for ID {pokemonId}: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500