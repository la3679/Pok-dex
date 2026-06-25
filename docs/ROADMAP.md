# Pokédex Atlas Roadmap

## Delivery order

| Phase | Outcome | Priority | Complexity | Depends on |
| --- | --- | --- | --- | --- |
| 0 | Audit and architecture plan — complete | MVP | Low | — |
| 1 | Secure, repeatable local foundation — complete | MVP | Medium | 0 |
| 2 | Rich Pokémon data pipeline — complete | MVP | High | 1 |
| 3 | Modular API and validated contracts — complete | MVP | High | 2 |
| 4 | Vite frontend and Pokédex redesign — complete | MVP | High | 3 |
| 5 | Local profile, favorites, recent views — complete | MVP | Medium | 4 |
| 6 | Compare, type chart, team builder — complete | Portfolio | High | 2, 4, 5 |
| 7 | Classic-inspired battle redesign — complete | Portfolio | High | 2, 3, 4 |
| 8 | Sightings-map redesign — complete | Portfolio | High | 3, 4 |
| 9 | Analytics dashboard — complete | Portfolio | Medium | 2, 3, 4 |
| 10 | Quiz, achievements, exports — complete | Polish | Medium | 5–7 |
| 11 | Tests, CI, and quality gates — complete | MVP | High | 1–4 |
| 12 | Docker developer experience — complete | MVP | Medium | 1, 2, 11 |
| 13 | OpenAPI documentation — complete | Portfolio | Medium | 3 |
| 14 | README and portfolio polish — complete | Portfolio | Medium | 0–13 |

## Completed scope

- Secure local configuration uses ignored `.env.local` files and safe `.env.example` placeholders.
- The backend exposes modular Flask routes, services, repositories, serializers, validation helpers, ingestion scripts, health checks, analytics endpoints, and OpenAPI docs.
- The database can be seeded from PokéAPI and approved local datasets, then validated for collection counts, duplicates, malformed sightings, and indexes.
- The React/Vite frontend includes the redesigned Pokédex shell, catalog, detail pages, favorites, recent views, profile, compare, type chart, team builder, battle, map, analytics, achievements, quiz, matchup, and export features.
- The UI includes device boot sequences, page transitions, an advanced autocomplete search dropdown, and comprehensive filter controls.
- The sightings map includes marker, cluster, custom heatmap, radius, date, current-location, sidebar, and hotspot experiences without using the removed Google Heatmap Layer.
- Dockerfiles, Docker Compose, PowerShell helpers, pytest, vitest (with jsdom for deep integration tests), frontend build checks, GitHub Actions, secret scanning, Swagger UI, and portfolio docs are in place.

## Final review checklist

- [ ] Run backend tests.
- [ ] Run frontend tests.
- [ ] Run frontend build.
- [ ] Run secret scan.
- [ ] Restart backend and frontend from a clean terminal.
- [ ] Verify `/`, `/pokedex`, `/pokemon/25`, `/map`, `/battle`, `/analytics`, `/quiz`, and `/api/docs`.
- [ ] Capture screenshots into `docs/screenshots/`.
- [ ] Split the mixed working tree into small Conventional Commits.
- [ ] Open a pull request with setup, test, and known-limitation notes.

## Future polish ideas

- Add authentication and cloud-synced profiles if the project moves beyond local-first portfolio scope.
- Add hosted deployment configuration after choosing the target platform and secret-management model.
- Add richer charting if design needs outgrow the current CSS-first dashboard.
- Add a selected project license before public distribution.
