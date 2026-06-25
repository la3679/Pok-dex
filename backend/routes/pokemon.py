import logging

from flask import Blueprint, jsonify, request

from routes.errors import api_error
from services.pokemon_service import PokemonService
from services.validation import ValidationError


pokemon_bp = Blueprint('pokemon', __name__)
service = PokemonService()


def handle_error(error, fallback_code):
    if isinstance(error, ValidationError):
        return api_error(str(error), 400, 'invalid_request')
    if isinstance(error, LookupError):
        return api_error('Pokémon not found.', 404, 'pokemon_not_found')
    logging.exception('Pokémon API request failed.')
    return api_error('Unable to process the Pokémon request right now.', 500, fallback_code)


@pokemon_bp.route('/pokemon', methods=['GET'])
def get_all_pokemon():
    try:
        return jsonify(service.list_pokemon(request.args)), 200
    except Exception as error:
        return handle_error(error, 'pokemon_list_failed')


@pokemon_bp.route('/pokemon/<pokemon_id>', methods=['GET'])
def get_pokemon_by_id(pokemon_id):
    try:
        return jsonify(service.detail(pokemon_id)), 200
    except Exception as error:
        return handle_error(error, 'pokemon_detail_failed')


@pokemon_bp.route('/pokemon/<pokemon_id>/forms', methods=['GET'])
def get_pokemon_forms(pokemon_id):
    try:
        return jsonify({'pokemon_id': pokemon_id, 'forms': service.forms(pokemon_id)}), 200
    except Exception as error:
        return handle_error(error, 'pokemon_forms_failed')


@pokemon_bp.route('/pokemon/<pokemon_id>/moves', methods=['GET'])
def get_pokemon_moves(pokemon_id):
    try:
        return jsonify({'pokemon_id': pokemon_id, 'moves': service.moves(pokemon_id, request.args)}), 200
    except Exception as error:
        return handle_error(error, 'pokemon_moves_failed')


@pokemon_bp.route('/pokemon/<pokemon_id>/evolutions', methods=['GET'])
def get_pokemon_evolutions(pokemon_id):
    try:
        return jsonify(service.evolutions(pokemon_id)), 200
    except Exception as error:
        return handle_error(error, 'pokemon_evolutions_failed')


@pokemon_bp.route('/pokemon/<pokemon_id>/sightings', methods=['GET'])
def get_sightings(pokemon_id):
    try:
        return jsonify(service.sightings(pokemon_id, request.args)), 200
    except Exception as error:
        return handle_error(error, 'sightings_failed')


@pokemon_bp.route('/sightings', methods=['GET'])
def get_map_sightings():
    try:
        return jsonify(service.map_sightings(request.args)), 200
    except Exception as error:
        return handle_error(error, 'map_sightings_failed')


@pokemon_bp.route('/pokemon/<pokemon_id>/comments', methods=['POST'])
def add_comment(pokemon_id):
    try:
        return jsonify(service.add_comment(pokemon_id, request.get_json(silent=True))), 201
    except Exception as error:
        return handle_error(error, 'comment_create_failed')


@pokemon_bp.route('/types', methods=['GET'])
def get_types():
    try:
        return jsonify({'types': service.types()}), 200
    except Exception as error:
        return handle_error(error, 'types_failed')


@pokemon_bp.route('/type-chart', methods=['GET'])
def get_type_chart():
    try:
        return jsonify(service.type_chart(request.args)), 200
    except Exception as error:
        return handle_error(error, 'type_chart_failed')


@pokemon_bp.route('/analytics/summary', methods=['GET'])
def get_analytics_summary():
    try:
        return jsonify(service.analytics_summary()), 200
    except Exception as error:
        return handle_error(error, 'analytics_summary_failed')


@pokemon_bp.route('/analytics/types', methods=['GET'])
def get_analytics_types():
    try:
        return jsonify({'types': service.analytics_types()}), 200
    except Exception as error:
        return handle_error(error, 'analytics_types_failed')


@pokemon_bp.route('/analytics/top-stats', methods=['GET'])
def get_analytics_top_stats():
    try:
        return jsonify({'pokemon': service.analytics_top_stats(request.args)}), 200
    except Exception as error:
        return handle_error(error, 'analytics_top_stats_failed')


@pokemon_bp.route('/analytics/generations', methods=['GET'])
def get_analytics_generations():
    try:
        return jsonify({'generations': service.analytics_generations()}), 200
    except Exception as error:
        return handle_error(error, 'analytics_generations_failed')


@pokemon_bp.route('/analytics/type-stats', methods=['GET'])
def get_analytics_type_stats():
    try:
        return jsonify({'types': service.analytics_type_stats()}), 200
    except Exception as error:
        return handle_error(error, 'analytics_type_stats_failed')


@pokemon_bp.route('/analytics/extremes', methods=['GET'])
def get_analytics_extremes():
    try:
        return jsonify(service.analytics_extremes()), 200
    except Exception as error:
        return handle_error(error, 'analytics_extremes_failed')


@pokemon_bp.route('/analytics/sightings', methods=['GET'])
def get_analytics_sightings():
    try:
        return jsonify({'pokemon': service.analytics_sightings()}), 200
    except Exception as error:
        return handle_error(error, 'analytics_sightings_failed')
