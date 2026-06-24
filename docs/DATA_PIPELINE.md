# Data Pipeline

## Sources

- **PokéAPI** is the planned canonical source for Pokémon, species, forms, types, abilities, moves, evolution data, and sprite URLs.
- The existing project stats CSV and Pokémon sightings CSV are supplementary local sources. They remain ignored and are imported only from a developer-provided location.

Before implementation, each source’s current license, terms, rate guidance, and attribution requirements must be recorded in this document. The seed process must not scrape unapproved websites or commit raw downloads.

## Planned commands

```powershell
python backend/scripts/fetch_pokemon_data.py
python backend/scripts/import_existing_datasets.py
python backend/scripts/seed_database.py
python backend/scripts/validate_database.py
```

The scripts will be added in Phase 2. They will use idempotent upserts, rate limiting, retries with backoff, import checkpoints, structured progress logs, and explicit index creation.

## Data rules

- Canonical PokéAPI identifiers are the upsert keys.
- Forms remain associated with a species instead of being discarded.
- Sprite URLs are stored as metadata by default; GridFS is opt-in for approved local assets.
- Sightings use GeoJSON coordinates and a `2dsphere` index.
- Validation checks required fields, duplicate identifiers, collection counts, indexes, and invalid coordinates.
