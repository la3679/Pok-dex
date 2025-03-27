import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Pokedex from './components/Pokedex/Pokedex';
import PokemonSightings from './components/Pokedex/PokemonSightings';
import PokemonGame from './components/PokemonGame/PokemonGame';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>Pokémon MongoDB Project</h1>
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/pokedex" element={<Pokedex />} />
            <Route path="/pokemon/sightings/:pokemonId" element={<PokemonSightings />} />
            <Route path="/game" element={<PokemonGame />} />
            <Route path="*" element={<Navigate to="/pokedex" />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>MongoDB Project - 2025</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;