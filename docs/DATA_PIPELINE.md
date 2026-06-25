# Data Pipeline

The data pipeline expands the legacy project into a richer MongoDB-backed Pokédex without hardcoding a Pokémon limit.

## Sources and attribution

| Source | Purpose | Notes |
| --- | --- | --- |
| PokéAPI | Pokémon, species, forms, moves, types, evolutions, sprite URLs | Public API used through documented endpoints; review current terms before deployment |
| Existing stats dataset | Legacy stats and local fallback data | Developer-provided; do not redistribute unless license permits |
| Existing sightings dataset | Local sightings and map data | Developer-provided; raw CSV remains ignored |

The project does not scrape sites and does not commit large raw datasets or bulk sprite downloads. By default, canonical records store public sprite URLs rather than binary image files.

## Commands

Run from `backend/` after setting `backend/.env.local`:

```powershell
..\.venv\Scripts\python.exe -m scripts.seed_database
..\.venv\Scripts\python.exe -m scripts.validate_database
```

For PokéAPI-only enrichment when the legacy sightings collections are already loaded:

```powershell
..\.venv\Scripts\python.exe -m scripts.seed_database --skip-legacy
..\.venv\Scripts\python.exe -m scripts.validate_database
```

For a small development smoke test:

```powershell
..\.venv\Scripts\python.exe -m scripts.seed_database --skip-legacy --max-records 25
```

Offline normalization path:

```powershell
..\.venv\Scripts\python.exe -m scripts.import_existing_datasets
..\.venv\Scripts\python.exe -m scripts.validate_database
```

## Import behavior

- Imports use upserts to avoid duplicate canonical records.
- `import_logs` records resource progress and supports resumable imports.
- `--restart` can be used when a clean re-fetch is intentional.
- `--max-records` is only for development smoke tests.
- Validation reports actual collection counts instead of relying on a hardcoded generation limit.

## Normalized collections

| Collection | Description |
| --- | --- |
| `pokemon` | Canonical Pokémon records with types, stats, abilities, sprites, and move references |
| `pokemon_species` | Species metadata, generation, capture rate, color, shape, legendary/mythical flags |
| `pokemon_forms` | Forms and variants |
| `pokemon_moves` | Move metadata for details and battle logic |
| `pokemon_types` | Type metadata and damage relations |
| `pokemon_evolutions` | Evolution-chain documents |
| `pokemon_sightings` | GeoJSON sighting points |
| `pokemon_comments` | User comments |
| `import_logs` | Import checkpoints |

## Index strategy

- `pokemon.pokemon_id`
- `pokemon.name`
- `pokemon.types`
- `pokemon.species_id`
- `pokemon.generation`
- `pokemon.stats.attack`
- `pokemon.stats.defense`
- `pokemon.stats.speed`
- `pokemon_sightings.location` as `2dsphere`
- `pokemon_sightings.pokemon_id`
- source identifiers for idempotent imports

## Validated local seed

The user-validated local seed produced:

| Collection | Count |
| --- | ---: |
| `pokemon` | 1,350 |
| `pokemon_species` | 1,025 |
| `pokemon_forms` | 1,673 |
| `pokemon_moves` | 937 |
| `pokemon_types` | 21 |
| `pokemon_evolutions` | 541 |
| `pokemon_sightings` | 296,021 |

Counts can change as upstream APIs evolve. Run `validate_database.py` after each seed.
