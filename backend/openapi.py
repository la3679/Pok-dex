"""OpenAPI contract for the Pokédex Flask API.

The spec is intentionally explicit instead of inferred from Flask route
metadata so response examples, validation limits, and legacy endpoints stay
clear for recruiters and future contributors.
"""


API_VERSION = '0.13.0'


def parameter(name, location='query', schema=None, description='', required=False, example=None):
    spec = {
        'name': name,
        'in': location,
        'required': required,
        'schema': schema or {'type': 'string'},
        'description': description,
    }
    if example is not None:
        spec['example'] = example
    return spec


POKEMON_ID = parameter(
    'pokemonId',
    'path',
    {'type': 'string'},
    'Numeric Pokémon ID or supported API name.',
    True,
    '25',
)


def json_response(description, schema_ref=None, example=None, status='200'):
    content = {'application/json': {}}
    if schema_ref:
        content['application/json']['schema'] = {'$ref': schema_ref}
    if example is not None:
        content['application/json']['example'] = example
    return {status: {'description': description, 'content': content}}


def error_responses(*statuses):
    messages = {
        '400': 'Invalid request.',
        '404': 'Resource not found.',
        '500': 'Unexpected API error.',
        '503': 'Database unavailable.',
    }
    return {
        status: {
            'description': messages.get(status, 'API error.'),
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/Error'},
                    'example': {'error': messages.get(status, 'API error.'), 'code': 'error_code'},
                }
            },
        }
        for status in statuses
    }


