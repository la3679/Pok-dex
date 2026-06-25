import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import apiBaseUrl from "../api";
import { PokemonCard } from "../components/ui/PokemonCard";
import { PokeballLoader } from "../components/ui/States";

export default function LandingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-pokemon"],
    queryFn: async () =>
      (
        await axios.get(`${apiBaseUrl}/pokemon`, {
          params: { perPage: 3, sortOption: "No." },
        })
      ).data,
  });

  return (
    <div className="pokedex-screen landing-page">
      <div className="boot-screen__scanlines" />
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <p className="eyebrow">Your field guide, re-engineered</p>
          <h1>
            Every discovery deserves a <em>great</em> Pokédex.
          </h1>
          <p>
            Explore a richly seeded Pokémon catalog, study type matchups, visit
            local sightings, and step into battle.
          </p>
          <div className="hero-panel__actions">
            <Link className="button button--primary" to="/pokedex">
              Open Pokédex <span>→</span>
            </Link>
            <Link className="button button--quiet" to="/map">
              Explore sightings
            </Link>
          </div>
          <dl className="hero-stats">
            <div>
              <dt className="sys-prompt">1,350+</dt>
              <dd>Pokémon records</dd>
            </div>
            <div>
              <dt className="sys-prompt">296K</dt>
              <dd>Sighting points</dd>
            </div>
            <div>
              <dt className="sys-prompt">18</dt>
              <dd>Elemental types</dd>
            </div>
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
            <p className="eyebrow">Start exploring</p>
            <h2 className="sys-prompt">Featured from the field guide</h2>
          </div>
          <Link to="/pokedex">See all Pokémon →</Link>
        </div>
        {isLoading ? (
          <PokeballLoader />
        ) : (
          <div className="pokemon-grid pokemon-grid--featured">
            {(data?.pokemon || []).map((entry, index) => (
              <PokemonCard key={entry._id} entry={entry} index={index} />
            ))}
          </div>
        )}
      </section>

      <section className="feature-grid">
        <article className="terminal-panel">
          <span>⌕</span>
          <h2 className="sys-prompt">Find your next favorite</h2>
          <p className="terminal-text">
            Search by name, filter by type or generation, and inspect every core
            stat.
          </p>
          <Link to="/pokedex">Browse catalog →</Link>
        </article>
        <article className="terminal-panel">
          <span>⌖</span>
          <h2 className="sys-prompt">Track sightings</h2>
          <p className="terminal-text">
            Bring the live map into view when you want to explore the dataset
            geographically.
          </p>
          <Link to="/map">Open map →</Link>
        </article>
        <article className="terminal-panel">
          <span>⚔</span>
          <h2 className="sys-prompt">Take the field</h2>
          <p className="terminal-text">
            Choose a team and test your instincts in the original turn-based
            battle mode.
          </p>
          <Link to="/battle">Start a battle →</Link>
        </article>
      </section>
    </div>
  );
}
