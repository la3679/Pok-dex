import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import apiBaseUrl from "../api";
import { PageHeader } from "../components/ui/PageHeader";
import { PokeballLoader } from "../components/ui/States";
import { TypeBadge } from "../components/ui/TypeBadge";
import { BATTLE_TYPES, effectiveness, typeMap } from "../lib/strategy";

export default function TypeChartPage() {
  const [attacking, setAttacking] = useState("fire");
  const [defending, setDefending] = useState(["grass"]);
  const types = useQuery({
    queryKey: ["types"],
    queryFn: async () => (await axios.get(`${apiBaseUrl}/types`)).data.types,
  });
  const multiplier = useMemo(
    () => effectiveness(attacking, defending, typeMap(types.data)),
    [attacking, defending, types.data],
  );
  const toggleDefender = (type) =>
    setDefending((current) =>
      current.includes(type)
        ? current.filter((entry) => entry !== type)
        : current.length < 2
          ? [...current, type]
          : [type],
    );
  if (types.isLoading) return <PokeballLoader label="Loading type chart…" />;
  return (
    <div className="pokedex-screen type-chart-page">
      <div className="boot-screen__scanlines" />
      <PageHeader
        eyebrow="Strategy tools"
        title="Type effectiveness"
        description="Choose an attacking type, then select up to two defending types. Multipliers use the same canonical type relation data served by the API."
      />
      <section className="type-chart-tool terminal-panel">
        <label className="type-select">
          Attacking type
          <select
            className="terminal-input"
            value={attacking}
            onChange={(event) => setAttacking(event.target.value)}
          >
            {BATTLE_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <div
          className={`type-result type-result--${multiplier > 1 ? "strong" : multiplier === 0 ? "immune" : multiplier < 1 ? "weak" : "neutral"} terminal-panel`}
        >
          <strong className="sys-prompt">{multiplier}×</strong>
          <span className="terminal-text">
            {multiplier === 0
              ? "No effect"
              : multiplier > 1
                ? "Super effective"
                : multiplier < 1
                  ? "Not very effective"
                  : "Neutral damage"}
          </span>
          <div>
            <TypeBadge type={attacking} /> <span>→</span>{" "}
            {defending.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      </section>
      <section className="type-chart-panel terminal-panel">
        <div>
          <p className="eyebrow">Defending types</p>
          <h2 className="sys-prompt">Select one or two types</h2>
        </div>
        <div className="type-selector-grid">
          {BATTLE_TYPES.map((type) => (
            <button
              key={type}
              className={defending.includes(type) ? "is-selected" : ""}
              onClick={() => toggleDefender(type)}
              aria-pressed={defending.includes(type)}
            >
              <TypeBadge type={type} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
