import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import PokedexPage from './pages/PokedexPage';
import PokemonDetailPage from './pages/PokemonDetailPage';
import PersonalCollectionPage from './pages/PersonalCollectionPage';
import ProfilePage from './pages/ProfilePage';
import ComparePage from './pages/ComparePage';
import TeamBuilderPage from './pages/TeamBuilderPage';
import TypeChartPage from './pages/TypeChartPage';
import BattlePage from './pages/BattlePage';
import BattleHistoryPage from './pages/BattleHistoryPage';
import SightingsMapPage from './pages/SightingsMapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AchievementsPage from './pages/AchievementsPage';
import QuizPage from './pages/QuizPage';
import WhoWouldWinPage from './pages/WhoWouldWinPage';
import AboutPage from './pages/AboutPage';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div 
          key={location.pathname} 
          className="route-motion" 
          initial={{ opacity: 0, x: 15 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: -15 }} 
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pokedex" element={<PokedexPage />} />
            <Route path="/pokemon/:pokemonId" element={<PokemonDetailPage />} />
            <Route path="/pokemon/sightings/:pokemonId" element={<SightingsMapPage />} />
            <Route path="/map" element={<SightingsMapPage />} />
            <Route path="/battle" element={<BattlePage />} />
            <Route path="/game" element={<Navigate to="/battle" replace />} />
            <Route path="/favorites" element={<PersonalCollectionPage collection="favorites" />} />
            <Route path="/recent" element={<PersonalCollectionPage collection="recent" />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/team-builder" element={<TeamBuilderPage />} />
            <Route path="/type-chart" element={<TypeChartPage />} />
            <Route path="/battle/history" element={<BattleHistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/who-would-win" element={<WhoWouldWinPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
