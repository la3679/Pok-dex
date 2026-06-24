import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pokedex-atlas-profile-v1';
const MAX_RECENT = 12;

const defaults = {
  favorites: [],
  recentlyViewed: [],
  preferences: { theme: 'dark', catalogView: 'grid', catalogFilters: { primaryType: '', generation: '', legendary: '', sortOption: 'No.' }, catalogSearch: '' },
  battles: { played: 0, wins: 0, losses: 0, draws: 0, mostUsedPokemon: {} },
};

function readProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored ? { ...defaults, ...stored, preferences: { ...defaults.preferences, ...stored.preferences }, battles: { ...defaults.battles, ...stored.battles } } : defaults;
  } catch {
    return defaults;
  }
}

function normalizePokemon(item) {
  const pokemon = item?.pokemon || item || {};
  const id = String(pokemon.pokemonId || pokemon.pokemon_id || item?._id || item?.id || '');
  return {
    id,
    name: pokemon.name || item?.name || 'Unknown Pokémon',
    imageUrl: item?.image_url || item?.imageUrl || pokemon.image_url || '',
    types: (item?.types || [pokemon.primary_type, pokemon.secondary_type]).filter(Boolean),
  };
}

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(readProfile);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); }, [profile]);

  const value = useMemo(() => ({
    profile,
    favorites: profile.favorites,
    recentlyViewed: profile.recentlyViewed,
    preferences: profile.preferences,
    battles: profile.battles,
    setPreference(key, value) { setProfile((current) => ({ ...current, preferences: { ...current.preferences, [key]: value } })); },
    isFavorite(item) { const { id } = normalizePokemon(item); return profile.favorites.some((favorite) => favorite.id === id); },
    toggleFavorite(item) {
      const favorite = normalizePokemon(item);
      if (!favorite.id) return;
      setProfile((current) => ({ ...current, favorites: current.favorites.some((entry) => entry.id === favorite.id) ? current.favorites.filter((entry) => entry.id !== favorite.id) : [{ ...favorite, addedAt: new Date().toISOString() }, ...current.favorites] }));
    },
    addRecentlyViewed(item) {
      const viewed = normalizePokemon(item);
      if (!viewed.id) return;
      setProfile((current) => ({ ...current, recentlyViewed: [{ ...viewed, viewedAt: new Date().toISOString() }, ...current.recentlyViewed.filter((entry) => entry.id !== viewed.id)].slice(0, MAX_RECENT) }));
    },
    recordBattle(result, team = []) {
      const winner = result === 'User' ? 'wins' : result === 'CPU' ? 'losses' : 'draws';
      setProfile((current) => {
        const used = { ...current.battles.mostUsedPokemon };
        team.map(normalizePokemon).filter((entry) => entry.id).forEach((entry) => { used[entry.id] = { ...used[entry.id], ...entry, uses: (used[entry.id]?.uses || 0) + 1 }; });
        return { ...current, battles: { ...current.battles, played: current.battles.played + 1, [winner]: current.battles[winner] + 1, mostUsedPokemon: used } };
      });
    },
    clearLocalData() { setProfile(defaults); },
  }), [profile]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used inside ProfileProvider.');
  return context;
}

export function profileEntryToPokemonCard(entry) {
  return { _id: entry.id, image_url: entry.imageUrl, pokemon: { pokemonId: entry.id, name: entry.name, primary_type: entry.types?.[0], secondary_type: entry.types?.[1] } };
}
