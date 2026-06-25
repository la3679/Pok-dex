// Single source of truth for navigation. Consumed by the desktop module rail,
// the mobile bottom dock, and the command palette so labels/icons/routes never
// drift between surfaces.

export const navGroups = [
  {
    title: 'Discover',
    items: [
      { to: '/', label: 'Dashboard', icon: '⌂', keywords: 'home start overview' },
      { to: '/pokedex', label: 'Pokédex', icon: '◈', keywords: 'catalog browse search pokemon list' },
      { to: '/map', label: 'Sightings', icon: '⌖', keywords: 'map radar field location heatmap' },
      { to: '/analytics', label: 'Research Lab', icon: '◌', keywords: 'analytics data stats charts metrics' },
    ],
  },
  {
    title: 'Strategy',
    items: [
      { to: '/battle', label: 'Battle', icon: '⚔', keywords: 'fight arena simulator combat' },
      { to: '/team-builder', label: 'Team Builder', icon: '⬡', keywords: 'party roster squad strategy' },
      { to: '/compare', label: 'Compare', icon: '⇄', keywords: 'versus side by side analysis' },
      { to: '/type-chart', label: 'Type Chart', icon: '▦', keywords: 'matchup effectiveness weakness' },
      { to: '/who-would-win', label: 'Battle Predictor', icon: '⚡', keywords: 'who would win prediction matchup' },
    ],
  },
  {
    title: 'Personal',
    items: [
      { to: '/favorites', label: 'Collection', icon: '★', keywords: 'favorites saved liked' },
      { to: '/recent', label: 'Scan History', icon: '◷', keywords: 'recent recently viewed history' },
      { to: '/profile', label: 'Trainer Console', icon: '⚙', keywords: 'profile settings preferences local data export' },
      { to: '/achievements', label: 'Badges', icon: '✦', keywords: 'achievements milestones progress' },
      { to: '/quiz', label: 'Challenge', icon: '?', keywords: 'quiz challenge trivia game' },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/about', label: 'About', icon: '◉', keywords: 'about info project tech stack' },
    ],
  },
];

export const flatNav = navGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.title })),
);

// Extra destinations that are reachable but not first-class rail modules.
export const auxNav = [
  { to: '/battle/history', label: 'Battle Log', icon: '▤', keywords: 'battle history past results log', group: 'Strategy' },
];

// Primary destinations shown in the mobile bottom dock (plus a "More" trigger).
export const dockItems = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/pokedex', label: 'Pokédex', icon: '◈' },
  { to: '/map', label: 'Map', icon: '⌖' },
  { to: '/battle', label: 'Battle', icon: '⚔' },
];

export function resolveModuleLabel(pathname) {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/pokemon/sightings')) return 'Sightings';
  if (pathname.startsWith('/pokemon/')) return 'Dex Record';
  const all = [...flatNav, ...auxNav].sort((a, b) => b.to.length - a.to.length);
  const match = all.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  return match ? match.label : 'Module';
}
