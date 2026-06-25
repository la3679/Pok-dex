import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiBaseUrl from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import { StatBar } from '../components/ui/StatBar';
import { ErrorBanner, PokeballLoader } from '../components/ui/States';
import { TypeBadge } from '../components/ui/TypeBadge';
import { useProfile } from '../context/ProfileContext';

export default function PokemonDetailPage() {
  const { pokemonId } = useParams();
  const { addRecentlyViewed, isFavorite, toggleFavorite } = useProfile();
  const lastViewedId = useRef(null);
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();
  const detail = useQuery({ queryKey: ['pokemon-detail', pokemonId], queryFn: async () => (await axios.get(`${apiBaseUrl}/pokemon/${pokemonId}`)).data });
  const moves = useQuery({ queryKey: ['pokemon-moves', pokemonId], queryFn: async () => (await axios.get(`${apiBaseUrl}/pokemon/${pokemonId}/moves`, { params: { limit: 8 } })).data.moves || [], enabled: detail.isSuccess });
  const evolutions = useQuery({ queryKey: ['pokemon-evolutions', pokemonId], queryFn: async () => (await axios.get(`${apiBaseUrl}/pokemon/${pokemonId}/evolutions`)).data, enabled: detail.isSuccess });
  const commentMutation = useMutation({
    mutationFn: async (text) => (await axios.post(`${apiBaseUrl}/pokemon/${pokemonId}/comments`, { text })).data,
    onSuccess: () => { setCommentText(''); queryClient.invalidateQueries({ queryKey: ['pokemon-detail', pokemonId] }); },
  });
  useEffect(() => {
    if (detail.data && lastViewedId.current !== pokemonId) {
      lastViewedId.current = pokemonId;
      addRecentlyViewed(detail.data);
    }
  }, [addRecentlyViewed, detail.data, pokemonId]);
  if (detail.isLoading) return <PokeballLoader label="Opening Pokémon record…" />;
  if (detail.isError) return <ErrorBanner title="Pokémon record unavailable" message={detail.error?.response?.data?.error?.message || 'This Pokémon could not be found.'} onRetry={detail.refetch} />;
  const data = detail.data;
  const pokemon = data.pokemon || {};
  const stats = [['HP', pokemon.hp], ['Attack', pokemon.attack], ['Defense', pokemon.defense], ['Speed', pokemon.speed]];
  const types = [pokemon.primary_type, pokemon.secondary_type].filter(Boolean);
  const species = data.species || {};
  const chain = evolutions.data?.evolution_chain?.chain || evolutions.data?.evolution_chain;
  const favorite = isFavorite(data);
  return <div className="detail-page">
    <Link className="back-link" to="/pokedex">← Back to Pokédex</Link>
    <PageHeader eyebrow={`Entry #${String(pokemon.pokemonId || pokemonId).padStart(4, '0')}`} title={pokemon.name || 'Pokémon'} description={`${species.generation?.replace('generation-', 'Generation ') || 'Species record'} · ${species.color || 'Unknown'} color`} actions={<button className={`button ${favorite ? 'button--primary' : 'button--quiet'}`} onClick={() => toggleFavorite(data)} aria-pressed={favorite}>{favorite ? '♥ Favorited' : '♡ Add favorite'}</button>} />
    <section className="detail-hero"><div className="detail-hero__art">{data.image_url ? <img src={data.image_url} alt={pokemon.name} /> : <span>?</span>}</div><div className="detail-hero__facts"><div className="type-row type-row--detail">{types.map((type) => <TypeBadge key={type} type={type} />)}</div><p>{species.is_legendary ? 'Legendary Pokémon' : species.is_mythical ? 'Mythical Pokémon' : 'Pokémon species'} · Capture rate {pokemon.capture_rate ?? species.capture_rate ?? '—'}</p><dl className="measurements"><div><dt>Height</dt><dd>{pokemon.height || '—'} m</dd></div><div><dt>Weight</dt><dd>{pokemon.weight || '—'} kg</dd></div><div><dt>Habitat</dt><dd>{species.habitat || 'Unknown'}</dd></div></dl><div className="detail-actions"><Link className="button button--primary" to={`/pokemon/sightings/${pokemon.pokemonId || pokemonId}`}>View sightings</Link><Link className="button button--quiet" to="/battle">Battle mode</Link></div></div></section>
    <div className="detail-grid"><section className="detail-panel"><h2>Base stats</h2>{stats.map(([label, value]) => <StatBar key={label} label={label} value={value} />)}</section><section className="detail-panel"><h2>Known moves</h2>{moves.isLoading ? <p>Loading move data…</p> : <ul className="move-list">{(moves.data || []).slice(0, 8).map((move) => <li key={move.name}><span>{move.name?.replace(/-/g, ' ')}</span><small>{move.type} · {move.power ?? '—'} power</small></li>)}</ul>}{!moves.isLoading && !moves.data?.length && <p>No move metadata is available yet.</p>}</section><section className="detail-panel"><h2>Evolution data</h2>{chain ? <pre className="evolution-data">{JSON.stringify(chain, null, 2)}</pre> : <p>No evolution chain is recorded for this Pokémon.</p>}</section><section className="detail-panel"><h2>Community notes</h2>{data.comments?.length ? <ul className="comment-list">{data.comments.map((comment) => <li key={comment.id}><strong>{comment.author}</strong><span>{comment.text}</span></li>)}</ul> : <p>No notes yet. Community comments are ready through the API.</p>}</section></div>
    <section className="detail-panel detail-panel--comments"><h2>Add a field note</h2><form className="comment-form" onSubmit={(event) => { event.preventDefault(); if (commentText.trim()) commentMutation.mutate(commentText.trim()); }}><label htmlFor="pokemon-comment">Your observation</label><textarea id="pokemon-comment" value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength="1000" placeholder="Share a short observation…" /><button className="button button--quiet" type="submit" disabled={!commentText.trim() || commentMutation.isPending}>{commentMutation.isPending ? 'Saving…' : 'Save note'}</button>{commentMutation.isError && <small className="form-error">Unable to save this note. Try again.</small>}</form></section>
  </div>;
}
