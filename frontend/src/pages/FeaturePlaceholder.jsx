import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';

const content = {
  favorites: ['Favorites', 'Personal collection', 'Favorite Pokémon is planned as local-first storage in Phase 5.'],
  recent: ['Recently viewed', 'Personal collection', 'Your recent discoveries will appear here in Phase 5.'],
  compare: ['Compare Pokémon', 'Strategy tools', 'Side-by-side stat comparisons are planned for Phase 6.'],
  'team-builder': ['Team Builder', 'Strategy tools', 'Build and analyze six-Pokémon teams in Phase 6.'],
  'type-chart': ['Type chart', 'Strategy tools', 'Interactive matchup analysis is planned for Phase 6.'],
  analytics: ['Analytics dashboard', 'Data insights', 'Server-side aggregate endpoints are ready; the chart dashboard arrives in Phase 9.'],
  'battle-history': ['Battle history', 'Battle mode', 'Local battle history arrives with the battle redesign in Phase 7.'],
  map: ['Sightings map', 'Exploration', 'Open any Pokémon record to explore its available sightings on the map. A full general map and exploration controls are scheduled for Phase 8.'],
};

export default function FeaturePlaceholder({ feature }) {
  const [title, eyebrow, description] = content[feature] || ['Coming soon', 'Roadmap', 'This part of the Pokédex is under construction.'];
  return <section className="placeholder-page"><PageHeader title={title} eyebrow={eyebrow} description={description} /><div className="placeholder-card"><span aria-hidden="true">◌</span><h2>Planned with intent</h2><p>This route is already part of the navigable product shell, while its complete interactive experience is scheduled for a later phase.</p><Link className="button button--primary" to="/pokedex">Browse Pokédex</Link></div></section>;
}
