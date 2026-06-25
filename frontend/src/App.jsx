import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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

// Each module type gets a transition that matches its character. Values stay
// on transform/opacity so the GPU handles them and nothing reflows.
const transitions = {
  dashboard: { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.01 } },
  catalog: { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } },
  record: { initial: { opacity: 0, scale: 0.965, y: 10 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.99 } },
  map: { initial: { opacity: 0, scale: 1.03 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.02 } },
  battle: { initial: { opacity: 0, y: -24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 16 } },
  analytics: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } },
  default: { initial: { opacity: 0, x: 15 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -15 } },
};

function transitionKind(pathname) {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/pokemon/sightings') || pathname === '/map') return 'map';
  if (pathname.startsWith('/pokemon/')) return 'record';
  if (pathname.startsWith('/pokedex')) return 'catalog';
  if (pathname.startsWith('/battle')) return 'battle';
  if (pathname.startsWith('/analytics')) return 'analytics';
  return 'default';
}

function AnimatedRoutes() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const kind = transitionKind(location.pathname);
  const variant = transitions[kind];
  // Reduced motion: collapse to a quick, transform-free crossfade.
  const motionProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : { ...variant, transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } };

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          className={`route-motion route-motion--${kind}`}
          {...motionProps}
        >
          {!reduceMotion && <span className="route-scan" aria-hidden="true" />}
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
