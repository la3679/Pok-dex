# Developer Experience

Phase 12 makes the project runnable either natively on Windows/PowerShell or through Docker Compose.

## Recommended local modes

| Mode | Best for | Command |
| --- | --- | --- |
| Native app + Docker MongoDB | Fastest day-to-day React/Flask editing on Windows | `.\scripts\start-local.ps1` |
| Full Docker Compose | Verifying another developer can run the stack from containers | `docker compose up --build` |
| Tool containers | Running seed, validation, tests, or builds without installing app runtimes globally | `.\scripts\docker-dev.ps1 seed` |

## Docker services

| Service | Purpose | Port |
| --- | --- | --- |
| `mongo` | Local MongoDB database with a named volume | `27018 -> 27017` |
| `backend` | Flask API container | `5000` |
| `frontend` | Vite React dev server | `3000` |
| `seed` | One-shot PokéAPI seed command | none |
| `validate` | One-shot database validation command | none |
| `backend-test` | One-shot pytest command | none |
| `frontend-test` | One-shot Vitest command | none |
| `frontend-build` | One-shot production frontend build command | none |

## Common Docker commands

```powershell
docker compose up --build
docker compose down
docker compose down -v
docker compose logs -f
docker compose run --rm seed
docker compose run --rm validate
docker compose run --rm backend-test
docker compose run --rm frontend-test
docker compose run --rm frontend-build
```

PowerShell shortcuts are available through:

```powershell
.\scripts\docker-dev.ps1 up
.\scripts\docker-dev.ps1 seed
.\scripts\docker-dev.ps1 validate
.\scripts\docker-dev.ps1 test
```

## Environment behavior

- Backend containers use `MONGO_URI=mongodb://mongo:27017/PokeMap`.
- The frontend container reads `REACT_APP_API_BASE_URL=http://localhost:5000`.
- If `frontend/.env.local` exists, Docker bind mounts it into the dev server because the whole frontend directory is mounted.
- Do not put a real Google Maps key into `docker-compose.yml`, `Dockerfile`, README files, or committed examples.

## Database reset

Use a volume reset only when you intentionally want to remove local MongoDB data:

```powershell
docker compose down -v
docker compose up -d mongo
```

After resetting, run the seed and validation commands again.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Port `3000`, `5000`, or `27018` is already in use | Stop the old dev server/container or change the published port in `docker-compose.yml`. |
| Frontend loads but API calls fail | Confirm the backend is reachable at `http://localhost:5000/api/health`. |
| Map loads as a blank panel | Confirm `frontend/.env.local` has a restricted `REACT_APP_GOOGLE_MAPS_API_KEY`; never commit it. |
| Seed fails during PokéAPI fetch | Re-run `docker compose run --rm seed`; imports are upsert-based and can resume. |
| Database looks empty after Docker reset | Run `docker compose run --rm seed` followed by `docker compose run --rm validate`. |
| Docker Desktop is not running | Start Docker Desktop, then retry the command. |

## Quality gate

Before opening a pull request, run:

```powershell
docker compose config
docker compose run --rm backend-test
docker compose run --rm frontend-test
docker compose run --rm frontend-build
.\.venv\Scripts\python.exe scripts\secret_scan.py
```
