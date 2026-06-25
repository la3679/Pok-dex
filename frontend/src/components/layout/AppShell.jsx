import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { BootSequence } from '../ui/BootSequence';

// Navigation is grouped into "modules" so the sidebar reads like a Pokédex
// device menu rather than a flat list of links.
const navGroups = [
  {
    title: 'Field',
    items: [
      { to: '/pokedex', label: 'Pokédex', icon: '◈' },
      { to: '/map', label: 'Sightings', icon: '⌖' },
      { to: '/analytics', label: 'Analytics', icon: '◌' },
    ],
  },
  {
    title: 'Combat',
    items: [
      { to: '/battle', label: 'Battle', icon: '⚔' },
      { to: '/battle/history', label: 'Battle Log', icon: '▤' },
      { to: '/who-would-win', label: 'Who Would Win', icon: '⚡' },
      { to: '/quiz', label: 'Quiz', icon: '?' },
    ],
  },
  {
    title: 'Strategy',
    items: [
      { to: '/compare', label: 'Compare', icon: '⇄' },
      { to: '/team-builder', label: 'Team Builder', icon: '⬡' },
      { to: '/type-chart', label: 'Type Chart', icon: '▦' },
    ],
  },
  {
    title: 'Storage',
    items: [
      { to: '/favorites', label: 'Favorites', icon: '★' },
      { to: '/recent', label: 'Recently viewed', icon: '◷' },
      { to: '/achievements', label: 'Achievements', icon: '✦' },
      { to: '/profile', label: 'Profile', icon: '⚙' },
    ],
  },
  {
    title: 'System',
    items: [{ to: '/about', label: 'About', icon: '◉' }],
  },
];

const flatNav = navGroups.flatMap((group) => group.items);

function resolveModuleLabel(pathname) {
  if (pathname === '/') return 'Home Terminal';
  if (pathname.startsWith('/pokemon/sightings')) return 'Sightings';
  if (pathname.startsWith('/pokemon/')) return 'Dex Record';
  // Longest matching prefix wins (so /battle/history beats /battle).
  const match = [...flatNav]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  return match ? match.label : 'Module';
}

export function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { preferences, setPreference } = useProfile();
  const location = useLocation();
  const theme = preferences.theme;
  const moduleLabel = resolveModuleLabel(location.pathname);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll + allow Escape to close while the drawer is open.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <BootSequence />
      <div className="pokedex-device">
        <div className="pokedex-device__lights">
          <div className="pokedex-device__main-light" aria-hidden="true" />
          <div className="pokedex-device__status-lights" aria-hidden="true">
            <span className="light-red" />
            <span className="light-yellow" />
            <span className="light-green" />
          </div>
          <div className="pokedex-device__readout">
            <span className="pokedex-device__module-tag">MODULE</span>
            <span className="pokedex-device__module-name">{moduleLabel}</span>
          </div>
          <div className="pokedex-device__system-label">SYSTEM ONLINE</div>
        </div>

        <div className="app-shell">
          <a className="skip-link" href="#main-content">Skip to content</a>
          <header className="topbar">
            <div className="topbar__lead">
              <button
                className="menu-button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
              </button>
              <NavLink className="brand" to="/" aria-label="Pokédex Atlas home">
                <span className="brand__orb" aria-hidden="true" />
                <span>Pokédex <b>Atlas</b></span>
              </NavLink>
            </div>
            <nav className="topnav" aria-label="Primary navigation">
              {navGroups[0].items.concat(navGroups[1].items[0]).map((item) => (
                <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
              ))}
            </nav>
            <div className="topbar__tools">
              <button
                className="icon-button"
                onClick={() => setPreference('theme', theme === 'dark' ? 'light' : 'dark')}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☼' : '☾'}
              </button>
            </div>
          </header>

          <div
            className={`sidebar__backdrop ${menuOpen ? 'sidebar__backdrop--show' : ''}`}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`} id="mobile-nav">
            <nav aria-label="Application navigation">
              {navGroups.map((group) => (
                <div key={group.title} className="sidebar__group">
                  <p className="sidebar__group-title">{group.title}</p>
                  {group.items.map((item) => (
                    <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                      <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
                      <span className="sidebar__label">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
          </aside>

          <main id="main-content" className="app-main">
            <div className="pokedex-screen">
              {children}
            </div>
          </main>

          <footer className="app-footer">
            <span>Built for discovery, strategy, and a little joy.</span>
            <span>Data: PokéAPI · Sightings: local dataset</span>
          </footer>
        </div>
      </div>
    </>
  );
}
