# Contributing

## Workflow

- Branch from `main` using a focused name such as `feat/team-builder`, `fix/map-loading`, or `docs/project-roadmap`.
- Use Conventional Commits: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `perf`, or `style`.
- Keep commits small and single-purpose. Do not mix data migration, UI redesign, and documentation in one commit.

## Pull request checklist

- [ ] Tests and frontend build pass for the changed behavior.
- [ ] README and relevant docs reflect user-visible or setup changes.
- [ ] Existing routes are preserved or have documented replacements.
- [ ] No generated datasets, build folders, virtual environments, or local database files are staged.
- [ ] No secrets are staged.

## Secret handling

Never commit `.env`, `.env.local`, API keys, database credentials, tokens, or raw local configuration. Before committing, inspect tracked content with a secret scan such as:

```powershell
git grep -n -I -E 'AIza|mongodb(\+srv)?://[^[:space:]]+@|password[[:space:]]*[:=]|api[_-]?key[[:space:]]*[:=]'
```

If a credential is discovered, remove it from tracked files, revoke or rotate it with its provider, and do not include it in issue text, screenshots, logs, or commits.
