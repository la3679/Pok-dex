import axios from 'axios';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiBaseUrl from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import { StatBar } from '../components/ui/StatBar';
import { ErrorBanner, PokeballLoader } from '../components/ui/States';
import { TypeBadge } from '../components/ui/TypeBadge';
import { useProfile } from '../context/ProfileContext';

export default function PokemonDetailPage() {
  const { pokemonId } = useParams();
  const { addRecentlyViewed, isFavorite, toggleFavorite } = useProfile();
  const detail = useQuery({ queryKey: ['pokemon-detail', pokemonId], queryFn: async () => (await axios.get(`${apiBaseUrl}/pokemon/${pokemonId}`)).data });
  const moves = useQuery({ queryKey: ['pokemon-moves', pokemonId], queryFn: async () => (await axios.get(`${apiBaseUrl}/pokemon/${pokemonId}/moves`, { params: { limit: 8 } })).data, enabled: detail.isSuccess });
  const evolutions = useQuery({ queryKey: ['pokemon-evolutions', pokemonId], queryFn: async () => (await axios.get(`${apiBaseUrl}/pokemon/${pokemonId}/evolutions`)).data, enabled: detail.isSuccess });
  if (detail.isLoading) return <PokeballLoader label="Opening Pokémon record…" />;
  if (detail.isError) return <ErrorBanner title="Pokémon record unavailable" message={detail.error?.response?.data?.error?.message || 'This Pokémon could not be found.'} onRetry={detail.refetch} />;
  const data = detail.data;
  const pokemon = data.pokemon || {};
  const stats = [['HP', pokemon.hp], ['Attack', pokemon.attack], ['Defense', pokemon.defense], ['Speed', pokemon.speed]];
  const types = [pokemon.primary_type, pokemon.secondary_type].filter(Boolean);
  const species = data.species || {};
  const chain = evolutions.data?.evolution_chain?.chain || evolutions.data?.evolution_chain;
  const favorite = isFavorite(data);
  useEffect(() => { addRecentlyViewed(data); }, [data, pokemonId]);
  return <div className="detail-page">
    <Link className="back-link" to="/pokedex">← Back to Pokédex</Link>
    <PageHeader eyebrow={`Entry #${String(pokemon.pokemonId || pokemonId).padStart(4, '0')}`} title={pokemon.name || 'Pokémon'} description={`${species.generation?.replace('generation-', 'Generation ') || 'Species record'} · ${species.color || 'Unknown'} color`} actions={<button className={`button ${favorite ? 'button--primary' : 'button--quiet'}`} onClick={() => toggleFavorite(data)} aria-pressed={favorite}>{favorite ? '♥ Favorited' : '♡ Add favorite'}</button>} />
    <section className="detail-hero"><div className="detail-hero__art">{data.image_url ? <img src={data.image_url} alt={pokemon.name} /> : <span>?</span>}</div><div className="detail-hero__facts"><div className="type-row type-row--detail">{types.map((type) => <TypeBadge key={type} type={type} />)}</div><p>{species.is_legendary ? 'Legendary Pokémon' : species.is_mythical ? 'Mythical Pokémon' : 'Pokémon species'} · Capture rate {pokemon.capture_rate ?? species.capture_rate ?? '—'}</p><dl className="measurements"><div><dt>Height</dt><dd>{pokemon.height || '—'} m</dd></div><div><dt>Weight</dt><dd>{pokemon.weight || '—'} kg</dd></div><div><dt>Habitat</dt><dd>{species.habitat || 'Unknown'}</dd></div></dl><div className="detail-actions"><Link className="button button--primary" to={`/pokemon/sightings/${pokemon.pokemonId || pokemonId}`}>View sightings</Link><Link className="button button--quiet" to="/battle">Battle mode</Link></div></div></section>
    <div className="detail-grid"><section className="detail-panel"><h2>Base stats</h2>{stats.map(([label, value]) => <StatBar key={label} label={label} value={value} />)}</section><section className="detail-panel"><h2>Known moves</h2>{moves.isLoading ? <p>Loading move data…</p> : <ul className="move-list">{(moves.data || []).slice(0, 8).map((move) => <li key={move.name}><span>{move.name?.replace(/-/g, ' ')}</span><small>{move.type} · {move.power ?? '—'} power</small></li>)}</ul>}{!moves.isLoading && !moves.data?.length && <p>No move metadata is available yet.</p>}</section><section className="detail-panel"><h2>Evolution data</h2>{chain ? <pre className="evolution-data">{JSON.stringify(chain, null, 2)}</pre> : <p>No evolution chain is recorded for this Pokémon.</p>}</section><section className="detail-panel"><h2>Community notes</h2>{data.comments?.length ? <ul className="comment-list">{data.comments.map((comment) => <li key={comment.id}><strong>{comment.author}</strong><span>{comment.text}</span></li>)}</ul> : <p>No notes yet. Community comments are ready through the API.</p>}</section></div>
  </div>;
}
