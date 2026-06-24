import { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import apiBaseUrl from '../../api';
import { TypeBadge } from './TypeBadge';

export function PokemonSearchPicker({ selectedIds, onSelect, disabled, label = 'Find Pokémon' }) {
  const [term, setTerm] = useState('');
  const results = useQuery({ queryKey: ['strategy-picker', term], queryFn: async () => (await axios.get(`${apiBaseUrl}/pokemon`, { params: { searchTerm: term, perPage: 8, sortOption: 'No.' } })).data.pokemon, enabled: term.trim().length >= 2 });
  return <div className="pokemon-search-picker"><label><span>{label}</span><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search by name…" /></label>{term.trim().length >= 2 && <div className="picker-results">{results.isLoading && <p>Searching catalog…</p>}{results.data?.map((entry) => { const pokemon = entry.pokemon; const selected = selectedIds.includes(String(pokemon.pokemonId)); return <button key={entry._id} onClick={() => onSelect(entry)} disabled={disabled || selected}>{entry.image_url && <img src={entry.image_url} alt="" />}<span><strong>{pokemon.name}</strong><small>{[pokemon.primary_type, pokemon.secondary_type].filter(Boolean).map((type) => <TypeBadge key={type} type={type} compact />)}</small></span><b>{selected ? 'Added' : '+'}</b></button>; })}{results.data?.length === 0 && <p>No Pokémon matched that search.</p>}</div>}</div>;
}
