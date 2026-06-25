# API Documentation

Phase 13 exposes the Flask API contract as OpenAPI JSON and a local Swagger UI.

## Local docs URLs

| Page | URL |
| --- | --- |
| Swagger UI | `http://localhost:5000/api/docs` |
| OpenAPI JSON | `http://localhost:5000/api/docs/openapi.json` |
| Health check | `http://localhost:5000/api/health` |

The Swagger UI uses the committed OpenAPI contract from `backend/openapi.py`. The JSON route works without external assets; the Swagger UI page loads Swagger UI assets from a public CDN during local development.

## Main endpoint groups

| Group | Endpoints |
| --- | --- |
| Health | `GET /api/health` |
| Pokémon | `GET /api/pokemon`, `GET /api/pokemon/{pokemonId}`, forms, moves, evolutions, comments |
| Sightings | `GET /api/sightings`, `GET /api/pokemon/{pokemonId}/sightings` |
| Types | `GET /api/types`, `GET /api/type-chart` |
| Analytics | Summary, type distribution, generation distribution, stat leaders, type averages, physical extremes, sighting leaders |
| Battle | `GET /api/game/start`, `POST /api/game/turn` |
| Images | `GET /api/images/{imageId}` |

## Example requests

```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod "http://localhost:5000/api/pokemon?page=1&perPage=20&searchTerm=pika"
Invoke-RestMethod "http://localhost:5000/api/type-chart?attacking=electric&defending=water,flying"
Invoke-RestMethod "http://localhost:5000/api/analytics/summary"
```

Create a comment:

```powershell
Invoke-RestMethod `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"text":"Great electric team option.","author":"CurrentUser"}' `
  http://localhost:5000/api/pokemon/25/comments
```

## Error contract

API errors return safe JSON:

```json
{
  "error": "Pokémon not found.",
  "code": "pokemon_not_found"
}
```

Validation errors use HTTP `400`, missing resources use `404`, unavailable MongoDB health checks use `503`, and unexpected internal failures use `500`.

## Maintenance notes

- Update `backend/openapi.py` whenever routes, query parameters, request bodies, or response shapes change.
- Keep examples free of real API keys, credentials, private hostnames, and user data.
- Run `python -m pytest tests -q` after changing the docs routes or API contract.
- Phase 14 will polish README presentation further, but the source of truth for endpoint details is now the OpenAPI JSON route.
