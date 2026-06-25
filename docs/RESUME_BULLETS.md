# Resume Bullets

Use only bullets supported by completed work.

## Full-stack engineering

- Modernized a legacy Pokémon sightings app into a portfolio-ready Pokédex platform using React, Vite, Flask, MongoDB, Docker Compose, and GitHub Actions.
- Refactored a Flask backend into route, service, repository, serializer, validation, data-ingestion, and documentation layers with safe JSON error contracts.
- Designed and documented REST APIs for Pokémon browsing, detail records, forms, moves, evolutions, comments, sightings, type effectiveness, battle state, and analytics.

## Data engineering

- Built a repeatable PokéAPI-first ingestion pipeline for Pokémon, species, forms, moves, types, evolution chains, sprite metadata, and import checkpoints.
- Normalized a large local sightings dataset into GeoJSON records with MongoDB `2dsphere` indexes and validation checks for duplicate IDs and malformed coordinates.
- Added MongoDB aggregation endpoints for collection totals, type distributions, generation metrics, stat leaders, physical extremes, average stats by type, and sighting leaders.

## Frontend and product

- Delivered a responsive Pokédex-inspired React interface with a dashboard shell, type-colored cards, detail pages, map exploration, profile state, and polished loading/error/empty states.
- Implemented local-first features including favorites, recently viewed Pokémon, saved teams, battle history, achievements, quizzes, matchup estimates, and JSON/CSV exports.
- Built strategy tools including Pokémon comparison, interactive type chart, team builder, type coverage analysis, and rule-based team recommendations.
- Reworked the battle experience into a classic-inspired simulator with move selection, switching, health bars, type effectiveness, status effects, CPU difficulty, and local history.

## DevOps, security, and quality

- Externalized MongoDB and Google Maps configuration into ignored local environment files and added a tracked-file secret scanner for API key and credential leak prevention.
- Added Dockerfiles, Docker Compose services, tool containers, PowerShell helpers, and developer-experience documentation for repeatable local setup.
- Added pytest, Vitest, frontend production build verification, route-level API tests, OpenAPI/Swagger documentation tests, and GitHub Actions CI.
