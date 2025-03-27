import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PokemonGame.css';

const PokemonGame = () => {
  const navigate = useNavigate();
  const [userPokemon, setUserPokemon] = useState([]);
  const [cpuPokemon, setCpuPokemon] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState([]);
  const [battleStarted, setBattleStarted] = useState(false);
  const [userTeam, setUserTeam] = useState([]);
  const [cpuTeam, setCpuTeam] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [battleLog, setBattleLog] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Type colors for background gradient and type badges
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

  // Fetch Pokémon when the component mounts or when "Play Again" is clicked
  const fetchPokemon = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/game/start');
      const { userPokemon, cpuPokemon } = response.data;

      // Initialize health and attack power for user Pokémon
      const initializedUserPokemon = userPokemon.map(p => ({
        ...p,
        health: p.pokemon.hp + p.pokemon.defense,
        maxHealth: p.pokemon.hp + p.pokemon.defense,
        attackPower: p.pokemon.attack + (p.pokemon.speed / 3) // Use full attack + 1/3 of speed
      }));

      // Initialize health and attack power for CPU Pokémon
      const initializedCpuPokemon = cpuPokemon.map(p => ({
        ...p,
        health: p.pokemon.hp + p.pokemon.defense,
        maxHealth: p.pokemon.hp + p.pokemon.defense,
        attackPower: p.pokemon.attack + (p.pokemon.speed / 3) // Use full attack + 1/3 of speed
      }));

      setUserPokemon(initializedUserPokemon);
      setCpuPokemon(initializedCpuPokemon);
      setSelectedPokemon([]);
      setBattleStarted(false);
      setUserTeam([]);
      setCpuTeam([]);
      setCurrentTurn(1);
      setBattleLog([]);
      setGameOver(false);
      setWinner(null);
      setError(null);
      setMessage(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load Pokémon. Please try again.');
    }
  };

  useEffect(() => {
    fetchPokemon();
  }, []);

  // Handle Pokémon selection
  const handleSelectPokemon = (pokemonId) => {
    setMessage(null);
    if (selectedPokemon.includes(pokemonId)) {
      setSelectedPokemon(selectedPokemon.filter(id => id !== pokemonId));
    } else if (selectedPokemon.length < 3) {
      setSelectedPokemon([...selectedPokemon, pokemonId]);
    } else {
      setMessage('You can only select 3 Pokémon.');
    }
  };

  // Confirm selection and start the battle
  const handleConfirmSelection = () => {
    if (selectedPokemon.length !== 3) {
      setMessage('Please select exactly 3 Pokémon to start the battle.');
      return;
    }

    const selectedTeam = userPokemon.filter(p => selectedPokemon.includes(p._id));
    setUserTeam(selectedTeam);
    setCpuTeam(cpuPokemon);
    setBattleStarted(true);
    setMessage('Selection confirmed! Starting battle...');
    setBattleLog([]);
  };

  // Process the next turn
  const handleNextTurn = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/game/turn', {
        userTeam,
        cpuTeam,
        currentTurn
      });

      const { userTeam: updatedUserTeam, cpuTeam: updatedCpuTeam, currentTurn: newTurn, battleLog: newLog, gameOver, winner } = response.data;

      setUserTeam(updatedUserTeam);
      setCpuTeam(updatedCpuTeam);
      setCurrentTurn(newTurn);
      setBattleLog([...battleLog, ...newLog]);
      setGameOver(gameOver);
      setWinner(winner);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process turn. Please try again.');
    }
  };

  // Navigate back to Pokédex
  const handleBackToPokedex = () => {
    navigate('/pokedex');
  };

  // Dismiss the popup to show the battle log and Pokémon teams, then re-show the popup after 30 seconds
  const handleShowBattleLog = () => {
    setGameOver(false); // Dismiss the popup
    setTimeout(() => {
      setGameOver(true); // Re-show the popup after 30 seconds
    }, 30000); // 30 seconds
  };

  // Render Pokémon card
  const renderPokemonCard = (pokemon, selectable = false, inBattle = false) => {
    const isSelected = selectedPokemon.includes(pokemon._id);
    const isFainted = inBattle && pokemon.health <= 0;

    return (
      <div
        className={`pokemon-card ${isFainted ? 'fainted' : ''}`}
        key={pokemon._id}
        style={{
          background: `linear-gradient(to bottom, ${typeColors[pokemon.pokemon.primary_type]} 0%, #fff 100%)`,
        }}
      >
        <div className="card-header">
          <span className="pokemon-number">#{pokemon.pokemon.pokemonId.toString().padStart(3, '0')}</span>
          <h2 className="pokemon-name">{pokemon.pokemon.name}</h2>
        </div>

        <div className="pokemon-image">
          {pokemon.image_path ? (
            <img
              src={`http://localhost:5000/api/images/${pokemon.image_path}`}
              alt={pokemon.pokemon.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150?text=Pokemon';
              }}
            />
          ) : (
            <img src="https://via.placeholder.com/150?text=Pokemon" alt={pokemon.pokemon.name} />
          )}
        </div>

        <div className="pokemon-types">
          <span
            className="type"
            style={{ backgroundColor: typeColors[pokemon.pokemon.primary_type] }}
          >
            {pokemon.pokemon.primary_type}
          </span>
          {pokemon.pokemon.secondary_type && (
            <span
              className="type"
              style={{ backgroundColor: typeColors[pokemon.pokemon.secondary_type] }}
            >
              {pokemon.pokemon.secondary_type}
            </span>
          )}
        </div>

        <div className="pokemon-stats">
          <div className="stat">
            <span className="stat-name">HP</span>
            <span className="stat-value">{pokemon.pokemon.hp}</span>
          </div>
          <div className="stat">
            <span className="stat-name">ATK</span>
            <span className="stat-value">{pokemon.pokemon.attack}</span>
          </div>
          <div className="stat">
            <span className="stat-name">DEF</span>
            <span className="stat-value">{pokemon.pokemon.defense}</span>
          </div>
          <div className="stat">
            <span className="stat-name">SPD</span>
            <span className="stat-value">{pokemon.pokemon.speed}</span>
          </div>
        </div>

        <div className="pokemon-metrics">
          <div className="metric">
            <span className="metric-name">Height</span>
            <span className="metric-value">{pokemon.pokemon.height} m</span>
          </div>
          <div className="metric">
            <span className="metric-name">Weight</span>
            <span className="metric-value">{pokemon.pokemon.weight} kg</span>
          </div>
          <div className="metric">
            <span className="metric-name">Capture</span>
            <span className="metric-value">{pokemon.pokemon.capture_rate}</span>
          </div>
        </div>

        {inBattle && (
          <div className="battle-stats">
            <p>Health: {pokemon.health.toFixed(2)}/{pokemon.maxHealth}</p>
            <p>Attack Power: {pokemon.attackPower.toFixed(2)}</p>
          </div>
        )}

        {selectable && (
          <label className="select-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectPokemon(pokemon._id)}
            />
            Select
          </label>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="game-container">
        <h1>Pokémon Battle Game</h1>
        <p className="error">{error}</p>
        <button onClick={handleBackToPokedex} className="back-button">
          Back to Pokédex
        </button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h1>Pokémon Battle Game</h1>
      <button onClick={handleBackToPokedex} className="back-button">
        Back to Pokédex
      </button>

      {!battleStarted ? (
        <>
          <h2>Select Your Team (Choose 3 Pokémon)</h2>
          {message && <p className="message">{message}</p>}
          <div className="pokemon-selection">
            {userPokemon.map(pokemon => renderPokemonCard(pokemon, true))}
          </div>
          <button onClick={handleConfirmSelection} className="confirm-button">
            Confirm Selection
          </button>
        </>
      ) : (
        <>
          <div className="battle-container">
            <div className="team user-team">
              <h2>Your Team</h2>
              <div className="pokemon-grid">
                {userTeam.map(pokemon => renderPokemonCard(pokemon, false, true))}
              </div>
            </div>
            <div className="team cpu-team">
              <h2>CPU Team</h2>
              <div className="pokemon-grid">
                {cpuTeam.map(pokemon => renderPokemonCard(pokemon, false, true))}
              </div>
            </div>
          </div>
          <div className="battle-controls">
            {!gameOver && (
              <button onClick={handleNextTurn} className="next-turn-button">
                Next Turn
              </button>
            )}
          </div>
          <div className="battle-log">
            <h3>Battle Log</h3>
            <div className="battle-log-content">
              {battleLog.map((log, index) => (
                <p key={index}>{log}</p>
              ))}
            </div>
          </div>
        </>
      )}

      {gameOver && (
        <div className="game-over-popup">
          <div className="popup-content">
            <h2>{winner === 'User' ? 'You Win!' : winner === 'CPU' ? 'You Lose!' : 'It\'s a Draw!'}</h2>
            <button onClick={fetchPokemon} className="play-again-button">
              Play Again
            </button>
            <button onClick={handleBackToPokedex} className="back-button">
              Return to Pokédex
            </button>
            <button onClick={handleShowBattleLog} className="battle-log-button">
              Watch Battle Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonGame;