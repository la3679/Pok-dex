import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { BootSequence } from '../ui/BootSequence';

const navItems = [
  { to: '/pokedex', label: 'Pokédex', icon: '◈' },
  { to: '/map', label: 'Sightings', icon: '⌖' },
  { to: '/battle', label: 'Battle', icon: '⚔' },
  { to: '/analytics', label: 'Analytics', icon: '◌' },
];

export function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { preferences, setPreference } = useProfile();
  const theme = preferences.theme;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <>
      <BootSequence />
      <div className="pokedex-device">
        <div className="pokedex-device__lights">
          <div className="pokedex-device__main-light" aria-hidden="true" />
          <div className="pokedex-device__status-lights">
            <span className="light-red" />
            <span className="light-yellow" />
            <span className="light-green" />
          </div>
          <div className="pokedex-device__system-label">SYSTEM ONLINE</div>
        </div>
        
        <div className="app-shell">
          <a className="skip-link" href="#main-content">Skip to content</a>
          <header className="topbar">
            <NavLink className="brand" to="/" aria-label="Pokédex Atlas home">
              <span className="brand__orb" aria-hidden="true" />
              <span>Pokédex <b>Atlas</b></span>
            </NavLink>
            <nav className="topnav" aria-label="Primary navigation">
              {navItems.map((item) => (
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
              <button 
                className="menu-button" 
                onClick={() => setMenuOpen(!menuOpen)} 
                aria-expanded={menuOpen} 
                aria-controls="mobile-nav"
              >
                ☰<span className="sr-only">Menu</span>
              </button>
            </div>
          </header>
          
          <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`} id="mobile-nav">
            <nav aria-label="Application navigation">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                  <span aria-hidden="true">{item.icon}</span>{item.label}
                </NavLink>
              ))}
              <span className="sidebar__rule" />
              <NavLink to="/favorites" onClick={() => setMenuOpen(false)}>Favorites</NavLink>
              <NavLink to="/recent" onClick={() => setMenuOpen(false)}>Recently viewed</NavLink>
              <NavLink to="/profile" onClick={() => setMenuOpen(false)}>Local profile</NavLink>
              <NavLink to="/achievements" onClick={() => setMenuOpen(false)}>Achievements</NavLink>
              <NavLink to="/quiz" onClick={() => setMenuOpen(false)}>Quiz</NavLink>
              <NavLink to="/who-would-win" onClick={() => setMenuOpen(false)}>Who Would Win?</NavLink>
              <NavLink to="/compare" onClick={() => setMenuOpen(false)}>Compare</NavLink>
              <NavLink to="/type-chart" onClick={() => setMenuOpen(false)}>Type chart</NavLink>
              <NavLink to="/team-builder" onClick={() => setMenuOpen(false)}>Team Builder</NavLink>
              <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
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
