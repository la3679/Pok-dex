import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import apiBaseUrl from "../api";
import { PokemonCard } from "../components/ui/PokemonCard";
import { PokeballLoader } from "../components/ui/States";
import { useProfile } from "../context/ProfileContext";

const numberFormat = new Intl.NumberFormat("en-US");

function formatStat(value) {
  return typeof value === "number" ? numberFormat.format(value) : "—";
}

const modules = [
  { to: "/pokedex", icon: "◈", title: "Pokédex", text: "Browse and search the full seeded catalog." },
  { to: "/map", icon: "⌖", title: "Sightings", text: "Scan field data on the radar exploration map." },
  { to: "/battle", icon: "⚔", title: "Battle", text: "Test your squad in turn-based combat." },
  { to: "/team-builder", icon: "⬡", title: "Team Builder", text: "Assemble and analyze a six-slot roster." },
  { to: "/analytics", icon: "◌", title: "Research Lab", text: "Dive into aggregated dataset insights." },
  { to: "/quiz", icon: "?", title: "Challenge", text: "Test your knowledge in challenge mode." },
];

export default function LandingPage() {
  const { favorites, recentlyViewed, savedTeams, battles } = useProfile();

  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured-pokemon"],
    queryFn: async () =>
      (await axios.get(`${apiBaseUrl}/pokemon`, { params: { perPage: 3, sortOption: "No." } })).data,
  });

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => (await axios.get(`${apiBaseUrl}/analytics/summary`)).data,
    staleTime: 5 * 60 * 1000,
  });

  const stats = [
    { value: formatStat(summary?.pokemon), label: "Pokémon records" },
    { value: formatStat(summary?.sightings), label: "Sightings logged" },
    { value: formatStat(summary?.types), label: "Elemental types" },
  ];

  const snapshot = [
    { value: favorites.length, label: "Collection", to: "/favorites" },
    { value: recentlyViewed.length, label: "Scan history", to: "/recent" },
    { value: savedTeams.length, label: "Saved teams", to: "/team-builder" },
    { value: battles.played, label: "Battles", to: "/battle/history" },
  ];

  return (
    <div className="landing-page">
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <p className="eyebrow">Field research console · ONLINE</p>
          <h1>
            Discover, analyze, and <em>battle</em> across the Pokédex.
          </h1>
          <p>
            A full-stack Pokémon discovery platform: a searchable catalog, a radar
            sightings map, a strategy lab, and a turn-based battle simulator —
            powered by a live seeded dataset.
          </p>
          <div className="hero-panel__actions">
            <Link className="button button--primary" to="/pokedex">
              Open Pokédex <span>→</span>
            </Link>
            <Link className="button button--quiet" to="/map">
              Explore the map
            </Link>
          </div>
          <dl className="hero-stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sys-prompt">{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="hero-panel__visual" aria-hidden="true">
          <div className="radar">
            <span />
            <i />
            <b />
          </div>
          <div className="hero-orb">
            <span />
          </div>
          <p>
            SYSTEM
            <br />
            ONLINE
          </p>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Modules</p>
            <h2 className="sys-prompt">Where do you want to go?</h2>
          </div>
        </div>
        <div className="module-grid">
          {modules.map((module) => (
            <Link key={module.to} to={module.to} className="module-card">
              <span className="module-card__icon" aria-hidden="true">{module.icon}</span>
              <div>
                <h3>{module.title}</h3>
                <p>{module.text}</p>
              </div>
              <span className="module-card__arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trainer snapshot · local</p>
            <h2 className="sys-prompt">Your saved data</h2>
          </div>
          <Link to="/profile">Open Trainer Console →</Link>
        </div>
        <dl className="snapshot-grid">
          {snapshot.map((item) => (
            <Link key={item.label} to={item.to} className="snapshot-tile">
              <dt>{numberFormat.format(item.value)}</dt>
              <dd>{item.label}</dd>
            </Link>
          ))}
        </dl>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start exploring</p>
            <h2 className="sys-prompt">Featured from the field guide</h2>
          </div>
          <Link to="/pokedex">See all Pokémon →</Link>
        </div>
        {isLoading ? (
          <PokeballLoader />
        ) : (
          <div className="pokemon-grid pokemon-grid--featured">
            {(featured?.pokemon || []).map((entry, index) => (
              <PokemonCard key={entry._id} entry={entry} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
