import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiBaseUrl from '../api';
import { useProfile } from '../context/ProfileContext';
import { BattleArena } from '../components/battle/BattleArena';
import { MoveButton } from '../components/battle/MoveButton';
import { PokemonSearchPicker } from '../components/ui/PokemonSearchPicker';
import { EmptyState, ErrorBanner, PokeballLoader } from '../components/ui/States';
import { PageHeader } from '../components/ui/PageHeader';
import { TypeBadge } from '../components/ui/TypeBadge';
import { beginBattle, prepareCombatant, resolveTurn } from '../lib/battle';
import { typeMap } from '../lib/strategy';

export default function BattlePage() {
  const location = useLocation();
  const { recordBattle } = useProfile();
  const [selected, setSelected] = useState(() => (location.state?.team || []).slice(0, 3));
  const [difficulty, setDifficulty] = useState('normal');
  const [battle, setBattle] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const recorded = useRef(false);
  const [poolPage] = useState(() => Math.floor(Math.random() * 13) + 1);
  const types = useQuery({ queryKey: ['types'], queryFn: async () => (await axios.get(`${apiBaseUrl}/types`)).data.types });
  const pool = useQuery({ queryKey: ['battle-pool', poolPage], queryFn: async () => (await axios.get(`${apiBaseUrl}/pokemon`, { params: { page: poolPage, perPage: 100, sortOption: 'No.' } })).data.pokemon });
  const add = (entry) => setSelected((current) => current.some((item) => item._id === entry._id) || current.length >= 3 ? current : [...current, entry]);
  const remove = (id) => setSelected((current) => current.filter((entry) => entry._id !== id));
  const start = async () => {
    if (selected.length !== 3 || !pool.data) return;
    setStarting(true); setError(''); recorded.current = false;
    try {
      const cpuEntries = pool.data.filter((entry) => !selected.some((member) => member._id === entry._id)).sort(() => Math.random() - 0.5).slice(0, 3);
      const allEntries = [...selected, ...cpuEntries];
      const moveResponses = await Promise.all(allEntries.map((entry) => axios.get(`${apiBaseUrl}/pokemon/${entry._id}/moves`, { params: { limit: 16 } })));
      const combatants = allEntries.map((entry, index) => prepareCombatant(entry, moveResponses[index].data.moves || []));
      setBattle(beginBattle(combatants.slice(0, 3), combatants.slice(3)));
    } catch {
      setError('Unable to prepare this battle. Confirm the API is running and try again.');
    } finally { setStarting(false); }
  };
  const takeTurn = (action) => setBattle((current) => resolveTurn(current, action, typeMap(types.data), difficulty));
  useEffect(() => { if (battle?.winner && !recorded.current) { recorded.current = true; recordBattle(battle.winner, battle.userTeam, battle.log); } }, [battle?.winner]);
  const reset = () => { recorded.current = false; setBattle(null); setError(''); };
  if (types.isLoading || pool.isLoading) return <PokeballLoader label="Preparing battle systems…" />;
  if (error) return <ErrorBanner title="Battle setup failed" message={error} onRetry={start} />;
  if (!battle) return <div className="battle-page"><PageHeader eyebrow="Battle simulator" title="Choose your squad" description="Select three Pokémon, choose a CPU difficulty, then fight using move power, accuracy, speed, type matchups, critical hits, and status effects." actions={<Link className="button button--quiet" to="/battle/history">Battle history</Link>} /><section className="battle-setup"><div><PokemonSearchPicker selectedIds={selected.map((entry) => String(entry._id))} onSelect={add} disabled={selected.length >= 3} label={`Your squad (${selected.length}/3)`} /><div className="battle-setup__team">{selected.length ? selected.map((entry) => <article key={entry._id}><button onClick={() => remove(entry._id)} aria-label={`Remove ${entry.pokemon.name}`}>×</button>{entry.image_url && <img src={entry.image_url} alt="" />}<strong>{entry.pokemon.name}</strong><span>{[entry.pokemon.primary_type, entry.pokemon.secondary_type].filter(Boolean).map((type) => <TypeBadge key={type} type={type} compact />)}</span></article>) : <EmptyState title="Select three Pokémon">Your saved Team Builder roster is also ready to send here.</EmptyState>}</div></div><aside><h2>CPU difficulty</h2><label><input type="radio" value="easy" checked={difficulty === 'easy'} onChange={(event) => setDifficulty(event.target.value)} /> Easy <small>Random moves</small></label><label><input type="radio" value="normal" checked={difficulty === 'normal'} onChange={(event) => setDifficulty(event.target.value)} /> Normal <small>Usually picks a good move</small></label><label><input type="radio" value="hard" checked={difficulty === 'hard'} onChange={(event) => setDifficulty(event.target.value)} /> Hard <small>Targets best damage</small></label><label><input type="radio" value="expert" checked={difficulty === 'expert'} onChange={(event) => setDifficulty(event.target.value)} /> Expert <small>Uses matchup-aware switches</small></label><button className="button button--primary" disabled={selected.length !== 3 || starting} onClick={start}>{starting ? 'Calibrating…' : 'Start battle'}</button></aside></section></div>;
  const active = battle.userTeam[battle.userActive];
  return <div className="battle-page"><PageHeader eyebrow={`Turn ${battle.turn}`} title="Battle Arena" description={`CPU difficulty: ${difficulty}`} actions={<Link className="button button--quiet" to="/battle/history">History</Link>} /><BattleArena battle={battle} /><section className="battle-console"><div className="battle-console__log" role="log" aria-live="polite">{battle.log.slice(-5).map((line, index) => <p key={`${battle.turn}-${index}`}>{line}</p>)}</div>{battle.winner ? <div className="battle-result"><h2>{battle.winner === 'User' ? 'Victory!' : battle.winner === 'CPU' ? 'Defeat' : 'Draw'}</h2><p>{battle.winner === 'User' ? 'Your strategy carried the day.' : 'Review the matchup and try another team.'}</p><button className="button button--primary" onClick={reset}>Play again</button></div> : <div className="battle-controls"><div className="battle-moves">{active.moves.map((move, index) => <MoveButton key={`${move.name}-${index}`} move={move} onClick={() => takeTurn({ type: 'move', index })} />)}</div><div className="battle-switch"><span>Switch Pokémon</span>{battle.userTeam.map((member, index) => <button key={member.id} disabled={index === battle.userActive || member.hp <= 0} onClick={() => takeTurn({ type: 'switch', index })}>{member.name}{member.status && <small>{member.status}</small>}</button>)}</div></div>}</section></div>;
}
