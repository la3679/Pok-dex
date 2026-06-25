const TYPE_COLORS = {
  normal: '#a8a77a', fire: '#ee8130', water: '#6390f0', electric: '#f7d02c',
  grass: '#7ac74c', ice: '#96d9d6', fighting: '#c22e28', poison: '#a33ea1',
  ground: '#e2bf65', flying: '#a98ff3', psychic: '#f95587', bug: '#a6b91a',
  rock: '#b6a136', ghost: '#735797', dragon: '#6f35fc', dark: '#705746',
  steel: '#b7b7ce', fairy: '#d685ad', stellar: '#9a7bd6', unknown: '#68727e',
};

export function TypeBadge({ type, compact = false }) {
  if (!type) return null;
  const label = String(type).replace(/-/g, ' ');
  const color = TYPE_COLORS[type.toLowerCase()] || TYPE_COLORS.unknown;
  return (
    <span
      className={`type-badge ${compact ? 'type-badge--compact' : ''}`}
      style={{ 
        '--type-color': color,
        border: `1px solid color-mix(in srgb, ${color} 50%, transparent)`,
        boxShadow: `0 0 10px color-mix(in srgb, ${color} 20%, transparent)`
      }}
    >
      <span 
        className="type-badge__dot" 
        style={{ 
          backgroundColor: color,
          boxShadow: `0 0 5px ${color}`
        }} 
        aria-hidden="true" 
      />
      {label}
    </span>
  );
}

export { TYPE_COLORS };
