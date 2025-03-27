from flask import Blueprint, jsonify, request
from pymongo import MongoClient
from config import Config
import random
import logging

game_bp = Blueprint('game', __name__)

# MongoDB connection with authentication
client = MongoClient(Config.MONGO_URI)
db = client['PokeMap']
merged_collection = db['MergedPokemonSightings']

@game_bp.route('/api/game/start', methods=['GET'])
def start_game():
    try:
        # Fetch all Pokémon from MergedPokemonSightings
        all_pokemon = list(merged_collection.find())
        if not all_pokemon:
            logging.error("No Pokémon found in the database.")
            return jsonify({"error": "No Pokémon found in the database."}), 404

        # Ensure no duplicates by using a set of Pokémon IDs
        pokemon_ids = [pokemon['pokemon']['pokemonId'] for pokemon in all_pokemon]
        if len(pokemon_ids) < 10:  # Need at least 10 Pokémon (7 for user, 3 for CPU)
            logging.error("Not enough Pokémon in the database to start the game.")
            return jsonify({"error": "Not enough Pokémon in the database to start the game."}), 404

        # Randomly select 7 Pokémon for the user
        user_pokemon_ids = random.sample(pokemon_ids, 7)
        user_pokemon = []
        for pid in user_pokemon_ids:
            pokemon = next(p for p in all_pokemon if p['pokemon']['pokemonId'] == pid)
            user_pokemon.append({
                "_id": str(pokemon['_id']),
                "pokemon": {
                    "pokemonId": pokemon['pokemon']['pokemonId'],
                    "name": pokemon['pokemon']['name'],
                    "hp": pokemon['pokemon']['hp'],
                    "attack": pokemon['pokemon']['attack'],
                    "defense": pokemon['pokemon']['defense'],
                    "speed": pokemon['pokemon']['speed'],
                    "height": pokemon['pokemon']['height'],
                    "weight": pokemon['pokemon']['weight'],
                    "capture_rate": pokemon['pokemon']['capture_rate'],
                    "primary_type": pokemon['pokemon']['primary_type'],  # Add primary type
                    "secondary_type": pokemon['pokemon']['secondary_type']  # Add secondary type
                },
                "image_path": str(pokemon['image_path']) if pokemon.get('image_path') else None
            })

        # Randomly select 3 Pokémon for the CPU (overlap with user Pokémon is allowed)
        cpu_pokemon_ids = random.sample(pokemon_ids, 3)
        cpu_pokemon = []
        for pid in cpu_pokemon_ids:
            pokemon = next(p for p in all_pokemon if p['pokemon']['pokemonId'] == pid)
            cpu_pokemon.append({
                "_id": str(pokemon['_id']),
                "pokemon": {
                    "pokemonId": pokemon['pokemon']['pokemonId'],
                    "name": pokemon['pokemon']['name'],
                    "hp": pokemon['pokemon']['hp'],
                    "attack": pokemon['pokemon']['attack'],
                    "defense": pokemon['pokemon']['defense'],
                    "speed": pokemon['pokemon']['speed'],
                    "height": pokemon['pokemon']['height'],
                    "weight": pokemon['pokemon']['weight'],
                    "capture_rate": pokemon['pokemon']['capture_rate'],
                    "primary_type": pokemon['pokemon']['primary_type'],  # Add primary type
                    "secondary_type": pokemon['pokemon']['secondary_type']  # Add secondary type
                },
                "image_path": str(pokemon['image_path']) if pokemon.get('image_path') else None
            })

        return jsonify({
            "userPokemon": user_pokemon,
            "cpuPokemon": cpu_pokemon
        }), 200

    except Exception as e:
        logging.error(f"Error in start_game: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@game_bp.route('/api/game/turn', methods=['POST'])
def process_turn():
    try:
        data = request.get_json()
        if not data:
            logging.debug("No data provided in process_turn request.")
            return jsonify({"error": "No data provided."}), 400

        # Extract battle state
        user_team = data.get('userTeam', [])
        cpu_team = data.get('cpuTeam', [])
        current_turn = data.get('currentTurn', 1)

        # Check if the game has already ended
        user_alive = any(p['health'] > 0 for p in user_team)
        cpu_alive = any(p['health'] > 0 for p in cpu_team)

        if not user_alive or not cpu_alive:
            winner = "CPU" if user_alive else "User" if cpu_alive else "Draw"
            return jsonify({
                "userTeam": user_team,
                "cpuTeam": cpu_team,
                "currentTurn": current_turn,
                "battleLog": ["Game has already ended."],
                "gameOver": True,
                "winner": winner
            }), 200

        # Check for maximum turns (10 turns)
        if current_turn > 10:
            user_total_health = sum(p['health'] for p in user_team if p['health'] > 0)
            cpu_total_health = sum(p['health'] for p in cpu_team if p['health'] > 0)
            winner = "User" if user_total_health > cpu_total_health else "CPU" if cpu_total_health > user_total_health else "Draw"
            return jsonify({
                "userTeam": user_team,
                "cpuTeam": cpu_team,
                "currentTurn": current_turn,
                "battleLog": ["Maximum turns reached. Determining winner by remaining health."],
                "gameOver": True,
                "winner": winner
            }), 200

        battle_log = []

        # User's turn to attack
        user_alive_pokemon = [p for p in user_team if p['health'] > 0]  # Only alive Pokémon contribute to attack
        if user_alive_pokemon:
            user_combined_attack = sum(p['attackPower'] for p in user_alive_pokemon)
            user_attack_per_pokemon = user_combined_attack / len(user_alive_pokemon)
            battle_log.append(f"Turn {current_turn}: User's team deals {user_attack_per_pokemon:.2f} damage to all CPU Pokémon.")

            for cpu_pokemon in cpu_team:
                if cpu_pokemon['health'] > 0:
                    cpu_pokemon['health'] -= user_attack_per_pokemon
                    if cpu_pokemon['health'] <= 0:
                        cpu_pokemon['health'] = 0
                        battle_log.append(f"CPU's {cpu_pokemon['pokemon']['name']} faints.")

        # CPU's turn to attack
        cpu_alive_pokemon = [p for p in cpu_team if p['health'] > 0]  # Only alive Pokémon contribute to attack
        if cpu_alive_pokemon:
            cpu_combined_attack = sum(p['attackPower'] for p in cpu_alive_pokemon)
            cpu_attack_per_pokemon = cpu_combined_attack / len(cpu_alive_pokemon)
            battle_log.append(f"Turn {current_turn}: CPU's team deals {cpu_attack_per_pokemon:.2f} damage to all User Pokémon.")

            for user_pokemon in user_team:
                if user_pokemon['health'] > 0:
                    user_pokemon['health'] -= cpu_attack_per_pokemon
                    if user_pokemon['health'] <= 0:
                        user_pokemon['health'] = 0
                        battle_log.append(f"User's {user_pokemon['pokemon']['name']} faints.")

        # Check if the game is over
        user_alive = any(p['health'] > 0 for p in user_team)
        cpu_alive = any(p['health'] > 0 for p in cpu_team)
        game_over = not (user_alive and cpu_alive)
        winner = None
        if game_over:
            winner = "User" if user_alive else "CPU" if cpu_alive else "Draw"
            battle_log.append(f"Game Over! {winner} wins!")

        return jsonify({
            "userTeam": user_team,
            "cpuTeam": cpu_team,
            "currentTurn": current_turn + 1,
            "battleLog": battle_log,
            "gameOver": game_over,
            "winner": winner
        }), 200

    except Exception as e:
        logging.error(f"Error in process_turn: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500