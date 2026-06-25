import axios from 'axios';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiBaseUrl from '../api';
import { useProfile } from '../context/ProfileContext';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorBanner, PokeballLoader } from '../components/ui/States';
import { TypeBadge } from '../components/ui/TypeBadge';

const number = new Intl.NumberFormat();
const STAT_LABELS = {
  hp: 'HP', attack: 'Attack', defense: 'Defense', special_attack: 'Sp. Atk', special_defense: 'Sp. Def', speed: 'Speed',
};
const LEADER_STATS = [
  ['attack', 'Top attack'],
  ['defense', 'Top defense'],
  ['speed', 'Top speed'],
];

const request = (path) => async () => (await axios.get(`${apiBaseUrl}${path}`)).data;
const formatGeneration = (value) => String(value || 'Unknown').replace('generation-', 'Generation ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function MetricBars({ rows, label, value, accent = false }) {
  const maximum = Math.max(...rows.map((row) => Number(value(row)) || 0), 1);
  return <div className="analytics-bars">{rows.map((row) => {
    const amount = Number(value(row)) || 0;
    return <div className="analytics-bars__row" key={row.type || row.generation || row.pokemon_id}><div><span>{label(row)}</span><strong>{number.format(amount)}</strong></div><i><b className={accent ? 'is-accent' : ''} style={{ width: `${Math.max((amount / maximum) * 100, amount ? 3 : 0)}%` }} /></i></div>;
  })}</div>;
}

function LeaderList({ title, rows = [] }) {
  return <section className="analytics-panel analytics-panel--leaders"><div className="analytics-panel__heading"><p className="eyebrow">Leaderboard</p><h2>{title}</h2></div>{rows.length ? <ol className="analytics-leader-list">{rows.slice(0, 5).map((entry, index) => <li key={entry.pokemon_id}><span>{index + 1}</span><Link to={`/pokemon/${entry.pokemon_id}`}>{entry.name}</Link><div>{entry.types.map((type) => <TypeBadge key={type} type={type} compact />)}</div><strong>{entry.value}</strong></li>)}</ol> : <p className="analytics-empty">No ranked records are available.</p>}</section>;
}

function RankedList({ title, rows = [], unit = '' }) {
  return <section className="analytics-panel analytics-panel--ranked"><div className="analytics-panel__heading"><p className="eyebrow">Database record</p><h2>{title}</h2></div>{rows.length ? <ol className="analytics-rank-list">{rows.map((entry, index) => <li key={entry.pokemon_id}><span>{index + 1}</span><Link to={`/pokemon/${entry.pokemon_id}`}>{entry.name}</Link><div>{entry.types.map((type) => <TypeBadge key={type} type={type} compact />)}</div><strong>{number.format(entry.value)}{unit}</strong></li>)}</ol> : <p className="analytics-empty">No records are available.</p>}</section>;
}

