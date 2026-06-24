import { Link } from 'react-router-dom';
import { useProfile, profileEntryToPokemonCard } from '../context/ProfileContext';
import { PageHeader } from '../components/ui/PageHeader';
import { PokemonCard } from '../components/ui/PokemonCard';
import { EmptyState } from '../components/ui/States';

export default function PersonalCollectionPage({ collection }) {
  const { favorites, recentlyViewed } = useProfile();
  const isFavorites = collection === 'favorites';
  const entries = isFavorites ? favorites : recentlyViewed;
  const title = isFavorites ? 'Favorites' : 'Recently viewed';
  const description = isFavorites ? 'Your saved Pokémon stay on this device and are available the next time you open the Pokédex.' : 'Your latest field-guide discoveries, stored only in this browser.';
  return <div className="collection-page">
    <PageHeader eyebrow="Local collection" title={title} description={description} actions={<Link className="button button--quiet" to="/profile">Open profile</Link>} />
    {entries.length ? <div className="pokemon-grid pokemon-grid--compact">{entries.map((entry) => <PokemonCard key={entry.id} entry={profileEntryToPokemonCard(entry)} mode="compact" />)}</div> : <EmptyState title={isFavorites ? 'No favorites yet' : 'No Pokémon viewed yet'}>{isFavorites ? 'Tap the heart on any catalog card to start your collection.' : 'Open a Pokémon detail record and it will appear here.'}<Link className="button button--primary" to="/pokedex">Browse Pokédex</Link></EmptyState>}
  </div>;
}
