import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import apiBaseUrl from "../api";
import { useProfile } from "../context/ProfileContext";
import { BattleArena } from "../components/battle/BattleArena";
import { MoveButton } from "../components/battle/MoveButton";
import { PokemonSearchPicker } from "../components/ui/PokemonSearchPicker";
import {
  EmptyState,
  ErrorBanner,
  PokeballLoader,
} from "../components/ui/States";
import { PageHeader } from "../components/ui/PageHeader";
import { TypeBadge } from "../components/ui/TypeBadge";
import { beginBattle, prepareCombatant, resolveTurn } from "../lib/battle";
import { typeMap } from "../lib/strategy";

export default function BattlePage() {
  const location = useLocation();
  const { recordBattle } = useProfile();
  const [selected, setSelected] = useState(() =>
    (location.state?.team || []).slice(0, 3),
  );
  const [difficulty, setDifficulty] = useState("normal");
  const [battle, setBattle] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const recorded = useRef(false);
  const [poolPage] = useState(() => Math.floor(Math.random() * 13) + 1);

  const types = useQuery({
    queryKey: ["types"],
    queryFn: async () => (await axios.get(`${apiBaseUrl}/types`)).data.types,
  });
  const pool = useQuery({
    queryKey: ["battle-pool", poolPage],
    queryFn: async () =>
      (
        await axios.get(`${apiBaseUrl}/pokemon`, {
          params: { page: poolPage, perPage: 100, sortOption: "No." },
        })
      ).data.pokemon,
  });

  const add = (entry) =>
    setSelected((current) =>
      current.some((item) => item._id === entry._id) || current.length >= 3
        ? current
        : [...current, entry],
    );
  const remove = (id) =>
    setSelected((current) => current.filter((entry) => entry._id !== id));

  const start = async () => {
    if (selected.length !== 3 || !pool.data) return;
    setStarting(true);
    setError("");
    recorded.current = false;
    try {
      const cpuEntries = pool.data
        .filter((entry) => !selected.some((member) => member._id === entry._id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const allEntries = [...selected, ...cpuEntries];
      const moveResponses = await Promise.all(
        allEntries.map((entry) =>
          axios.get(`${apiBaseUrl}/pokemon/${entry._id}/moves`, {
            params: { limit: 16 },
          }),
        ),
      );
      const combatants = allEntries.map((entry, index) =>
        prepareCombatant(entry, moveResponses[index].data.moves || []),
      );
      setBattle(beginBattle(combatants.slice(0, 3), combatants.slice(3)));
    } catch {
      setError(
        "Unable to prepare this battle. Confirm the API is running and try again.",
      );
    } finally {
      setStarting(false);
    }
  };

  const takeTurn = (action) =>
    setBattle((current) =>
      resolveTurn(current, action, typeMap(types.data), difficulty),
    );
  useEffect(() => {
    if (battle?.winner && !recorded.current) {
      recorded.current = true;
      recordBattle(battle.winner, battle.userTeam, battle.log);
    }
  }, [battle?.winner, recordBattle, battle]);

  const reset = () => {
    recorded.current = false;
    setBattle(null);
    setError("");
  };

  if (types.isLoading || pool.isLoading)
    return <PokeballLoader label="Preparing Combat Sim…" />;
  if (error)
    return (
      <ErrorBanner title="Simulation failed" message={error} onRetry={start} />
    );

  if (!battle) {
    return (
      <motion.div
        className="battle-page"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          eyebrow="Combat Simulator"
          title="Select Squadron"
          description="Prepare three combatants for field testing against CPU-controlled entities."
          actions={
            <Link className="button button--quiet" to="/battle/history">
              Simulation Logs
            </Link>
          }
        />

        <section className="battle-setup">
          <div className="battle-setup__main">
            <PokemonSearchPicker
              selectedIds={selected.map((entry) => String(entry._id))}
              onSelect={add}
              disabled={selected.length >= 3}
              label={`Ready for deployment (${selected.length}/3)`}
            />
            <div className="battle-setup__team">
              <AnimatePresence>
                {selected.length ? (
                  selected.map((entry, index) => (
                    <motion.article
                      key={entry._id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", bounce: 0.4 }}
                    >
                      <button
                        className="remove-btn"
                        onClick={() => remove(entry._id)}
                        aria-label={`Remove ${entry.pokemon.name}`}
                      >
                        ×
                      </button>
                      {entry.image_url && <img src={entry.image_url} alt="" />}
                      <strong>{entry.pokemon.name}</strong>
                      <div className="type-row">
                        {[
                          entry.pokemon.primary_type,
                          entry.pokemon.secondary_type,
                        ]
                          .filter(Boolean)
                          .map((type) => (
                            <TypeBadge key={type} type={type} compact />
                          ))}
                      </div>
                    </motion.article>
                  ))
                ) : (
                  <EmptyState title="Deploy 3 combatants">
                    Awaiting squad selection for simulation sequence.
                  </EmptyState>
                )}
              </AnimatePresence>
            </div>
          </div>
          <aside className="battle-setup__config">
            <h2>
              <span className="sys-prompt">_</span>CPU parameters
            </h2>
            <div className="difficulty-options">
              <label className={difficulty === "easy" ? "is-active" : ""}>
                <input
                  type="radio"
                  value="easy"
                  checked={difficulty === "easy"}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="sr-only"
                />
                <strong>Easy</strong>
                <small>Random execution</small>
              </label>
              <label className={difficulty === "normal" ? "is-active" : ""}>
                <input
                  type="radio"
                  value="normal"
                  checked={difficulty === "normal"}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="sr-only"
                />
                <strong>Normal</strong>
                <small>Standard targeting</small>
              </label>
              <label className={difficulty === "hard" ? "is-active" : ""}>
                <input
                  type="radio"
                  value="hard"
                  checked={difficulty === "hard"}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="sr-only"
                />
                <strong>Hard</strong>
                <small>Lethal targeting</small>
              </label>
              <label className={difficulty === "expert" ? "is-active" : ""}>
                <input
                  type="radio"
                  value="expert"
                  checked={difficulty === "expert"}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="sr-only"
                />
                <strong>Expert</strong>
                <small>Tactical switching</small>
              </label>
            </div>
            <button
              className="button button--primary button--large"
              disabled={selected.length !== 3 || starting}
              onClick={start}
            >
              {starting ? "INITIALIZING SIMULATION…" : "INITIATE SIMULATION"}
            </button>
          </aside>
        </section>
      </motion.div>
    );
  }

  const active = battle.userTeam[battle.userActive];

  return (
    <motion.div
      className="battle-page"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <PageHeader
        eyebrow={`Turn ${String(battle.turn).padStart(3, "0")}`}
        title="Active Simulation"
        description={`CPU Parameter: ${difficulty.toUpperCase()}`}
        actions={
          <Link className="button button--quiet" to="/battle/history">
            Abort Sim
          </Link>
        }
      />
      <BattleArena battle={battle} />

      <section className="battle-console">
        <div className="battle-console__log" role="log" aria-live="polite">
          {battle.log.slice(-4).map((line, index) => (
            <motion.p
              key={`${battle.turn}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="sys-prompt">&gt;</span> {line}
            </motion.p>
          ))}
        </div>

        {battle.winner ? (
          <div className="battle-result">
            <h2>
              {battle.winner === "User"
                ? "SIMULATION SUCCESS"
                : battle.winner === "CPU"
                  ? "SIMULATION FAILED"
                  : "DRAW DETECTED"}
            </h2>
            <p>
              {battle.winner === "User"
                ? "Tactics proven effective."
                : "Recommend tactical review."}
            </p>
            <button className="button button--primary" onClick={reset}>
              REBOOT SIMULATOR
            </button>
          </div>
        ) : (
          <div className="battle-controls">
            <div className="battle-moves">
              {active.moves.map((move, index) => (
                <MoveButton
                  key={`${move.name}-${index}`}
                  move={move}
                  onClick={() => takeTurn({ type: "move", index })}
                />
              ))}
            </div>
            <div className="battle-switch">
              <span className="terminal-text">Deploy Reserve</span>
              <div className="battle-switch-grid">
                {battle.userTeam.map((member, index) => (
                  <button
                    key={member.id}
                    className="switch-btn"
                    disabled={index === battle.userActive || member.hp <= 0}
                    onClick={() => takeTurn({ type: "switch", index })}
                  >
                    <span>{member.name}</span>
                    <div className="switch-btn__hp">
                      <div className="hp-track">
                        <div
                          className="hp-fill"
                          style={{
                            width: `${(member.hp / member.maxHp) * 100}%`,
                            background:
                              member.hp / member.maxHp > 0.5
                                ? "#4ade80"
                                : member.hp / member.maxHp > 0.2
                                  ? "#eab308"
                                  : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                    {member.status && (
                      <small className="status-badge">{member.status}</small>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
}
