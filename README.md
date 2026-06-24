# Pokédex Platform

A full-stack Pokémon exploration project built with React, Vite, Flask, and MongoDB. The current application includes a redesigned Pokédex landing experience, searchable canonical catalog and detail records, Pokémon sightings map, comments, GridFS image delivery, and a battle prototype. It is being modernized into a portfolio-ready Pokédex platform with a repeatable public-data pipeline, strategy tools, analytics, and a redesigned battle experience.

> The active delivery roadmap lives in [docs/ROADMAP.md](docs/ROADMAP.md). Current functionality is documented separately from planned work.

## Current features

- Responsive Pokédex Atlas shell with dark/light mode, loading, error, and empty states.
- Searchable, filterable, paginated canonical Pokédex with grid/list/compact views.
- Pokémon detail records with core stats, types, move metadata, evolution data, and sightings links.
- Local-first favorites, recently viewed records, catalog preferences, and a privacy-preserving profile dashboard.
- Pokémon comparison, canonical type-effectiveness explorer, and a locally saved team builder with coverage analysis.
- Pokémon-specific sighting map with radius filtering.
- Comments on Pokémon records.
- GridFS image serving for the legacy dataset.
- Basic turn-based battle prototype.
- Docker-backed local MongoDB setup and backend health endpoint.

## Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, TanStack Query, Axios, Framer Motion, CSS |
| Backend | Flask, Flask-CORS, PyMongo |
| Database | MongoDB, GridFS, GeoJSON sightings |
| Data | Existing local datasets, planned PokéAPI pipeline |
| Maps | Google Maps JavaScript API |
| Tooling | Docker Compose, pytest, npm |

## Local setup

### Prerequisites

- Node.js and npm
- Python 3.11+
- Docker Desktop
- A local copy of the approved sightings dataset at `data/300k.csv`

### Environment files

Create local-only files from the safe examples. Do not commit either file.

```powershell
Copy-Item backend/.env.example backend/.env.local
Copy-Item frontend/.env.example frontend/.env.local
```

Set `MONGO_URI` in `backend/.env.local` for the local Docker database:

```env
MONGO_URI=mongodb://localhost:27018/PokeMap
MONGO_DATABASE=PokeMap
```

Set a restricted Google Maps browser key only in `frontend/.env.local`:

```env
REACT_APP_GOOGLE_MAPS_API_KEY=
REACT_APP_API_BASE_URL=http://localhost:5000
```

Restrict the Maps key to local development origins such as `http://localhost:3000/*`. Never place a real key in source files, documentation, screenshots, or commits.

### Seed and run

The legacy setup script imports the local stats and sightings data, creates GridFS records, and installs dependencies:

```powershell
.\scripts\setup-local.ps1
.\scripts\start-local.ps1
```

The app is available at `http://localhost:3000/`; the API listens on `http://localhost:5000`.

To reset the Docker database before seeding:

```powershell
.\scripts\setup-local.ps1 -ResetDatabase
```

## Rich data pipeline

Phase 2 adds a repeatable PokéAPI-first seed workflow. It discovers the available catalog at runtime, stores canonical Pokémon/forms/species/moves/types/evolutions, and keeps the existing sightings data in a normalized geospatial collection.

```powershell
Push-Location backend
python -m scripts.seed_database
python -m scripts.validate_database
Pop-Location
```

For a faster development-only smoke import, pass `--max-records 10`; the normal command has no artificial Pokémon limit. Imports use MongoDB upserts and `import_logs` checkpoints, so interrupted runs resume safely. Raw datasets remain local and ignored by Git.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Service and MongoDB availability |
| GET | `/api/pokemon` | Filtered, paginated Pokémon list |
| GET | `/api/pokemon/:pokemonId` | Pokémon details |
| GET | `/api/pokemon/:pokemonId/forms` | Available forms and variants |
| GET | `/api/pokemon/:pokemonId/moves` | Battle move metadata |
| GET | `/api/pokemon/:pokemonId/evolutions` | Evolution-chain data |
| GET | `/api/pokemon/:pokemonId/sightings` | Pokémon sightings, optionally by radius |
| POST | `/api/pokemon/:pokemonId/comments` | Add a comment |
| GET | `/api/types` | Canonical type metadata |
| GET | `/api/type-chart` | Attacking/defending type multiplier |
| GET | `/api/analytics/summary` | Canonical collection totals |
| GET | `/api/analytics/types` | Type distribution |
| GET | `/api/analytics/top-stats` | Top Pokémon by stat |
| GET | `/api/images/:imageId` | Legacy GridFS image |
| GET | `/api/game/start` | Battle selection data |
| POST | `/api/game/turn` | Process a prototype battle turn |

The list API supports validated pagination, legacy-compatible search/type/stat filters, plus generation, ability, and form filters. Expanded API examples and Swagger UI are planned for Phase 13.

## Testing

```powershell
Push-Location backend
..\.venv\Scripts\python.exe -m pytest tests -q
Pop-Location
npm --prefix frontend run build
```

## Security

- `.env` and `.env.local` files are ignored and must remain untracked.
- The backend requires its MongoDB connection string from the environment.
- The Google Maps key is browser-visible by design, so restrict it by HTTP referrer and API in Google Cloud.
- Run the secret scan described in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) before committing.

## Local profile data

Favorites, recently viewed Pokémon, catalog preferences, and battle statistics are saved only in the current browser's local storage. They are not sent to the Flask API and can be removed at any time from `/profile` using **Clear local data**.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Data pipeline](docs/DATA_PIPELINE.md)
- [UI redesign plan](docs/UI_REDESIGN_PLAN.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Portfolio highlights](docs/RESUME_BULLETS.md)

## License

No project license has been specified yet. Dataset and API attribution requirements are documented as part of the data-pipeline work.
