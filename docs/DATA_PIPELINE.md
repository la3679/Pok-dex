# Data Pipeline

## Sources and attribution

- **PokéAPI** is the planned canonical source for Pokémon, species, forms, types, abilities, moves, evolution data, and sprite URLs.
- The existing project stats CSV and Pokémon sightings CSV are supplementary local sources. They remain ignored and are imported only from a developer-provided location.

- PokéAPI requests are made against `https://pokeapi.co/api/v2/`; the import log records `pokeapi` as the provider. The project links to PokéAPI in this documentation and must re-check its current service terms, data attribution, and rate guidance before any production deployment.
- The existing sightings source is recorded as `predictemall` in MongoDB. Its downloaded raw CSV remains ignored and must not be redistributed by this repository.
- The project does not scrape sites or commit bulk sprites. Canonical records store source sprite URLs only.

## Planned commands

```powershell
python backend/scripts/fetch_pokemon_data.py
python backend/scripts/import_existing_datasets.py
python backend/scripts/seed_database.py
python backend/scripts/validate_database.py
```

Run the scripts from the `backend` directory after setting `backend/.env.local`:

```powershell
python -m scripts.seed_database
python -m scripts.validate_database
```

`fetch_pokemon_data.py` and `seed_database.py` discover the live PokéAPI catalog dynamically. They default to the full catalog; `--max-records` is available only for development smoke imports. Each resource has an `import_logs` checkpoint, so interrupted imports resume instead of duplicating records.

## Data rules

- Canonical PokéAPI identifiers are the upsert keys.
- Forms remain associated with a species instead of being discarded.
- Sprite URLs are stored as metadata by default; GridFS is opt-in for approved local assets.
- Sightings use GeoJSON coordinates and a `2dsphere` index.
- Validation checks required fields, duplicate identifiers, collection counts, indexes, and invalid coordinates.

## Seeded collection result

The local Phase 2 seed was validated against the live PokéAPI catalog and the approved local sightings source. Collection counts are expected to vary as the upstream API evolves; `validate_database.py` reports the actual counts after every seed rather than relying on a hardcoded generation limit.
