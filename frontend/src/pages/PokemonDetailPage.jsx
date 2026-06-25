import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import apiBaseUrl from "../api";
import { PageHeader } from "../components/ui/PageHeader";
import { StatBar } from "../components/ui/StatBar";
import { ErrorBanner, PokeballLoader } from "../components/ui/States";
import { TypeBadge, TYPE_COLORS } from "../components/ui/TypeBadge";
import { useProfile } from "../context/ProfileContext";

// Recursive component to render the evolution chain
function EvolutionNode({ node }) {
  if (!node) return null;
  const idMatch = node.species?.url?.match(/\/pokemon-species\/(\d+)/);
  const id = idMatch ? idMatch[1] : null;

  return (
    <div className="evolution-tree">
      <Link to={`/pokemon/${id}`} className="evolution-node">
        <div className="evolution-node__art">
          {id ? (
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
              alt={node.species.name}
              loading="lazy"
            />
          ) : (
            <span>?</span>
          )}
        </div>
        <span className="evolution-node__name">
          {node.species?.name?.replace(/-/g, " ")}
        </span>
      </Link>
      {node.evolves_to && node.evolves_to.length > 0 && (
        <div className="evolution-branches">
          {node.evolves_to.map((child, index) => (
            <div key={index} className="evolution-branch">
              <span className="evolution-arrow">→</span>
              <EvolutionNode node={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PokemonDetailPage() {
  const { pokemonId } = useParams();
  const { addRecentlyViewed, isFavorite, toggleFavorite } = useProfile();
  const lastViewedId = useRef(null);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: ["pokemon-detail", pokemonId],
    queryFn: async () =>
      (await axios.get(`${apiBaseUrl}/pokemon/${pokemonId}`)).data,
  });

  const moves = useQuery({
    queryKey: ["pokemon-moves", pokemonId],
    queryFn: async () =>
      (
        await axios.get(`${apiBaseUrl}/pokemon/${pokemonId}/moves`, {
          params: { limit: 8 },
        })
      ).data.moves || [],
    enabled: detail.isSuccess,
  });

  const evolutions = useQuery({
    queryKey: ["pokemon-evolutions", pokemonId],
    queryFn: async () =>
      (await axios.get(`${apiBaseUrl}/pokemon/${pokemonId}/evolutions`)).data,
    enabled: detail.isSuccess,
  });

  const commentMutation = useMutation({
    mutationFn: async (text) =>
      (
        await axios.post(`${apiBaseUrl}/pokemon/${pokemonId}/comments`, {
          text,
        })
      ).data,
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({
        queryKey: ["pokemon-detail", pokemonId],
      });
    },
  });

  useEffect(() => {
    if (detail.data && lastViewedId.current !== pokemonId) {
      lastViewedId.current = pokemonId;
      addRecentlyViewed(detail.data);
    }
  }, [addRecentlyViewed, detail.data, pokemonId]);

  if (detail.isLoading) return <PokeballLoader label="Accessing Field Data…" />;
  if (detail.isError)
    return (
      <ErrorBanner
        title="Pokémon record unavailable"
        message={
          detail.error?.response?.data?.error?.message ||
          "This Pokémon could not be found."
        }
        onRetry={detail.refetch}
      />
    );

  const data = detail.data;
  const pokemon = data.pokemon || {};
  const stats = [
    ["HP", pokemon.hp],
    ["Attack", pokemon.attack],
    ["Defense", pokemon.defense],
    ["Sp. Atk", pokemon.special_attack || 0],
    ["Sp. Def", pokemon.special_defense || 0],
    ["Speed", pokemon.speed],
  ];
  const types = [pokemon.primary_type, pokemon.secondary_type].filter(Boolean);
  const species = data.species || {};
  const chain =
    evolutions.data?.evolution_chain?.chain || evolutions.data?.evolution_chain;
  const favorite = isFavorite(data);
  const primaryColor =
    TYPE_COLORS[types[0]?.toLowerCase()] || TYPE_COLORS.unknown;

  const stagger = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="detail-page"
      style={{ "--theme-color": primaryColor }}
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <Link className="back-link" to="/pokedex">
        ← System Root
      </Link>

      <motion.div variants={item}>
        <PageHeader
          eyebrow={`Entry #${String(pokemon.pokemonId || pokemonId).padStart(4, "0")}`}
          title={pokemon.name || "Pokémon"}
          description={`${species.generation?.replace("generation-", "Generation ") || "Species record"} · ${species.color || "Unknown"} color`}
          actions={
            <button
              className={`button ${favorite ? "button--primary" : "button--quiet"}`}
              onClick={() => toggleFavorite(data)}
              aria-pressed={favorite}
            >
              {favorite ? "★ Target Locked" : "☆ Lock Target"}
            </button>
          }
        />
      </motion.div>

      <motion.section className="detail-hero" variants={item}>
        <div className="detail-hero__art">
          <div className="detail-hero__radar-bg" />
          {data.image_url ? (
            <motion.img
              src={data.image_url}
              alt={pokemon.name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
            />
          ) : (
            <span>?</span>
          )}
        </div>

        <div className="detail-hero__facts">
          <div className="type-row type-row--detail">
            {types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>

          <p className="detail-hero__classification">
            <span className="sys-prompt">&gt;</span>
            {species.is_legendary
              ? "Legendary Data"
              : species.is_mythical
                ? "Mythical Data"
                : "Standard Species"}{" "}
            · Capture rate {pokemon.capture_rate ?? species.capture_rate ?? "—"}
          </p>

          <dl className="measurements">
            <div>
              <dt>Height</dt>
              <dd>{pokemon.height || "—"} m</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{pokemon.weight || "—"} kg</dd>
            </div>
            <div>
              <dt>Habitat</dt>
              <dd>{species.habitat || "Unknown"}</dd>
            </div>
          </dl>

          <div className="detail-actions">
            <Link
              className="button button--primary"
              to={`/pokemon/sightings/${pokemon.pokemonId || pokemonId}`}
            >
              Scan Area
            </Link>
            <Link className="button button--quiet" to="/battle">
              Combat Sim
            </Link>
          </div>
        </div>
      </motion.section>

      <div className="detail-grid">
        <motion.section className="detail-panel" variants={item}>
          <h2>
            <span className="sys-prompt">_</span>Base parameters
          </h2>
          <div className="stats-container">
            {stats.map(([label, value]) => (
              <StatBar key={label} label={label} value={value} />
            ))}
          </div>
        </motion.section>

        <motion.section className="detail-panel" variants={item}>
          <h2>
            <span className="sys-prompt">_</span>Combat protocols
          </h2>
          {moves.isLoading ? (
            <p className="terminal-text">Fetching data...</p>
          ) : (
            <ul className="move-list">
              {(moves.data || []).slice(0, 8).map((move, i) => (
                <motion.li
                  key={move.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <span>{move.name?.replace(/-/g, " ")}</span>
                  <small>
                    {move.type} · {move.power ?? "—"} pwr
                  </small>
                </motion.li>
              ))}
            </ul>
          )}
          {!moves.isLoading && !moves.data?.length && (
            <p className="terminal-text">No combat protocols found.</p>
          )}
        </motion.section>

        <motion.section
          className="detail-panel detail-panel--full"
          variants={item}
        >
          <h2>
            <span className="sys-prompt">_</span>Evolution tree
          </h2>
          {chain ? (
            <div className="evolution-container">
              <EvolutionNode node={chain} />
            </div>
          ) : (
            <p className="terminal-text">No evolution chain recorded.</p>
          )}
        </motion.section>

        <motion.section className="detail-panel" variants={item}>
          <h2>
            <span className="sys-prompt">_</span>Field notes
          </h2>
          {data.comments?.length ? (
            <ul className="comment-list">
              {data.comments.map((comment) => (
                <li key={comment.id}>
                  <strong>{comment.author}</strong>
                  <span>{comment.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="terminal-text">
              No field notes. Database is ready for input.
            </p>
          )}
        </motion.section>
      </div>

      <motion.section
        className="detail-panel detail-panel--comments"
        variants={item}
      >
        <h2>
          <span className="sys-prompt">&gt;</span>Append observation
        </h2>
        <form
          className="comment-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (commentText.trim()) commentMutation.mutate(commentText.trim());
          }}
        >
          <label htmlFor="pokemon-comment" className="sr-only">
            Your observation
          </label>
          <textarea
            id="pokemon-comment"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            maxLength="1000"
            placeholder="Enter field note..."
          />
          <button
            className="button button--quiet"
            type="submit"
            disabled={!commentText.trim() || commentMutation.isPending}
          >
            {commentMutation.isPending ? "Transmitting…" : "Transmit note"}
          </button>
          {commentMutation.isError && (
            <small className="form-error">Transmission failed. Retry.</small>
          )}
        </form>
      </motion.section>
    </motion.div>
  );
}
