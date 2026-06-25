const TYPES = ['', 'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'];

export function FilterPanel({ filters, onChange, onReset }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <aside className="filter-panel" aria-label="Pokédex filters">
      <div className="filter-panel__heading">
        <h2>Refine results</h2>
        <button className="text-button" onClick={onReset}>Clear</button>
      </div>
      
      <label>Primary type
        <select value={filters.primaryType || ''} onChange={(e) => update('primaryType', e.target.value)}>
          {TYPES.map((type) => <option key={type} value={type}>{type || 'Any type'}</option>)}
        </select>
      </label>
      
      <label>Secondary type
        <select value={filters.secondaryType || ''} onChange={(e) => update('secondaryType', e.target.value)}>
          {TYPES.map((type) => <option key={type} value={type}>{type || 'Any type'}</option>)}
        </select>
      </label>

      <label>Generation
        <select value={filters.generation || ''} onChange={(e) => update('generation', e.target.value)}>
          <option value="">All generations</option>
          {ROMAN.map((num, index) => <option key={num} value={`generation-${num}`}>Generation {index + 1}</option>)}
        </select>
      </label>

      <label>Sort by
        <select value={filters.sortOption || 'No.'} onChange={(e) => update('sortOption', e.target.value)}>
          {['No.', 'Name', 'HP', 'Attack', 'Defense', 'Speed', 'Height', 'Weight', 'Capture Rate'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>

      <label>Min Height (m)
        <input type="number" min="0" step="0.1" value={filters.minHeight || ''} onChange={(e) => update('minHeight', e.target.value)} placeholder="0.0" />
      </label>

      <label>Max Height (m)
        <input type="number" min="0" step="0.1" value={filters.maxHeight || ''} onChange={(e) => update('maxHeight', e.target.value)} placeholder="100.0" />
      </label>

      <label>Min Weight (kg)
        <input type="number" min="0" step="0.1" value={filters.minWeight || ''} onChange={(e) => update('minWeight', e.target.value)} placeholder="0.0" />
      </label>

      <label>Max Weight (kg)
        <input type="number" min="0" step="0.1" value={filters.maxWeight || ''} onChange={(e) => update('maxWeight', e.target.value)} placeholder="1000.0" />
      </label>
      
      <label className="filter-panel__checkbox">
        <input type="checkbox" checked={filters.legendary === 'true'} onChange={(e) => update('legendary', e.target.checked ? 'true' : '')} /> Legendary only
      </label>
    </aside>
  );
}
