import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile, profileEntryToPokemonCard } from '../context/ProfileContext';
import { PageHeader } from '../components/ui/PageHeader';
import { PokemonCard } from '../components/ui/PokemonCard';
import { EmptyState } from '../components/ui/States';

export default function ProfilePage() {
  const { favorites, recentlyViewed, battles, preferences, clearLocalData } = useProfile();
  const [confirming, setConfirming] = useState(false);
  const mostUsed = Object.values(battles.mostUsedPokemon).sort((a, b) => b.uses - a.uses).slice(0, 3);
  const winRate = battles.played ? Math.round((battles.wins / battles.played) * 100) : 0;
  return <div className="profile-page">
    <PageHeader eyebrow="On this device" title="Local profile" description="A private, browser-only record of the way you explore Pokédex Atlas. No account, server profile, or personal data required." />
    <section className="profile-summary"><article><span>♥</span><strong>{favorites.length}</strong><small>Favorites</small></article><article><span>◉</span><strong>{recentlyViewed.length}</strong><small>Recently viewed</small></article><article><span>⚔</span><strong>{battles.played}</strong><small>Battles played</small></article><article><span>↗</span><strong>{winRate}%</strong><small>Win rate</small></article></section>
    <div className="profile-grid"><section className="profile-panel"><div className="profile-panel__heading"><h2>Battle record</h2><Link to="/battle">Battle →</Link></div><dl className="battle-record"><div><dt>Wins</dt><dd>{battles.wins}</dd></div><div><dt>Losses</dt><dd>{battles.losses}</dd></div><div><dt>Draws</dt><dd>{battles.draws}</dd></div></dl><p className="profile-note">Battle metrics update after a completed battle using the existing game mode.</p></section><section className="profile-panel"><div className="profile-panel__heading"><h2>Saved preferences</h2></div><dl className="preference-list"><div><dt>Theme</dt><dd>{preferences.theme}</dd></div><div><dt>Catalog view</dt><dd>{preferences.catalogView}</dd></div><div><dt>Saved type filter</dt><dd>{preferences.catalogFilters.primaryType || 'None'}</dd></div></dl><p className="profile-note">Catalog choices and theme persist after refresh.</p></section></div>
    <section className="profile-section"><div className="profile-panel__heading"><div><p className="eyebrow">Battle habits</p><h2>Most used Pokémon</h2></div></div>{mostUsed.length ? <div className="pokemon-grid pokemon-grid--compact">{mostUsed.map((entry) => <div key={entry.id} className="used-pokemon"><PokemonCard entry={profileEntryToPokemonCard(entry)} mode="compact" /><span>{entry.uses} battle{entry.uses === 1 ? '' : 's'}</span></div>)}</div> : <EmptyState title="No battle history yet">Complete a battle to start building this local record.</EmptyState>}</section>
    <section className="data-controls"><div><h2>Manage local data</h2><p>Favorites, recent views, preferences, and battle statistics are only stored in this browser.</p></div>{confirming ? <div className="data-controls__confirm"><span>Clear all local profile data?</span><button className="button button--primary" onClick={() => { clearLocalData(); setConfirming(false); }}>Yes, clear data</button><button className="button button--quiet" onClick={() => setConfirming(false)}>Cancel</button></div> : <button className="button button--quiet" onClick={() => setConfirming(true)}>Clear local data</button>}</section>
  </div>;
}
