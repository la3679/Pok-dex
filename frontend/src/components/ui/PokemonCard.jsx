import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TypeBadge, TYPE_COLORS } from './TypeBadge';
import { useProfile } from '../../context/ProfileContext';

const paddedId = (id) => `#${String(id).padStart(4, '0')}`;

export function PokemonCard({ entry, mode = 'grid', index = 0 }) {
  const { isFavorite, toggleFavorite } = useProfile();
  const pokemon = entry.pokemon || entry;
  const id = pokemon.pokemonId || pokemon.pokemon_id || entry._id;
  const name = pokemon.name || 'Unknown Pokémon';
  const types = [pokemon.primary_type, pokemon.secondary_type].filter(Boolean);
  const image = entry.image_url || pokemon.image_url;
  const favorite = isFavorite(entry);
  
  const primaryColor = TYPE_COLORS[types[0]?.toLowerCase()] || TYPE_COLORS.unknown;

  return (
    <motion.article 
      className={`pokemon-card pokemon-card--${mode}`}
      style={{ '--card-color': primaryColor }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <Link className="pokemon-card__link" to={`/pokemon/${id}`} aria-label={`View ${name}`}>
        <div className="pokemon-card__header">
          <span className="pokemon-card__number">{paddedId(id)}</span>
        </div>
        <div className="pokemon-card__art">
          {image ? <img src={image} alt="" loading="lazy" /> : <span>?</span>}
        </div>
        <div className="pokemon-card__content">
          <h2>{name}</h2>
          <div className="type-row">
            {types.map((type) => <TypeBadge key={type} type={type} compact />)}
          </div>
        </div>
      </Link>
      <button 
        className={`favorite-button ${favorite ? 'favorite-button--active' : ''}`} 
        onClick={() => toggleFavorite(entry)} 
        aria-label={`${favorite ? 'Remove' : 'Add'} ${name} ${favorite ? 'from' : 'to'} favorites`} 
        aria-pressed={favorite}
      >
        {favorite ? '★' : '☆'}
      </button>
      {mode !== 'compact' && (
        <dl className="pokemon-card__stats">
          <div><dt>HP</dt><dd>{pokemon.hp || 0}</dd></div>
          <div><dt>ATK</dt><dd>{pokemon.attack || 0}</dd></div>
          <div><dt>SPD</dt><dd>{pokemon.speed || 0}</dd></div>
        </dl>
      )}
    </motion.article>
  );
}
