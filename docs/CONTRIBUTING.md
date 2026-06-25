# Contributing

## Workflow

- Branch from `main` using a focused name such as `feat/team-builder`, `fix/map-loading`, or `docs/project-roadmap`.
- Use Conventional Commits: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `perf`, or `style`.
- Keep commits small and single-purpose. Do not mix data migration, UI redesign, and documentation in one commit.

## Pull request checklist

- [ ] Tests and frontend build pass for the changed behavior.
- [ ] `python scripts/secret_scan.py` passes.
- [ ] README and relevant docs reflect user-visible or setup changes.
- [ ] `backend/openapi.py` is updated when routes, request parameters, or response shapes change.
- [ ] Existing routes are preserved or have documented replacements.
- [ ] No generated datasets, build folders, virtual environments, or local database files are staged.
- [ ] No secrets are staged.

## Secret handling

Never commit `.env`, `.env.local`, API keys, database credentials, tokens, or raw local configuration. Before committing, inspect tracked content with the committed scanner:

```powershell
python scripts/secret_scan.py
```

If a credential is discovered, remove it from tracked files, revoke or rotate it with its provider, and do not include it in issue text, screenshots, logs, or commits.

## Quality gate

Run these checks before opening a pull request:

```powershell
Push-Location backend
..\.venv\Scripts\python.exe -m pytest tests -q
Pop-Location
npm --prefix frontend run test
npm --prefix frontend run build
..\.venv\Scripts\python.exe scripts\secret_scan.py
```

The GitHub Actions workflow mirrors this gate for pull requests and pushes.

Docker equivalents are available when you want to verify the containerized developer workflow:

```powershell
docker compose config
docker compose run --rm backend-test
docker compose run --rm frontend-test
docker compose run --rm frontend-build
```