export default function AnalyticsPage() {
  const { favorites, recentlyViewed, battles, savedTeams } = useProfile();
  const [selectedType, setSelectedType] = useState('');
  const summary = useQuery({ queryKey: ['analytics', 'summary'], queryFn: request('/analytics/summary') });
  const types = useQuery({ queryKey: ['analytics', 'types'], queryFn: request('/analytics/types') });
  const generations = useQuery({ queryKey: ['analytics', 'generations'], queryFn: request('/analytics/generations') });
  const typeStats = useQuery({ queryKey: ['analytics', 'type-stats'], queryFn: request('/analytics/type-stats') });
  const extremes = useQuery({ queryKey: ['analytics', 'extremes'], queryFn: request('/analytics/extremes') });
  const sightings = useQuery({ queryKey: ['analytics', 'sightings'], queryFn: request('/analytics/sightings') });
  const leaders = LEADER_STATS.map(([stat]) => useQuery({ queryKey: ['analytics', 'top-stats', stat], queryFn: request(`/analytics/top-stats?stat=${stat}&limit=5`) }));
  const queries = [summary, types, generations, typeStats, extremes, sightings, ...leaders];
  const loading = queries.some((query) => query.isLoading);
  const failed = queries.find((query) => query.isError);
  const typeRows = typeStats.data?.types || [];
  const activeType = useMemo(() => typeRows.find((row) => row.type === selectedType) || typeRows[0], [typeRows, selectedType]);
  const maxTypeStat = Math.max(...Object.values(activeType?.averages || {}).map(Number), 1);
  const statLeaderRows = Object.fromEntries(LEADER_STATS.map(([stat], index) => [stat, leaders[index].data?.pokemon || []]));
  const metrics = [
    ['pokemon', 'Pokémon records'], ['forms', 'Forms'], ['species', 'Species'], ['sightings', 'Sightings'],
    ['legendary', 'Legendary species'], ['mythical', 'Mythical species'], ['comments', 'Comments'],
  ];
  const retry = () => queries.forEach((query) => query.refetch());

  if (loading) return <PokeballLoader label="Calculating Pokédex insights…" />;
  if (failed) return <ErrorBanner title="Analytics could not load" message={failed.error?.response?.data?.error?.message || 'Check that the local API and seeded MongoDB database are running.'} onRetry={retry} />;

  return <div className="analytics-page"><PageHeader eyebrow="Data observatory" title="Pokédex analytics" description="A live view of the local MongoDB collections: canonical species data, battle metadata, and the imported sightings dataset." />
    <section className="analytics-summary" aria-label="Database summary">{metrics.map(([key, label]) => <article key={key}><small>{label}</small><strong>{number.format(summary.data?.[key] || 0)}</strong></article>)}</section>
    <div className="analytics-grid analytics-grid--primary"><section className="analytics-panel"><div className="analytics-panel__heading"><div><p className="eyebrow">Collection mix</p><h2>Type distribution</h2></div><span>{number.format(summary.data?.pokemon || 0)} records</span></div><MetricBars rows={types.data?.types || []} label={(row) => <TypeBadge type={row.type} compact />} value={(row) => row.count} accent /></section>
      <section className="analytics-panel"><div className="analytics-panel__heading"><div><p className="eyebrow">Species timeline</p><h2>Generation distribution</h2></div><span>{number.format(summary.data?.species || 0)} species</span></div><MetricBars rows={generations.data?.generations || []} label={(row) => formatGeneration(row.generation)} value={(row) => row.count} /><div className="analytics-generation-note"><span>◆ Legendary: {number.format((generations.data?.generations || []).reduce((total, row) => total + row.legendary, 0))}</span><span>✦ Mythical: {number.format((generations.data?.generations || []).reduce((total, row) => total + row.mythical, 0))}</span></div></section></div>
    <section className="analytics-leaders">{LEADER_STATS.map(([stat, label]) => <LeaderList key={stat} title={label} rows={statLeaderRows[stat]} />)}</section>
    <div className="analytics-grid analytics-grid--secondary"><section className="analytics-panel analytics-panel--stat-profile"><div className="analytics-panel__heading"><div><p className="eyebrow">Type profile</p><h2>Average base stats</h2></div><label className="analytics-select">Type<select value={activeType?.type || ''} onChange={(event) => setSelectedType(event.target.value)}>{typeRows.map((row) => <option key={row.type} value={row.type}>{row.type}</option>)}</select></label></div>{activeType ? <><div className="analytics-type-profile"><TypeBadge type={activeType.type} /><span>{number.format(activeType.count)} Pokémon/forms</span></div><div className="analytics-stat-bars">{Object.entries(activeType.averages).map(([stat, value]) => <div key={stat}><span>{STAT_LABELS[stat]}</span><i><b style={{ width: `${(Number(value) / maxTypeStat) * 100}%` }} /></i><strong>{Number(value).toFixed(1)}</strong></div>)}</div></> : <p className="analytics-empty">No type statistics are available.</p>}</section>
      <section className="analytics-panel analytics-panel--local"><div className="analytics-panel__heading"><div><p className="eyebrow">On this device</p><h2>Local explorer stats</h2></div><Link to="/profile">Profile →</Link></div><div className="analytics-local-stats"><article><span>♥</span><strong>{favorites.length}</strong><small>Favorites</small></article><article><span>◉</span><strong>{recentlyViewed.length}</strong><small>Recent views</small></article><article><span>⚔</span><strong>{battles.played}</strong><small>Battles</small></article><article><span>▣</span><strong>{savedTeams.length}</strong><small>Saved teams</small></article></div><p>{battles.played ? `${battles.wins} wins · ${battles.losses} losses · ${battles.draws} draws` : 'Complete a battle to begin your local record.'}</p></section></div>
    <div className="analytics-records"><RankedList title="Tallest Pokémon" rows={extremes.data?.tallest} unit=" m" /><RankedList title="Heaviest Pokémon" rows={extremes.data?.heaviest} unit=" kg" /><section className="analytics-panel analytics-panel--ranked"><div className="analytics-panel__heading"><p className="eyebrow">Exploration data</p><h2>Most sighted</h2></div>{sightings.data?.pokemon?.length ? <ol className="analytics-rank-list">{sightings.data.pokemon.map((entry, index) => <li key={entry.pokemon_id}><span>{index + 1}</span><Link to={`/pokemon/${entry.pokemon_id}`}>{entry.name}</Link><div>{entry.types.map((type) => <TypeBadge key={type} type={type} compact />)}</div><strong>{number.format(entry.count)}</strong></li>)}</ol> : <p className="analytics-empty">Import sightings to populate this ranking.</p>}</section></div>
  </div>;
}
