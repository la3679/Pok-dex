import axios from "axios";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiBaseUrl from "../api";
import { PokemonSearchPicker } from "../components/ui/PokemonSearchPicker";
import { PageHeader } from "../components/ui/PageHeader";
import { PokeballLoader } from "../components/ui/States";
import { TypeBadge } from "../components/ui/TypeBadge";
import { predictWinner } from "../lib/phase10";
import { typeMap } from "../lib/strategy";

function Contender({ entry, label, onClear }) {
  return (
    <article className="winner-contender terminal-panel">
      <small className="terminal-text">{label}</small>
      {entry ? (
        <>
          <button onClick={onClear} aria-label={`Clear ${entry.pokemon.name}`}>
            ×
          </button>
          {entry.image_url && <img src={entry.image_url} alt="" />}
          <strong className="sys-prompt">{entry.pokemon.name}</strong>
          <div>
            {[entry.pokemon.primary_type, entry.pokemon.secondary_type]
              .filter(Boolean)
              .map((type) => (
                <TypeBadge key={type} type={type} compact />
              ))}
          </div>
          <dl>
            <div>
              <dt className="terminal-text">Atk</dt>
              <dd className="sys-prompt">{entry.pokemon.attack}</dd>
            </div>
            <div>
              <dt className="terminal-text">Def</dt>
              <dd className="sys-prompt">{entry.pokemon.defense}</dd>
            </div>
            <div>
              <dt className="terminal-text">Spd</dt>
              <dd className="sys-prompt">{entry.pokemon.speed}</dd>
            </div>
          </dl>
        </>
      ) : (
        <span className="terminal-text">Choose a Pokémon below</span>
      )}
    </article>
  );
}

export default function WhoWouldWinPage() {
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const types = useQuery({
    queryKey: ["types"],
    queryFn: async () => (await axios.get(`${apiBaseUrl}/types`)).data.types,
  });
  const outcome = useMemo(
    () => predictWinner(first, second, typeMap(types.data)),
    [first, second, types.data],
  );
  if (types.isLoading) return <PokeballLoader label="Reading matchup data…" />;
  return (
    <div className="pokedex-screen winner-page">
      <div className="boot-screen__scanlines" />
      <PageHeader
        eyebrow="Strategy lab"
        title="Who Would Win?"
        description="Compare two Pokémon using weighted base stats, speed, and their strongest available type matchup. It is an explainable estimate, not a replacement for the full battle simulator."
      />
      <section className="winner-layout">
        <Contender
          entry={first}
          label="Contender one"
          onClear={() => {
            setFirst(null);
            setRevealed(false);
          }}
        />
        <div className="winner-versus">VS</div>
        <Contender
          entry={second}
          label="Contender two"
          onClear={() => {
            setSecond(null);
            setRevealed(false);
          }}
        />
      </section>
      <section className="winner-pickers">
        <PokemonSearchPicker
          selectedIds={second ? [String(second._id)] : []}
          onSelect={(entry) => {
            setFirst(entry);
            setRevealed(false);
          }}
          label="Choose contender one"
        />
        <PokemonSearchPicker
          selectedIds={first ? [String(first._id)] : []}
          onSelect={(entry) => {
            setSecond(entry);
            setRevealed(false);
          }}
          label="Choose contender two"
        />
      </section>
      <section className="winner-result terminal-panel">
        {outcome && revealed ? (
          <>
            {outcome.winner ? (
              <>
                <p className="eyebrow">
                  Predicted winner · {outcome.confidence}% confidence
                </p>
                <h2>{outcome.winner.pokemon.name}</h2>
              </>
            ) : (
              <>
                <p className="eyebrow">Even matchup</p>
                <h2>Too close to call</h2>
              </>
            )}
            <p className="terminal-text">{outcome.explanation}</p>
            <div className="terminal-panel">
              <span className="terminal-text">
                {first.pokemon.name}:{" "}
                <strong className="sys-prompt">
                  {outcome.firstMultiplier}×
                </strong>{" "}
                best type matchup
              </span>
              <span className="terminal-text">
                {second.pokemon.name}:{" "}
                <strong className="sys-prompt">
                  {outcome.secondMultiplier}×
                </strong>{" "}
                best type matchup
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 className="sys-prompt">Make your prediction</h2>
            <p className="terminal-text">
              Choose two Pokémon, decide who you think wins, then reveal the
              model’s estimate.
            </p>
            {outcome && (
              <button
                className="button button--primary"
                onClick={() => setRevealed(true)}
              >
                Reveal prediction
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
