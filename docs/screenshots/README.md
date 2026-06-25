# Screenshot Guide

This folder is reserved for recruiter-facing screenshots used by the README.

## Recommended captures

| File | Route | What to show |
| --- | --- | --- |
| `landing-page.png` | `/` | Hero, Pokédex shell, quick feature links |
| `pokedex-page.png` | `/pokedex` | Search, filters, type-colored cards |
| `pokemon-detail-page.png` | `/pokemon/25` | Sprite, stats, moves, evolution, comments |
| `sightings-map.png` | `/map` | Map, controls, markers or heatmap, sidebar |
| `battle-game.png` | `/battle` | Classic-inspired arena and move controls |
| `favorites-page.png` | `/favorites` | Saved Pokémon and empty-state handling if applicable |
| `team-builder.png` | `/team-builder` | Six-slot team builder and type coverage |
| `compare-page.png` | `/compare` | Multi-Pokémon stat comparison |
| `analytics-dashboard.png` | `/analytics` | Stat cards and charts |

## Capture checklist

- Use seeded local data so cards, maps, and analytics look populated.
- Use a restricted local Google Maps key from `frontend/.env.local`.
- Do not include browser console panes, API keys, credentials, private directories, or terminal output with secrets.
- Prefer a 1440px-wide desktop screenshot plus one mobile screenshot if adding extra images.
- Keep images reasonably compressed before committing.
