import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { achievementSummary } from '../lib/achievements';

const STORAGE_KEY = 'pokedex-atlas-profile-v1';
const MAX_RECENT = 12;

const defaults = {
  favorites: [],
  recentlyViewed: [],
  preferences: { theme: 'dark', catalogView: 'grid', catalogFilters: { primaryType: '', generation: '', legendary: '', sortOption: 'No.' }, catalogSearch: '' },
  battles: { played: 0, wins: 0, losses: 0, draws: 0, mostUsedPokemon: {} },
  savedTeams: [],
  battleHistory: [],
  activity: { comparedPokemonIds: [], legendaryPokemonIds: [], mapVisits: 0 },
  lastComparison: [],
};

function readProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored ? { ...defaults, ...stored, preferences: { ...defaults.preferences, ...stored.preferences }, battles: { ...defaults.battles, ...stored.battles }, activity: { ...defaults.activity, ...stored.activity } } : defaults;
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

function normalizeTeamPokemon(item) {
  const normalized = normalizePokemon(item);
  const pokemon = item?.pokemon || item || {};
  return { ...normalized, stats: { hp: pokemon.hp || 0, attack: pokemon.attack || 0, defense: pokemon.defense || 0, speed: pokemon.speed || 0, special_attack: pokemon.special_attack || 0, special_defense: pokemon.special_defense || 0 }, height: pokemon.height, weight: pokemon.weight, capture_rate: pokemon.capture_rate };
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
    savedTeams: profile.savedTeams || [],
    battleHistory: profile.battleHistory || [],
    achievements: achievementSummary(profile),
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
      const isRare = Boolean(item?.species?.is_legendary || item?.species?.is_mythical);
      setProfile((current) => ({
        ...current,
        recentlyViewed: [{ ...viewed, viewedAt: new Date().toISOString() }, ...current.recentlyViewed.filter((entry) => entry.id !== viewed.id)].slice(0, MAX_RECENT),
        activity: isRare ? { ...current.activity, legendaryPokemonIds: [...new Set([...(current.activity?.legendaryPokemonIds || []), viewed.id])] } : current.activity,
      }));
    },
    recordBattle(result, team = [], log = []) {
      const winner = result === 'User' ? 'wins' : result === 'CPU' ? 'losses' : 'draws';
      setProfile((current) => {
        const used = { ...current.battles.mostUsedPokemon };
        team.map(normalizePokemon).filter((entry) => entry.id).forEach((entry) => { used[entry.id] = { ...used[entry.id], ...entry, uses: (used[entry.id]?.uses || 0) + 1 }; });
        const history = [{ id: `${Date.now()}`, result, team: team.map(normalizePokemon), log: log.slice(-20), playedAt: new Date().toISOString() }, ...(current.battleHistory || [])].slice(0, 30);
        return { ...current, battleHistory: history, battles: { ...current.battles, played: current.battles.played + 1, [winner]: current.battles[winner] + 1, mostUsedPokemon: used } };
      });
    },
    saveTeam(name, members) {
      const team = { id: `${Date.now()}`, name: name.trim() || `Team ${new Date().toLocaleDateString()}`, members: members.map(normalizeTeamPokemon), savedAt: new Date().toISOString() };
      setProfile((current) => ({ ...current, savedTeams: [team, ...(current.savedTeams || [])].slice(0, 12) }));
    },
    removeSavedTeam(teamId) { setProfile((current) => ({ ...current, savedTeams: (current.savedTeams || []).filter((team) => team.id !== teamId) })); },
    recordComparison(entries) {
      const members = entries.map(normalizeTeamPokemon).filter((entry) => entry.id);
      if (members.length < 2) return;
      setProfile((current) => ({
        ...current,
        lastComparison: members,
        activity: { ...current.activity, comparedPokemonIds: [...new Set([...(current.activity?.comparedPokemonIds || []), ...members.map((entry) => entry.id)])] },
      }));
    },
    recordMapVisit() { setProfile((current) => ({ ...current, activity: { ...current.activity, mapVisits: (current.activity?.mapVisits || 0) + 1 } })); },
    clearBattleHistory() { setProfile((current) => ({ ...current, battleHistory: [] })); },
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
