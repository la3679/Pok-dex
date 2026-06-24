const TYPES = ['', 'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];

export function FilterPanel({ filters, onChange, onReset }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  return <aside className="filter-panel" aria-label="Pokédex filters">
    <div className="filter-panel__heading"><h2>Refine results</h2><button className="text-button" onClick={onReset}>Clear</button></div>
    <label>Primary type<select value={filters.primaryType} onChange={(event) => update('primaryType', event.target.value)}>{TYPES.map((type) => <option key={type} value={type}>{type || 'Any type'}</option>)}</select></label>
    <label>Generation<select value={filters.generation} onChange={(event) => update('generation', event.target.value)}><option value="">All generations</option>{Array.from({ length: 9 }, (_, index) => <option key={index} value={`generation-${index + 1}`}>Generation {index + 1}</option>)}</select></label>
    <label>Sort by<select value={filters.sortOption} onChange={(event) => update('sortOption', event.target.value)}>{['No.', 'Name', 'HP', 'Attack', 'Defense', 'Speed', 'Height', 'Weight', 'Capture Rate'].map((value) => <option key={value}>{value}</option>)}</select></label>
    <label className="filter-panel__checkbox"><input type="checkbox" checked={filters.legendary === 'true'} onChange={(event) => update('legendary', event.target.checked ? 'true' : '')} /> Legendary only</label>
  </aside>;
}