def build_openapi_spec():
    pokemon_card_example = {
        'pokemonId': 25,
        'name': 'Pikachu',
        'types': ['electric'],
        'stats': {'hp': 35, 'attack': 55, 'defense': 40, 'speed': 90},
        'sprites': {'front_default': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'},
    }
    sighting_example = {
        'pokemon_id': 25,
        'name': 'Pikachu',
        'types': ['electric'],
        'appeared_at': '2016-09-07T12:34:56Z',
        'location': {'type': 'Point', 'coordinates': [-73.9857, 40.7484]},
    }

    return {
        'openapi': '3.0.3',
        'info': {
            'title': 'Pokédex Atlas API',
            'version': API_VERSION,
            'description': (
                'REST API for the portfolio Pokédex platform: canonical Pokémon browsing, '
                'forms, moves, evolutions, sightings, comments, type matchups, analytics, '
                'legacy GridFS images, and the prototype battle endpoint.'
            ),
            'license': {'name': 'Project license not specified'},
        },
        'servers': [
            {'url': 'http://localhost:5000', 'description': 'Local Flask development server'},
        ],
        'tags': [
            {'name': 'Health', 'description': 'Service readiness checks'},
            {'name': 'Pokémon', 'description': 'Canonical Pokémon catalog and details'},
            {'name': 'Sightings', 'description': 'Geospatial sightings and map data'},
            {'name': 'Types', 'description': 'Type metadata and effectiveness calculations'},
            {'name': 'Analytics', 'description': 'MongoDB-backed dashboard aggregations'},
            {'name': 'Battle', 'description': 'Legacy/API battle endpoints used by the frontend'},
            {'name': 'Images', 'description': 'Legacy GridFS image delivery'},
            {'name': 'Docs', 'description': 'OpenAPI and Swagger UI documentation'},
        ],
        'paths': {
            '/api/health': {
                'get': {
                    'tags': ['Health'],
                    'summary': 'Check API and MongoDB availability',
                    'responses': {
                        **json_response(
                            'API is healthy.',
                            '#/components/schemas/Health',
                            {'status': 'ok', 'service': 'pokedex-api', 'database': 'ok'},
                        ),
                        **error_responses('503'),
                    },
                }
            },
            '/api/pokemon': {
                'get': {
                    'tags': ['Pokémon'],
                    'summary': 'List Pokémon with search, filters, sorting, and pagination',
                    'parameters': [
                        parameter('page', schema={'type': 'integer', 'minimum': 1, 'default': 1}, description='Page number.', example=1),
                        parameter('perPage', schema={'type': 'integer', 'minimum': 1, 'maximum': 100, 'default': 20}, description='Records per page.', example=20),
                        parameter('searchTerm', description='Case-insensitive name search.', example='pika'),
                        parameter('primaryType', description='Filter by first type slot.', example='electric'),
                        parameter('secondaryType', description='Filter by second type slot.', example='flying'),
                        parameter('ability', description='Filter by ability API name.', example='static'),
                        parameter('form', description='Filter by form API name.', example='pikachu-rock-star'),
                        parameter('generation', description='Filter by species generation.', example='generation-i'),
                        parameter('legendary', schema={'type': 'boolean'}, description='Filter legendary species.', example=False),
                        parameter('sortOption', description='Sort label used by the frontend.', example='Speed'),
                        parameter('minHeight', schema={'type': 'number'}, description='Minimum height in meters.', example=0.4),
                        parameter('maxHeight', schema={'type': 'number'}, description='Maximum height in meters.', example=2),
                        parameter('minWeight', schema={'type': 'number'}, description='Minimum weight in kilograms.', example=5),
                        parameter('maxWeight', schema={'type': 'number'}, description='Maximum weight in kilograms.', example=100),
                    ],
                    'responses': {
                        **json_response(
                            'Paginated Pokémon result.',
                            '#/components/schemas/PokemonList',
                            {'pokemon': [pokemon_card_example], 'totalPokemon': 1350, 'totalPages': 68, 'currentPage': 1},
                        ),
                        **error_responses('400', '500'),
                    },
                }
            },
            '/api/pokemon/{pokemonId}': {
                'get': {
                    'tags': ['Pokémon'],
                    'summary': 'Get a Pokémon detail record',
                    'parameters': [POKEMON_ID],
                    'responses': {
                        **json_response(
                            'Pokémon detail.',
                            '#/components/schemas/PokemonDetail',
                            {'pokemon': pokemon_card_example, 'species': {'generation': 'generation-i'}, 'comments': []},
                        ),
                        **error_responses('404', '500'),
                    },
                }
            },
            '/api/pokemon/{pokemonId}/forms': {
                'get': {
                    'tags': ['Pokémon'],
                    'summary': 'List available forms and variants for a Pokémon',
                    'parameters': [POKEMON_ID],
                    'responses': {
                        **json_response(
                            'Pokémon forms.',
                            None,
                            {'pokemon_id': '25', 'forms': [{'form_name': 'pikachu', 'is_default': True}]},
                        ),
                        **error_responses('404', '500'),
                    },
                }
            },
            '/api/pokemon/{pokemonId}/moves': {
                'get': {
                    'tags': ['Pokémon'],
                    'summary': 'List battle move metadata for a Pokémon',
                    'parameters': [
                        POKEMON_ID,
                        parameter('limit', schema={'type': 'integer', 'minimum': 1, 'maximum': 100, 'default': 50}, description='Maximum moves to return.', example=25),
                    ],
                    'responses': {
                        **json_response('Pokémon moves.', None, {'pokemon_id': '25', 'moves': [{'name': 'Thunder Shock', 'api_name': 'thunder-shock', 'type': 'electric'}]}),
                        **error_responses('400', '404', '500'),
                    },
                }
            },
            '/api/pokemon/{pokemonId}/evolutions': {
                'get': {
                    'tags': ['Pokémon'],
                    'summary': 'Get evolution-chain data for a Pokémon',
                    'parameters': [POKEMON_ID],
                    'responses': {
                        **json_response('Evolution data.', None, {'pokemon_id': 25, 'evolution_chain': None}),
                        **error_responses('404', '500'),
                    },
                }
            },
            '/api/pokemon/{pokemonId}/sightings': {
                'get': {
                    'tags': ['Sightings'],
                    'summary': 'List sightings for one Pokémon',
                    'parameters': [
                        POKEMON_ID,
                        parameter('latitude', schema={'type': 'number', 'minimum': -90, 'maximum': 90}, description='Latitude for radius search.', example=33.4484),
                        parameter('longitude', schema={'type': 'number', 'minimum': -180, 'maximum': 180}, description='Longitude for radius search.', example=-112.074),
                        parameter('radius', schema={'type': 'number', 'minimum': 0.1, 'maximum': 500, 'default': 10}, description='Radius in kilometers.', example=25),
                        parameter('limit', schema={'type': 'integer', 'minimum': 1, 'maximum': 5000, 'default': 1000}, description='Maximum sightings to return.', example=100),
                    ],
                    'responses': {
                        **json_response('Sightings list.', None, [sighting_example]),
                        **error_responses('400', '404', '500'),
                    },
                }
            },
            '/api/sightings': {
                'get': {
                    'tags': ['Sightings'],
                    'summary': 'List map-ready sightings with filters and summary metadata',
                    'parameters': [
                        parameter('pokemonId', schema={'type': 'integer', 'minimum': 1}, description='Optional Pokémon ID filter.', example=9),
                        parameter('latitude', schema={'type': 'number', 'minimum': -90, 'maximum': 90}, description='Latitude for radius search.', example=33.4484),
                        parameter('longitude', schema={'type': 'number', 'minimum': -180, 'maximum': 180}, description='Longitude for radius search.', example=-112.074),
                        parameter('radius', schema={'type': 'number', 'minimum': 0.1, 'maximum': 500, 'default': 25}, description='Radius in kilometers.', example=25),
                        parameter('dateFrom', schema={'type': 'string', 'format': 'date'}, description='Start date, YYYY-MM-DD.', example='2016-09-01'),
                        parameter('dateTo', schema={'type': 'string', 'format': 'date'}, description='End date, YYYY-MM-DD.', example='2016-09-30'),
                        parameter('limit', schema={'type': 'integer', 'minimum': 1, 'maximum': 5000, 'default': 1000}, description='Maximum sightings to return.', example=1000),
                    ],
                    'responses': {
                        **json_response(
                            'Map sightings result.',
                            '#/components/schemas/SightingsResult',
                            {'sightings': [sighting_example], 'summary': {'total': 1368, 'visible': 1000, 'radius_km': 25}},
                        ),
                        **error_responses('400', '500'),
                    },
                }
            },
            '/api/pokemon/{pokemonId}/comments': {
                'post': {
                    'tags': ['Pokémon'],
                    'summary': 'Add a comment to a Pokémon',
                    'parameters': [POKEMON_ID],
                    'requestBody': {
                        'required': True,
                        'content': {
                            'application/json': {
                                'schema': {'$ref': '#/components/schemas/CommentInput'},
                                'example': {'text': 'Fast pick for an electric team.', 'author': 'CurrentUser'},
                            }
                        },
                    },
                    'responses': {
                        **json_response('Created comment.', '#/components/schemas/Comment', {'id': 'comment-1', 'text': 'Fast pick for an electric team.', 'author': 'CurrentUser'}, '201'),
                        **error_responses('400', '404', '500'),
                    },
                }
            },
            '/api/types': {
                'get': {
                    'tags': ['Types'],
                    'summary': 'List Pokémon type metadata',
                    'responses': {
                        **json_response('Type metadata.', None, {'types': [{'api_name': 'electric', 'name': 'Electric'}]}),
                        **error_responses('500'),
                    },
                }
            },
            '/api/type-chart': {
                'get': {
                    'tags': ['Types'],
                    'summary': 'Calculate type-effectiveness multiplier',
                    'parameters': [
                        parameter('attacking', required=True, description='Attacking type API name.', example='electric'),
                        parameter('defending', required=True, description='Comma-separated defending type API names.', example='water,flying'),
                    ],
                    'responses': {
                        **json_response('Type multiplier result.', None, {'attacking': 'electric', 'defending': ['water', 'flying'], 'multiplier': 4}),
                        **error_responses('400', '500'),
                    },
                }
            },
            '/api/analytics/summary': {
                'get': {
                    'tags': ['Analytics'],
                    'summary': 'Get high-level collection totals',
                    'responses': {**json_response('Analytics summary.', '#/components/schemas/AnalyticsSummary', {'pokemon': 1350, 'forms': 1673, 'sightings': 296021, 'legendary': 71}), **error_responses('500')},
                }
            },
            '/api/analytics/types': {
                'get': {
                    'tags': ['Analytics'],
                    'summary': 'Get Pokémon distribution by type',
                    'responses': {**json_response('Type distribution.', None, {'types': [{'type': 'water', 'count': 155}]}), **error_responses('500')},
                }
            },
            '/api/analytics/top-stats': {
                'get': {
                    'tags': ['Analytics'],
                    'summary': 'Get top Pokémon by a base stat',
                    'parameters': [
                        parameter('stat', schema={'type': 'string', 'enum': ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'], 'default': 'attack'}, description='Base stat to rank.', example='speed'),
                        parameter('limit', schema={'type': 'integer', 'minimum': 1, 'maximum': 50, 'default': 10}, description='Maximum rows.', example=10),
                    ],
                    'responses': {**json_response('Stat leaders.', None, {'pokemon': [{'pokemon_id': 25, 'name': 'Pikachu', 'types': ['electric'], 'value': 90}]}), **error_responses('400', '500')},
                }
            },
            '/api/analytics/generations': {
                'get': {
                    'tags': ['Analytics'],
                    'summary': 'Get species distribution by generation',
                    'responses': {**json_response('Generation distribution.', None, {'generations': [{'generation': 'generation-i', 'count': 151, 'legendary': 5, 'mythical': 1}]}), **error_responses('500')},
                }
            },
            '/api/analytics/type-stats': {
                'get': {
                    'tags': ['Analytics'],
                    'summary': 'Get average base stats by type',
                    'responses': {**json_response('Average stats by type.', None, {'types': [{'type': 'electric', 'averages': {'speed': 86.2}}]}), **error_responses('500')},
                }
            },
            '/api/analytics/extremes': {
                'get': {
                    'tags': ['Analytics'],
                    'summary': 'Get tallest and heaviest Pokémon',
                    'responses': {**json_response('Physical extremes.', None, {'tallest': [{'pokemon_id': 890, 'name': 'Eternatus'}], 'heaviest': [{'pokemon_id': 790, 'name': 'Cosmoem'}]}), **error_responses('500')},
                }
            },
            '/api/analytics/sightings': {
                'get': {
                    'tags': ['Analytics'],
                    'summary': 'Get most-sighted Pokémon',
                    'responses': {**json_response('Sighting leaders.', None, {'pokemon': [{'pokemon_id': 16, 'name': 'Pidgey', 'count': 5210}]}), **error_responses('500')},
                }
            },
            '/api/images/{imageId}': {
                'get': {
                    'tags': ['Images'],
                    'summary': 'Fetch a legacy GridFS image',
                    'parameters': [parameter('imageId', 'path', {'type': 'string'}, 'MongoDB ObjectId for the GridFS file.', True, '507f1f77bcf86cd799439011')],
                    'responses': {
                        '200': {'description': 'PNG image.', 'content': {'image/png': {'schema': {'type': 'string', 'format': 'binary'}}}},
                        **error_responses('404', '500'),
                    },
                }
            },
            '/api/game/start': {
                'get': {
                    'tags': ['Battle'],
                    'summary': 'Start a legacy team battle by selecting user and CPU Pokémon',
                    'responses': {**json_response('Battle teams.', None, {'userPokemon': [], 'cpuPokemon': []}), **error_responses('404', '500')},
                }
            },
            '/api/game/turn': {
                'post': {
                    'tags': ['Battle'],
                    'summary': 'Process one legacy battle turn',
                    'requestBody': {
                        'required': True,
                        'content': {
                            'application/json': {
                                'schema': {'$ref': '#/components/schemas/BattleTurnInput'},
                                'example': {'currentTurn': 1, 'userTeam': [], 'cpuTeam': []},
                            }
                        },
                    },
                    'responses': {**json_response('Updated battle state.', None, {'currentTurn': 2, 'battleLog': [], 'gameOver': False, 'winner': None}), **error_responses('400', '500')},
                }
            },
            '/api/docs': {
                'get': {
                    'tags': ['Docs'],
                    'summary': 'Open Swagger UI for the API',
                    'responses': {'200': {'description': 'Swagger UI HTML.'}},
                }
            },
            '/api/docs/openapi.json': {
                'get': {
                    'tags': ['Docs'],
                    'summary': 'Get the OpenAPI JSON document',
                    'responses': {**json_response('OpenAPI document.', None, {'openapi': '3.0.3', 'info': {'title': 'Pokédex Atlas API'}})},
                }
            },
        },
        'components': {
            'schemas': {
                'Error': {
                    'type': 'object',
                    'required': ['error', 'code'],
                    'properties': {
                        'error': {'type': 'string'},
                        'code': {'type': 'string'},
                    },
                },
                'Health': {
                    'type': 'object',
                    'properties': {
                        'status': {'type': 'string'},
                        'service': {'type': 'string'},
                        'database': {'type': 'string'},
                    },
                },
                'PokemonCard': {
                    'type': 'object',
                    'properties': {
                        'pokemonId': {'type': 'integer'},
                        'name': {'type': 'string'},
                        'types': {'type': 'array', 'items': {'type': 'string'}},
                        'stats': {'type': 'object', 'additionalProperties': {'type': 'number'}},
                        'sprites': {'type': 'object', 'additionalProperties': True},
                    },
                },
                'PokemonList': {
                    'type': 'object',
                    'properties': {
                        'pokemon': {'type': 'array', 'items': {'$ref': '#/components/schemas/PokemonCard'}},
                        'totalPokemon': {'type': 'integer'},
                        'totalPages': {'type': 'integer'},
                        'currentPage': {'type': 'integer'},
                    },
                },
                'PokemonDetail': {
                    'type': 'object',
                    'properties': {
                        'pokemon': {'$ref': '#/components/schemas/PokemonCard'},
                        'species': {'type': 'object', 'additionalProperties': True},
                        'comments': {'type': 'array', 'items': {'$ref': '#/components/schemas/Comment'}},
                    },
                },
                'Sighting': {
                    'type': 'object',
                    'properties': {
                        'pokemon_id': {'type': 'integer'},
                        'name': {'type': 'string'},
                        'types': {'type': 'array', 'items': {'type': 'string'}},
                        'appeared_at': {'type': 'string', 'format': 'date-time', 'nullable': True},
                        'location': {'type': 'object', 'additionalProperties': True},
                    },
                },
                'SightingsResult': {
                    'type': 'object',
                    'properties': {
                        'sightings': {'type': 'array', 'items': {'$ref': '#/components/schemas/Sighting'}},
                        'summary': {'type': 'object', 'additionalProperties': True},
                    },
                },
                'CommentInput': {
                    'type': 'object',
                    'required': ['text'],
                    'properties': {
                        'text': {'type': 'string', 'minLength': 1, 'maxLength': 500},
                        'author': {'type': 'string'},
                    },
                },
                'Comment': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'string'},
                        'text': {'type': 'string'},
                        'author': {'type': 'string'},
                        'created_at': {'type': 'string', 'format': 'date-time'},
                    },
                },
                'AnalyticsSummary': {
                    'type': 'object',
                    'properties': {
                        'pokemon': {'type': 'integer'},
                        'forms': {'type': 'integer'},
                        'species': {'type': 'integer'},
                        'moves': {'type': 'integer'},
                        'types': {'type': 'integer'},
                        'sightings': {'type': 'integer'},
                        'comments': {'type': 'integer'},
                        'legendary': {'type': 'integer'},
                        'mythical': {'type': 'integer'},
                    },
                },
                'BattleTurnInput': {
                    'type': 'object',
                    'required': ['userTeam', 'cpuTeam'],
                    'properties': {
                        'currentTurn': {'type': 'integer', 'minimum': 1},
                        'userTeam': {'type': 'array', 'items': {'type': 'object', 'additionalProperties': True}},
                        'cpuTeam': {'type': 'array', 'items': {'type': 'object', 'additionalProperties': True}},
                    },
                },
            }
        },
    }
