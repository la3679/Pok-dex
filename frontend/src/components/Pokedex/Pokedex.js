import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Pokedex.css';

const Pokedex = () => {
  const navigate = useNavigate();

  // State for the Pokémon list and pagination
  const [pokemon, setPokemon] = useState([]);
  const [totalPokemon, setTotalPokemon] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // State for filter inputs (what the user is typing/selecting)
  const [searchTermInput, setSearchTermInput] = useState('');
  const [filtersInput, setFiltersInput] = useState({
    primaryType: '',
    secondaryType: '',
    minHeight: '',
    maxHeight: '',
    minWeight: '',
    maxWeight: '',
    minCaptureRate: '',
    maxCaptureRate: '',
    legendary: '',
  });
  const [sortOptionInput, setSortOptionInput] = useState('No.');

  // State for applied filters (what the API actually uses)
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    primaryType: '',
    secondaryType: '',
    minHeight: '',
    maxHeight: '',
    minWeight: '',
    maxWeight: '',
    minCaptureRate: '',
    maxCaptureRate: '',
    legendary: '',
    sortOption: 'No.',
  });

  // State for Pokéball animation
  const [showPokeball, setShowPokeball] = useState(false);

  const typeColors = {
    Normal: '#A8A878',
    Fire: '#F08030',
    Water: '#6890F0',
    Electric: '#F8D030',
    Grass: '#78C850',
    Ice: '#98D8D8',
    Fighting: '#C03028',
    Poison: '#A040A0',
    Ground: '#E0C068',
    Flying: '#A890F0',
    Psychic: '#F85888',
    Bug: '#A8B820',
    Rock: '#B8A038',
    Ghost: '#705898',
    Dragon: '#7038F8',
    Dark: '#705848',
    Steel: '#B8B8D0',
    Fairy: '#EE99AC',
  };

  const allTypes = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic',
    'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
  ];

  // Fetch Pokémon data
  const fetchPokemon = useCallback(async (page = 1, perPage = 20, searchTermOverride = appliedFilters.searchTerm) => {
    try {
      setLoading(true);
      const params = {
        page,
        perPage,
        sortOption: appliedFilters.sortOption,
        searchTerm: searchTermOverride || undefined,
        primaryType: appliedFilters.primaryType || undefined,
        secondaryType: appliedFilters.secondaryType || undefined,
        minHeight: appliedFilters.minHeight ? parseFloat(appliedFilters.minHeight) : undefined,
        maxHeight: appliedFilters.maxHeight ? parseFloat(appliedFilters.maxHeight) : undefined,
        minWeight: appliedFilters.minWeight ? parseFloat(appliedFilters.minWeight) : undefined,
        maxWeight: appliedFilters.maxWeight ? parseFloat(appliedFilters.maxWeight) : undefined,
        minCaptureRate: appliedFilters.minCaptureRate ? parseInt(appliedFilters.minCaptureRate) : undefined,
        maxCaptureRate: appliedFilters.maxCaptureRate ? parseInt(appliedFilters.maxCaptureRate) : undefined,
        legendary: appliedFilters.legendary || undefined,
      };

      const response = await axios.get('http://localhost:5000/api/pokemon', { params });
      setPokemon(response.data.pokemon);
      setTotalPokemon(response.data.totalPokemon);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Pokémon data:', error.response?.data || error.message);
      setLoading(false);
    }
  }, [appliedFilters]);

  // Debounce function for search
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      setAppliedFilters((prev) => ({ ...prev, searchTerm: searchValue }));
      fetchPokemon(1, 20, searchValue); // Fetch with the new search term immediately
    }, 500),
    [fetchPokemon]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTermInput(value);
    debouncedSearch(value); // Trigger debounced search
  };

  // Initial fetch and fetch on page change or applied filter change (excluding search)
  useEffect(() => {
    fetchPokemon(currentPage);
  }, [currentPage, appliedFilters.primaryType, appliedFilters.secondaryType, appliedFilters.minHeight, 
    appliedFilters.maxHeight, appliedFilters.minWeight, appliedFilters.maxWeight, 
    appliedFilters.minCaptureRate, appliedFilters.maxCaptureRate, appliedFilters.legendary, 
    appliedFilters.sortOption, fetchPokemon]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltersInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSortChange = (e) => {
    setSortOptionInput(e.target.value);
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setAppliedFilters({
      searchTerm: searchTermInput, // Keep the current search term
      primaryType: filtersInput.primaryType,
      secondaryType: filtersInput.secondaryType,
      minHeight: filtersInput.minHeight,
      maxHeight: filtersInput.maxHeight,
      minWeight: filtersInput.minWeight,
      maxWeight: filtersInput.maxWeight,
      minCaptureRate: filtersInput.minCaptureRate,
      maxCaptureRate: filtersInput.maxCaptureRate,
      legendary: filtersInput.legendary,
      sortOption: sortOptionInput,
    });
    setCurrentPage(1); // Reset to page 1 when applying filters
  };

  const handleResetFilters = () => {
    setSearchTermInput('');
    setFiltersInput({
      primaryType: '',
      secondaryType: '',
      minHeight: '',
      maxHeight: '',
      minWeight: '',
      maxWeight: '',
      minCaptureRate: '',
      maxCaptureRate: '',
      legendary: '',
    });
    setSortOptionInput('No.');
    setAppliedFilters({
      searchTerm: '',
      primaryType: '',
      secondaryType: '',
      minHeight: '',
      maxHeight: '',
      minWeight: '',
      maxWeight: '',
      minCaptureRate: '',
      maxCaptureRate: '',
      legendary: '',
      sortOption: 'No.',
    });
    setCurrentPage(1); // Reset to page 1 when resetting filters
  };

  const viewPokemonSightings = (pokemonId, pokemonName) => {
    setShowPokeball(true); // Show the Pokéball animation
    setTimeout(() => {
      setShowPokeball(false);
      navigate(`/pokemon/sightings/${pokemonId}`, { state: { pokemonName } });
    }, 800);
  };

  // Navigate to the game page
  const handlePlayGame = () => {
    navigate('/game');
  };

  if (loading) {
    return <div className="loading">Loading Pokédex...</div>;
  }

  return (
    <div className="pokedex-container">
      <h1>Pokédex</h1>
      <button onClick={handlePlayGame} className="play-game-button">
        Play Pokémon Battle Game
      </button>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search Pokémon..."
          value={searchTermInput}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      <form onSubmit={handleApplyFilters} className="filters-container">
        <h3>Filters</h3>
        <div className="filter-grid">
          <div className="filter-group">
            <label htmlFor="primaryType">Primary Type</label>
            <select
              id="primaryType"
              name="primaryType"
              value={filtersInput.primaryType}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              {allTypes.map((type) => (
                <option key={`primary-${type}`} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="secondaryType">Secondary Type</label>
            <select
              id="secondaryType"
              name="secondaryType"
              value={filtersInput.secondaryType}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              {allTypes.map((type) => (
                <option key={`secondary-${type}`} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="minHeight">Min Height (m)</label>
            <input
              type="number"
              id="minHeight"
              name="minHeight"
              min="0"
              step="0.1"
              value={filtersInput.minHeight}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="maxHeight">Max Height (m)</label>
            <input
              type="number"
              id="maxHeight"
              name="maxHeight"
              min="0"
              step="0.1"
              value={filtersInput.maxHeight}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="minWeight">Min Weight (kg)</label>
            <input
              type="number"
              id="minWeight"
              name="minWeight"
              min="0"
              step="0.1"
              value={filtersInput.minWeight}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="maxWeight">Max Weight (kg)</label>
            <input
              type="number"
              id="maxWeight"
              name="maxWeight"
              min="0"
              step="0.1"
              value={filtersInput.maxWeight}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="minCaptureRate">Min Capture Rate</label>
            <input
              type="number"
              id="minCaptureRate"
              name="minCaptureRate"
              min="0"
              max="255"
              value={filtersInput.minCaptureRate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="maxCaptureRate">Max Capture Rate</label>
            <input
              type="number"
              id="maxCaptureRate"
              name="maxCaptureRate"
              min="0"
              max="255"
              value={filtersInput.maxCaptureRate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="legendary">Legendary</label>
            <select
              id="legendary"
              name="legendary"
              value={filtersInput.legendary}
              onChange={handleFilterChange}
            >
              <option value="">All Pokémon</option>
              <option value="true">Legendary Only</option>
              <option value="false">Non-Legendary Only</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sortOption">Sort By</label>
            <select
              id="sortOption"
              name="sortOption"
              value={sortOptionInput}
              onChange={handleSortChange}
            >
              <option value="No.">Number</option>
              <option value="Name">Name</option>
              <option value="HP">HP</option>
              <option value="Attack">Attack</option>
              <option value="Defense">Defense</option>
              <option value="Speed">Speed</option>
              <option value="Height">Height</option>
              <option value="Weight">Weight</option>
              <option value="Capture Rate">Capture Rate</option>
            </select>
          </div>
        </div>
        <div className="filter-buttons">
          <button type="submit" className="apply-button">Apply Filters</button>
          <button type="button" className="reset-button" onClick={handleResetFilters}>Reset Filters</button>
        </div>
      </form>

      <div className="results-info">
        Found {totalPokemon} Pokémon matching your criteria
      </div>

      <div className="pokemon-grid">
        {pokemon.length === 0 ? (
          <div className="no-results">No Pokémon found matching your criteria</div>
        ) : (
          pokemon.map((poke) => (
            <div
              key={poke.pokemon.pokemonId}
              className="pokemon-card"
              style={{
                background: `linear-gradient(to bottom, ${typeColors[poke.pokemon.primary_type]} 0%, #fff 100%)`,
              }}
            >
              <div className="card-header">
                <span className="pokemon-number">#{poke.pokemon.pokemonId.toString().padStart(3, '0')}</span>
                <h2 className="pokemon-name">{poke.pokemon.name}</h2>
              </div>

              <div className="pokemon-image">
                <img
                  src={poke.image_path ? `http://localhost:5000/api/images/${poke.image_path}` : 'https://via.placeholder.com/150?text=Pokemon'}
                  alt={poke.pokemon.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150?text=Pokemon';
                  }}
                />
              </div>

              <div className="pokemon-types">
                <span
                  className="type"
                  style={{ backgroundColor: typeColors[poke.pokemon.primary_type] }}
                >
                  {poke.pokemon.primary_type}
                </span>
                {poke.pokemon.secondary_type && (
                  <span
                    className="type"
                    style={{ backgroundColor: typeColors[poke.pokemon.secondary_type] }}
                  >
                    {poke.pokemon.secondary_type}
                  </span>
                )}
              </div>

              <div className="pokemon-stats">
                <div className="stat">
                  <span className="stat-name">HP</span>
                  <span className="stat-value">{poke.pokemon.hp}</span>
                </div>
                <div className="stat">
                  <span className="stat-name">ATK</span>
                  <span className="stat-value">{poke.pokemon.attack}</span>
                </div>
                <div className="stat">
                  <span className="stat-name">DEF</span>
                  <span className="stat-value">{poke.pokemon.defense}</span>
                </div>
                <div className="stat">
                  <span className="stat-name">SPD</span>
                  <span className="stat-value">{poke.pokemon.speed}</span>
                </div>
              </div>

              <div className="pokemon-metrics">
                <div className="metric">
                  <span className="metric-name">Height</span>
                  <span className="metric-value">{poke.pokemon.height} m</span>
                </div>
                <div className="metric">
                  <span className="metric-name">Weight</span>
                  <span className="metric-value">{poke.pokemon.weight} kg</span>
                </div>
                <div className="metric">
                  <span className="metric-name">Capture</span>
                  <span className="metric-value">{poke.pokemon.capture_rate}</span>
                </div>
              </div>

              {poke.pokemon.legendary && (
                <div className="legendary-badge">Legendary</div>
              )}

              <button
                className="sightings-button"
                onClick={() => viewPokemonSightings(poke.pokemon.pokemonId, poke.pokemon.name)}
              >
                See All Sightings
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pokéball animation element */}
      {showPokeball && <div className="pokeball-throw"></div>}

      <div className="pagination">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="page-info">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pokedex;
