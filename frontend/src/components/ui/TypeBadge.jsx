const TYPE_COLORS = {
  normal: '#9aa278', fire: '#ef5a40', water: '#4e8fda', electric: '#e5b933',
  grass: '#5fae6b', ice: '#65b9c5', fighting: '#b14b47', poison: '#9a5bb1',
  ground: '#bc8950', flying: '#8197e1', psychic: '#d85a85', bug: '#849a38',
  rock: '#9a8752', ghost: '#7258a5', dragon: '#6d63cf', dark: '#67594f',
  steel: '#8294a1', fairy: '#d480a6', stellar: '#9a7bd6', unknown: '#68727e',
};

export function TypeBadge({ type, compact = false }) {
  if (!type) return null;
  const label = String(type).replace(/-/g, ' ');
  return (
    <span
      className={`type-badge ${compact ? 'type-badge--compact' : ''}`}
      style={{ '--type-color': TYPE_COLORS[type.toLowerCase()] || TYPE_COLORS.unknown }}
    >
      {label}
    </span>
  );
}

export { TYPE_COLORS };
