# Pokédex Platform Roadmap

## Delivery order

| Phase | Outcome | Priority | Complexity | Depends on |
| --- | --- | --- | --- | --- |
| 0 | Audit and architecture plan | MVP | Low | — |
| 1 | Secure, repeatable local foundation | MVP | Medium | 0 |
| 2 | Rich Pokémon data pipeline | MVP | High | 1 |
| 3 | Modular API and validated contracts | MVP | High | 2 |
| 4 | Vite frontend and Pokédex redesign | MVP | High | 3 |
| 5 | Local profile, favorites, recent views | MVP | Medium | 4 |
| 6 | Compare, type chart, team builder | Portfolio | High | 2, 4, 5 |
| 7 | Classic-inspired battle redesign | Portfolio | High | 2, 3, 4 |
| 8 | Sightings-map redesign | Portfolio | High | 3, 4 |
| 9 | Analytics dashboard | Portfolio | Medium | 2, 3, 4 |
| 10 | Quiz, achievements, exports | Polish | Medium | 5–7 |
| 11 | Tests, CI, and quality gates | MVP | High | 1–4 |
| 12 | Docker developer experience | MVP | Medium | 1, 2, 11 |
| 13 | OpenAPI documentation | Portfolio | Medium | 3 |
| 14 | README and portfolio polish | Portfolio | Medium | 0–13 |

## Current audit

- The React app currently exposes a Pokédex, Pokémon-specific sightings map, comments, and a basic team battle route.
- Flask uses three Blueprint modules that directly create MongoDB clients and read the legacy `MergedPokemonSightings` collection. Images are served from GridFS.
- The legacy import creates 144 merged Pokémon records from the sightings dataset, while the available stats dataset contains more entries. The target data model removes that artificial browsing limit.
- The project has no automated test suite, CI workflow, app factory, shared API error contract, or committed architecture documentation.
- The frontend still uses Create React App 3. The redesign will migrate it to Vite before major interface work.
- Existing local setup files contained configuration that must not be tracked. Phase 1 removes credentials and hardcoded browser API configuration from source control.

## MVP definition

The MVP is a secure local stack, repeatable all-Pokémon seed pipeline, validated Flask API, Vite Pokédex interface, basic detail pages, and automated quality checks. Strategy, battle depth, map exploration, and analytics follow once that foundation is stable.

## Next milestone

Complete Phases 0–1, review the security and local-development baseline, then begin the PokéAPI-backed data pipeline in Phase 2.
