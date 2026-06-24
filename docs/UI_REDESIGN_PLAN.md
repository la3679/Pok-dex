# UI Redesign Plan

## Direction

The interface will be a modern Pokédex device dashboard: deep charcoal surfaces, controlled red hardware accents, accessible type colors, and calm motion. The battle arena alone adopts a stronger original pixel-inspired presentation.

## System

- Vite + React, React Router, TanStack Query, Framer Motion, Recharts, and CSS custom properties.
- Responsive app shell with desktop navigation, mobile drawer, theme toggle, skip link, and visible keyboard focus.
- Reusable components: AppShell, PageHeader, PokemonCard, TypeBadge, StatBar, PokeballLoader, SkeletonCard, ErrorBanner, EmptyState, SearchAutocomplete, FilterPanel, MapPanel, BattleArena, HealthBar, MoveButton, TeamSlot, AnalyticsCard, and ChartCard.

### Phase 4–6 delivery

- Completed: Vite migration, responsive AppShell, navigation drawer, dark/light theme toggle, skip link, page transitions, and the core shared state components.
- Completed: landing page, canonical Pokédex browse page, filters, grid/list/compact views, pagination, and Pokémon detail records.
- Completed: browser-local favorites, recently viewed history, saved catalog preferences, profile metrics, most-used battle Pokémon, and an explicit clear-local-data flow.
- Completed: Pokémon comparison, canonical type-effectiveness explorer, six-slot team builder, local team saves, coverage analysis, rule-based candidates, and battle handoff.
- Deferred to their dedicated roadmap phases: map controls, battle redesign, and analytics charts. Their routes remain visible as clearly labelled placeholders rather than pretending that features exist.

## Pages

`/`, `/pokedex`, `/pokemon/:pokemonId`, `/favorites`, `/recent`, `/compare`, `/team-builder`, `/type-chart`, `/map`, `/pokemon/sightings/:pokemonId`, `/battle`, `/battle/history`, `/analytics`, and `/about`.

## Accessibility and mobile

All interactive controls receive labels, semantic roles, keyboard access, contrast-safe type treatments, motion reduction support, loading/error/empty states, and mobile-first layouts. Existing routes will redirect to their replacement pages.
