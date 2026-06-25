import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import apiBaseUrl from '../../api';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchAutocomplete({ value, onChange, resultCount }) {
  const [term, setTerm] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedTerm = useDebounce(term, 300);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setTerm(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const results = useQuery({
    queryKey: ['autocomplete', debouncedTerm],
    queryFn: async () => (await axios.get(`${apiBaseUrl}/pokemon`, { params: { searchTerm: debouncedTerm, perPage: 6, sortOption: 'No.' } })).data.pokemon,
    enabled: debouncedTerm.trim().length >= 2
  });

  const handleSelect = (name) => {
    setTerm(name);
    setShowDropdown(false);
    onChange(name);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setShowDropdown(false);
      onChange(term);
    }
  };

  const handleChange = (e) => {
    setTerm(e.target.value);
    setShowDropdown(true);
    if (e.target.value === '') {
      onChange('');
    }
  };

  const handleClear = () => {
    setTerm('');
    onChange('');
    setShowDropdown(false);
  };

  return (
    <div className="search-autocomplete-wrapper" style={{ position: 'relative', flex: 1, maxWidth: '38rem' }} ref={wrapperRef}>
      <label className="search-autocomplete" style={{ maxWidth: 'none' }}>
        <span className="sr-only">Search Pokémon</span>
        <span aria-hidden="true">⌕</span>
        <input 
          value={term} 
          onChange={handleChange} 
          onKeyDown={handleKeyDown}
          onFocus={() => { if (term.trim().length >= 2) setShowDropdown(true); }}
          placeholder="Search by name…" 
          autoComplete="off" 
        />
        {term && <button aria-label="Clear search" onClick={handleClear}>×</button>}
        {typeof resultCount === 'number' && !showDropdown && <small>{resultCount.toLocaleString()} found</small>}
      </label>
      
      {showDropdown && debouncedTerm.trim().length >= 2 && (
        <div className="picker-results" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: '0.45rem' }}>
          {results.isLoading && <p>Searching catalog…</p>}
          {results.data?.map((entry) => (
            <button key={entry._id} onClick={() => handleSelect(entry.pokemon.name)} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.75rem' }}>
              {entry.image_url && <img src={entry.image_url} alt="" style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }} />}
              <span><strong>{entry.pokemon.name}</strong></span>
              <b style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '0.8rem' }}>#{entry.pokemon.pokemonId}</b>
            </button>
          ))}
          {results.data?.length === 0 && <p>No Pokémon matched.</p>}
        </div>
      )}
    </div>
  );
}
