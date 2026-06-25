import axios from "axios";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiBaseUrl from "../api";
import { useProfile } from "../context/ProfileContext";
import { PokemonSearchPicker } from "../components/ui/PokemonSearchPicker";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, PokeballLoader } from "../components/ui/States";
import { TypeBadge } from "../components/ui/TypeBadge";
import {
  BATTLE_TYPES,
  strategyAdvice,
  teamAnalysis,
  toCard,
} from "../lib/strategy";

const MODES = [
  ["balanced", "Balanced"],
  ["offensive", "Offensive"],
  ["defensive", "Defensive"],
  ["fast", "Fast"],
];

export default function TeamBuilderPage() {
  const navigate = useNavigate();
  const { savedTeams, saveTeam, removeSavedTeam } = useProfile();
  const [team, setTeam] = useState([]);
  const [name, setName] = useState("");
  const [mode, setMode] = useState("balanced");
  const [preferredType, setPreferredType] = useState("");
  const [legendaryOnly, setLegendaryOnly] = useState(false);
  const types = useQuery({
    queryKey: ["types"],
    queryFn: async () => (await axios.get(`${apiBaseUrl}/types`)).data.types,
  });
  const analysis = useMemo(
    () => teamAnalysis(team, types.data),
    [team, types.data],
  );
  const candidates = useQuery({
    queryKey: ["team-candidates", mode, preferredType, legendaryOnly],
    queryFn: async () =>
      (
        await axios.get(`${apiBaseUrl}/pokemon`, {
          params: {
            perPage: 4,
            primaryType: preferredType || undefined,
            legendary: legendaryOnly ? "true" : undefined,
            sortOption:
              mode === "offensive"
                ? "Attack"
                : mode === "defensive"
                  ? "Defense"
                  : mode === "fast"
                    ? "Speed"
                    : "No.",
          },
        })
      ).data.pokemon,
  });
  const add = (entry) =>
    setTeam((current) =>
      current.some((member) => member._id === entry._id) || current.length >= 6
        ? current
        : [...current, entry],
    );
  const remove = (id) =>
    setTeam((current) => current.filter((entry) => entry._id !== id));
  const loadTeam = (saved) => setTeam(saved.members.map(toCard));
  const advice = strategyAdvice(mode, analysis, preferredType);
  if (types.isLoading)
    return <PokeballLoader label="Loading team strategy tools…" />;
  return (
    <div className="pokedex-screen team-builder-page">
      <div className="boot-screen__scanlines" />
      <PageHeader
        eyebrow="Strategy tools"
        title="Team Builder"
        description="Build a six-Pokémon roster, inspect its type coverage, save it locally, and use the current selection in the existing battle mode."
      />
      <div className="team-builder-layout">
        <section>
          <PokemonSearchPicker
            selectedIds={team.map((entry) => String(entry._id))}
            onSelect={add}
            disabled={team.length >= 6}
            label={`Add to team (${team.length}/6)`}
          />
          <div className="team-slots">
            {Array.from({ length: 6 }, (_, index) => {
              const entry = team[index];
              return entry ? (
                <article key={entry._id} className="team-slot terminal-panel">
                  <button
                    onClick={() => remove(entry._id)}
                    aria-label={`Remove ${entry.pokemon.name}`}
                  >
                    ×
                  </button>
                  {entry.image_url && <img src={entry.image_url} alt="" />}
                  <div>
                    <strong>{entry.pokemon.name}</strong>
                    <span>
                      {[
                        entry.pokemon.primary_type,
                        entry.pokemon.secondary_type,
                      ]
                        .filter(Boolean)
                        .map((type) => (
                          <TypeBadge key={type} type={type} compact />
                        ))}
                    </span>
                  </div>
                </article>
              ) : (
                <div
                  className="team-slot team-slot--empty terminal-panel"
                  key={`empty-${index}`}
                >
                  <span>{index + 1}</span>
                  <small>Empty slot</small>
                </div>
              );
            })}
          </div>
          <div className="team-actions">
            <input
              className="terminal-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Team name (optional)"
            />
            <button
              className="button button--quiet"
              disabled={!team.length}
              onClick={() => {
                saveTeam(name, team);
                setName("");
              }}
            >
              Save team
            </button>
            <button
              className="button button--primary"
              disabled={team.length < 3}
              onClick={() => navigate("/battle", { state: { team } })}
            >
              Use in battle
            </button>
          </div>
        </section>
        <aside className="team-analysis terminal-panel">
          <h2 className="sys-prompt">Team analysis</h2>
          <div className="team-averages">
            {Object.entries(analysis.averages).map(([stat, value]) => (
              <span key={stat}>
                <small>{stat}</small>
                <strong>{value}</strong>
              </span>
            ))}
          </div>
          <h3 className="sys-prompt">STAB coverage</h3>
          <div className="type-row">
            {analysis.coverage.length ? (
              analysis.coverage.map((type) => (
                <TypeBadge key={type} type={type} compact />
              ))
            ) : (
              <p>Add Pokémon to calculate coverage.</p>
            )}
          </div>
          <h3 className="sys-prompt">Biggest weaknesses</h3>
          {analysis.highestWeaknesses.length ? (
            <ul className="weakness-list">
              {analysis.highestWeaknesses.map((weakness) => (
                <li key={weakness.attacking}>
                  <TypeBadge type={weakness.attacking} compact />{" "}
                  <span>
                    {weakness.weak} weak · {weakness.resist} resist ·{" "}
                    {weakness.immune} immune
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No weakness data yet.</p>
          )}
        </aside>
      </div>
      <section className="recommendation-panel terminal-panel">
        <div>
          <p className="eyebrow">Rule-based recommendations</p>
          <h2 className="sys-prompt">Shape the next addition</h2>
        </div>
        <div className="recommendation-controls">
          <label>
            Style
            <select
              className="terminal-input"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
            >
              {MODES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Preferred type
            <select
              className="terminal-input"
              value={preferredType}
              onChange={(event) => setPreferredType(event.target.value)}
            >
              <option value="">Any type</option>
              {BATTLE_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="filter-panel__checkbox">
            <input
              type="checkbox"
              checked={legendaryOnly}
              onChange={(event) => setLegendaryOnly(event.target.checked)}
            />{" "}
            Legendary only
          </label>
        </div>
        <ul className="advice-list">
          {advice.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="candidate-grid">
          {candidates.data
            ?.filter(
              (entry) => !team.some((member) => member._id === entry._id),
            )
            .slice(0, 3)
            .map((entry) => (
              <article key={entry._id} className="terminal-panel">
                {entry.image_url && <img src={entry.image_url} alt="" />}
                <div>
                  <strong>{entry.pokemon.name}</strong>
                  <span>
                    {[entry.pokemon.primary_type, entry.pokemon.secondary_type]
                      .filter(Boolean)
                      .map((type) => (
                        <TypeBadge key={type} type={type} compact />
                      ))}
                  </span>
                </div>
                <button
                  className="button button--quiet"
                  disabled={team.length >= 6}
                  onClick={() => add(entry)}
                >
                  Add
                </button>
              </article>
            ))}
        </div>
      </section>
      <section className="saved-teams terminal-panel">
        <div>
          <p className="eyebrow">Local teams</p>
          <h2 className="sys-prompt">Saved lineups</h2>
        </div>
        {savedTeams.length ? (
          <div className="saved-team-list">
            {savedTeams.map((saved) => (
              <article key={saved.id} className="terminal-panel">
                <div>
                  <strong>{saved.name}</strong>
                  <small>
                    {saved.members.map((member) => member.name).join(" · ")}
                  </small>
                </div>
                <button
                  className="button button--quiet"
                  onClick={() => loadTeam(saved)}
                >
                  Load
                </button>
                <button
                  className="text-button"
                  onClick={() => removeSavedTeam(saved.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No saved teams yet">
            Save a team once you have a lineup worth returning to.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
