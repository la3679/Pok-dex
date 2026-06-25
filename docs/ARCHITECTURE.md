# Architecture

Pokédex Atlas is a React/Vite client backed by a Flask API and MongoDB. The app is intentionally local-development friendly while still demonstrating production-style separation of concerns, environment configuration, data ingestion, API validation, and quality gates.

## System overview

```mermaid
flowchart LR
  Browser["React + Vite"] -->|"REST /api"| Flask["Flask API"]
  Browser -->|"Maps JavaScript API"| Maps["Google Maps"]
  Flask --> Mongo[("MongoDB")]
  Flask --> GridFS[("GridFS legacy images")]
  Scripts["Seed / import / validate scripts"] --> Mongo
  CI["GitHub Actions"] --> Quality["pytest + Vitest + build + secret scan"]
```

## Frontend responsibilities

- Route-driven React app with pages for the landing experience, Pokédex, detail records, favorites, recent views, profile, compare, type chart, team builder, sightings map, battle, analytics, achievements, quiz, matchup estimator, and about page.
- TanStack Query and Axios handle API reads.
- Browser local storage handles favorites, recently viewed Pokémon, teams, preferences, battle history, achievements, and exports.
- Google Maps is loaded only where needed, using `REACT_APP_GOOGLE_MAPS_API_KEY` from `frontend/.env.local`.
- The heatmap mode uses a custom canvas overlay because Google removed the legacy Heatmap Layer from the Maps JavaScript API.

## Backend responsibilities

- Flask app factory in `backend/app.py`.
- Routes in `backend/routes/`.
- Business rules in `backend/services/`.
- MongoDB query boundaries in `backend/repositories/`.
- Response shaping in `backend/serializers/`.
- Input validation in `backend/services/validation.py`.
- API contract in `backend/openapi.py`, served through `/api/docs/openapi.json` and `/api/docs`.

## MongoDB collections

| Collection | Purpose |
| --- | --- |
| `pokemon` | Canonical browseable Pokémon records and battle-ready stats |
| `pokemon_species` | Species metadata, generation, capture rate, legendary/mythical flags |
| `pokemon_forms` | Form and variant records |
| `pokemon_moves` | Move metadata used by detail and battle features |
| `pokemon_types` | Type metadata and damage relations |
| `pokemon_evolutions` | Evolution-chain data |
| `pokemon_sightings` | GeoJSON sightings with geospatial indexes |
| `pokemon_comments` | User comments separated from canonical records |
| `import_logs` | Resumable import checkpoints and source metadata |
| `images.files` / `images.chunks` | Legacy GridFS image support |

## API request flow

```mermaid
sequenceDiagram
  participant UI as React UI
  participant API as Flask API
  participant Service as Service layer
  participant Repo as Repository layer
  participant DB as MongoDB
  UI->>API: GET /api/pokemon?filters
  API->>Service: Validate and normalize parameters
  Service->>Repo: Request indexed query
  Repo->>DB: MongoDB find/aggregate
  DB-->>Repo: Documents
  Repo-->>Service: Domain records
  Service-->>API: Serialized response
  API-->>UI: JSON
```

## Data ingestion flow

```mermaid
flowchart TD
  PokeAPI["PokéAPI metadata and sprites"] --> Fetch["fetch_pokemon_data.py"]
  LocalStats["Approved local stats CSV"] --> Legacy["import_existing_datasets.py"]
  LocalSightings["Approved local sightings CSV"] --> Legacy
  Fetch --> Seed["seed_database.py"]
  Legacy --> Seed
  Seed --> Mongo[("MongoDB")]
  Mongo --> Validate["validate_database.py"]
```

## Image and GridFS flow

The preferred strategy is to store safe public sprite URLs from PokéAPI. GridFS remains for legacy/local assets when they are intentionally imported and license-safe. Large image dumps should not be committed.

## Environment flow

```mermaid
flowchart LR
  BackendEnv["backend/.env.local"] --> Flask["Flask"]
  FrontendEnv["frontend/.env.local"] --> Vite["Vite"]
  Flask --> Mongo[("MongoDB")]
  Vite --> Browser["Browser runtime"]
  Browser --> Maps["Google Maps"]
```

- `backend/.env.local` supplies `MONGO_URI`, `MONGO_DATABASE`, Flask settings, and allowed frontend origins.
- `frontend/.env.local` supplies `REACT_APP_API_BASE_URL` and `REACT_APP_GOOGLE_MAPS_API_KEY`.
- Example files contain placeholders only.
- Real keys and credentials stay local.

## Local development flow

Docker can run only MongoDB for the fastest native Windows workflow, or it can run MongoDB, Flask, and Vite together for full-stack container verification. Tool containers provide repeatable seed, validation, backend-test, frontend-test, and frontend-build commands.
