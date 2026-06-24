export function SearchAutocomplete({ value, onChange, resultCount }) {
  return <label className="search-autocomplete"><span className="sr-only">Search Pokémon</span><span aria-hidden="true">⌕</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search by name…" autoComplete="off" />{value && <button aria-label="Clear search" onClick={() => onChange('')}>×</button>}{typeof resultCount === 'number' && <small>{resultCount.toLocaleString()} found</small>}</label>;
}
