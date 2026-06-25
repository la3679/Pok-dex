# UI Redesign Plan

The frontend has been redesigned as a modern Pokédex-style dashboard: deep charcoal surfaces, controlled red hardware accents, accessible type colors, responsive cards, and calm motion. The battle page uses a stronger classic game-inspired presentation while keeping the interface original and web-friendly.

## Design system

- Dark and light themes through CSS custom properties.
- Type-colored accents for cards, badges, filters, charts, and battle moves.
- Responsive AppShell with desktop navigation and mobile-friendly layout.
- Keyboard-visible focus states and accessible labels for interactive controls.
- Motion used for page transitions, loaders, battle feedback, and small interaction polish.
- Reduced-motion compatibility where animation is decorative.

## Completed page set

- `/` landing page
- `/pokedex`
- `/pokemon/:pokemonId`
- `/favorites`
- `/recent`
- `/compare`
- `/team-builder`
- `/type-chart`
- `/map`
- `/pokemon/sightings/:pokemonId`
- `/battle`
- `/battle/history`
- `/analytics`
- `/achievements`
- `/quiz`
- `/who-would-win`
- `/about`

## Shared UI components

- AppShell
- Navbar/sidebar navigation
- PageHeader
- Pokémon cards
- Type badges
- Stat bars
- Loaders and skeleton cards
- Error banners
- Empty states
- Filter panels
- Battle arena
- Health bars
- Move buttons
- Team slots
- Map panels
- Analytics cards

## Phase 4–10 delivery summary

- Completed Vite migration, responsive AppShell, navigation drawer, dark/light theme, skip link, and page transitions.
- Completed landing page, canonical Pokédex browse page, advanced filters, grid/list/compact views, pagination, and Pokémon detail records.
- Completed browser-local favorites, recently viewed history, saved catalog preferences, profile metrics, most-used battle Pokémon, and clear-local-data flow.
- Completed Pokémon comparison, canonical type-effectiveness explorer, six-slot team builder, local team saves, coverage analysis, rule-based candidates, and battle handoff.
- Completed classic-inspired battle arena, health bars, move controls, switching, difficulty-aware CPU, status effects, battle dialogue, and local battle history.
- Completed general and Pokémon-specific sightings explorer with clusters, custom heatmap, time/radius filters, current-location control, hotspot summary, sidebar navigation, and map-key fallback.
- Completed server-side analytics aggregations and a responsive dashboard for collection totals, type/generation distributions, ranked stats, physical extremes, sighting leaders, average stats by type, and local explorer metrics.
- Completed local achievements, four catalog-powered quiz modes, explainable matchup estimates, and browser-only JSON/CSV exports.

## Accessibility and mobile

The UI targets mobile-first layouts, readable contrast, semantic structure, keyboard-friendly controls, clear loading states, clear empty states, and safe fallback messaging when API, map, or browser-local data is unavailable.
