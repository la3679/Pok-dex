import { Link } from 'react-router-dom';
import { TypeBadge } from './TypeBadge';

const paddedId = (id) => `#${String(id).padStart(4, '0')}`;

export function PokemonCard({ entry, mode = 'grid' }) {
  const pokemon = entry.pokemon || entry;
  const id = pokemon.pokemonId || pokemon.pokemon_id || entry._id;
  const name = pokemon.name || 'Unknown Pokémon';
  const types = [pokemon.primary_type, pokemon.secondary_type].filter(Boolean);
  const image = entry.image_url || pokemon.image_url;
  return (
    <article className={`pokemon-card pokemon-card--${mode}`}>
      <Link className="pokemon-card__link" to={`/pokemon/${id}`} aria-label={`View ${name}`}>
        <span className="pokemon-card__number">{paddedId(id)}</span>
        <div className="pokemon-card__art">{image ? <img src={image} alt="" loading="lazy" /> : <span>?</span>}</div>
        <div className="pokemon-card__content"><h2>{name}</h2><div className="type-row">{types.map((type) => <TypeBadge key={type} type={type} compact />)}</div></div>
      </Link>
      {mode !== 'compact' && <dl className="pokemon-card__stats"><div><dt>HP</dt><dd>{pokemon.hp || 0}</dd></div><div><dt>ATK</dt><dd>{pokemon.attack || 0}</dd></div><div><dt>SPD</dt><dd>{pokemon.speed || 0}</dd></div></dl>}
    </article>
  );
}
