import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import PokemonSightings from './components/Pokedex/PokemonSightings';
import PokemonGame from './components/PokemonGame/PokemonGame';
import LandingPage from './pages/LandingPage';
import PokedexPage from './pages/PokedexPage';
import PokemonDetailPage from './pages/PokemonDetailPage';
import FeaturePlaceholder from './pages/FeaturePlaceholder';

function AnimatedRoutes() {
  const location = useLocation();
  return <AppShell><AnimatePresence mode="wait"><motion.div key={location.pathname} className="route-motion" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}><Routes location={location}>
    <Route path="/" element={<LandingPage />} />
    <Route path="/pokedex" element={<PokedexPage />} />
    <Route path="/pokemon/:pokemonId" element={<PokemonDetailPage />} />
    <Route path="/pokemon/sightings/:pokemonId" element={<PokemonSightings />} />
    <Route path="/map" element={<FeaturePlaceholder feature="map" />} />
    <Route path="/battle" element={<PokemonGame />} />
    <Route path="/game" element={<Navigate to="/battle" replace />} />
    <Route path="/favorites" element={<FeaturePlaceholder feature="favorites" />} />
    <Route path="/recent" element={<FeaturePlaceholder feature="recent" />} />
    <Route path="/compare" element={<FeaturePlaceholder feature="compare" />} />
    <Route path="/team-builder" element={<FeaturePlaceholder feature="team-builder" />} />
    <Route path="/type-chart" element={<FeaturePlaceholder feature="type-chart" />} />
    <Route path="/battle/history" element={<FeaturePlaceholder feature="battle-history" />} />
    <Route path="/analytics" element={<FeaturePlaceholder feature="analytics" />} />
    <Route path="/about" element={<FeaturePlaceholder feature="about" />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></motion.div></AnimatePresence></AppShell>;
}

export default function App() { return <BrowserRouter><AnimatedRoutes /></BrowserRouter>; }
