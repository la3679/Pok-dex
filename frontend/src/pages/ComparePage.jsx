import axios from 'axios';
import { useQueries } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import apiBaseUrl from '../api';
import { PokemonSearchPicker } from '../components/ui/PokemonSearchPicker';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/States';
import { TypeBadge } from '../components/ui/TypeBadge';
import { useProfile } from '../context/ProfileContext';

const comparisonRows = [['HP', 'hp'], ['Attack', 'attack'], ['Defense', 'defense'], ['Sp. Attack', 'special_attack'], ['Sp. Defense', 'special_defense'], ['Speed', 'speed'], ['Height', 'height'], ['Weight', 'weight'], ['Capture rate', 'capture_rate']];

export default function ComparePage() {
  const [selected, setSelected] = useState([]);
  const { recordComparison } = useProfile();
  const recordedSelection = useRef('');
  const details = useQueries({ queries: selected.map((entry) => ({ queryKey: ['compare-detail', entry._id], queryFn: async () => (await axios.get(`${apiBaseUrl}/pokemon/${entry._id}`)).data })) });
  const records = details.map((query, index) => query.data || selected[index]);
  const add = (entry) => setSelected((current) => current.some((item) => item._id === entry._id) || current.length >= 4 ? current : [...current, entry]);
  const remove = (id) => setSelected((current) => current.filter((entry) => entry._id !== id));
  useEffect(() => {
    if (selected.length < 2) return;
    const key = selected.map((entry) => entry._id).sort().join(':');
    if (key !== recordedSelection.current) { recordedSelection.current = key; recordComparison(selected); }
  }, [recordComparison, selected]);
  return <div className="compare-page"><PageHeader eyebrow="Strategy tools" title="Compare Pokémon" description="Place two to four Pokémon side by side. Strongest numeric values are highlighted so the tradeoffs are visible at a glance." />
    <PokemonSearchPicker selectedIds={selected.map((entry) => String(entry._id))} onSelect={add} disabled={selected.length >= 4} label={`Add Pokémon (${selected.length}/4)`} />
    <section className="compare-selection">{selected.length ? selected.map((entry) => <article key={entry._id}><button onClick={() => remove(entry._id)} aria-label={`Remove ${entry.pokemon.name}`}>×</button>{entry.image_url && <img src={entry.image_url} alt="" />}<h2>{entry.pokemon.name}</h2><div>{[entry.pokemon.primary_type, entry.pokemon.secondary_type].filter(Boolean).map((type) => <TypeBadge key={type} type={type} compact />)}</div></article>) : <EmptyState title="Choose Pokémon to compare">Search the catalog above to add up to four records.</EmptyState>}</section>
    {selected.length >= 2 && <section className="comparison-table" style={{ '--compare-columns': records.length }} aria-label="Pokémon comparison"><div className="comparison-table__header"><span>Stat</span>{records.map((record) => <strong key={record._id}>{record.pokemon?.name}</strong>)}</div>{comparisonRows.map(([label, key]) => { const values = records.map((record) => Number(record.pokemon?.[key]) || 0); const max = Math.max(...values); return <div className="comparison-table__row" key={key}><span>{label}</span>{values.map((value, index) => <b key={`${key}-${index}`} className={value === max && max > 0 ? 'is-best' : ''}>{value || '—'}</b>)}</div>; })}<div className="comparison-table__row comparison-table__abilities"><span>Abilities</span>{records.map((record, index) => <div key={index}>{record.abilities?.length ? record.abilities.map((ability) => <small key={ability.name}>{ability.name?.replace(/-/g, ' ')}{ability.is_hidden ? ' (hidden)' : ''}</small>) : '—'}</div>)}</div></section>}
  </div>;
}
