import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { BootSequence } from '../ui/BootSequence';
import { CommandPalette } from './CommandPalette';
import { navGroups, dockItems, resolveModuleLabel } from './navConfig';

export function AppShell({ children }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { preferences, setPreference } = useProfile();
  const location = useLocation();
  const theme = preferences.theme;
  const moduleLabel = resolveModuleLabel(location.pathname);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Close the palette on navigation.
  useEffect(() => {
    setPaletteOpen(false);
  }, [location.pathname]);

  // Global ⌘K / Ctrl+K to summon the command palette.
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <BootSequence />
      <div className="pokedex-device">
        <div className="pokedex-device__lights">
          <NavLink to="/" end className="pokedex-device__main-light" aria-label="Go to Home" />
          <div className="pokedex-device__status-lights">
            <NavLink to="/pokedex" className="device-light light-red" aria-label="Go to Pokédex" />
            <NavLink to="/battle" className="device-light light-yellow" aria-label="Go to Battle" />
            <NavLink to="/map" className="device-light light-green" aria-label="Go to Sightings Map" />
          </div>
          <div className="pokedex-device__readout">
            <span className="pokedex-device__module-tag">MODULE</span>
            <span className="pokedex-device__module-name">{moduleLabel}</span>
          </div>
          <div className="pokedex-device__system-label">SYSTEM ONLINE</div>
        </div>

        <div className="app-shell">
          <a className="skip-link" href="#main-content">Skip to content</a>

          {/* Desktop module rail — icon activity bar with hover tooltips. */}
          <nav className="rail" aria-label="Primary navigation">
            {navGroups.map((group, groupIndex) => (
              <div className="rail__group" key={group.title}>
                {groupIndex > 0 && <span className="rail__sep" aria-hidden="true" />}
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className="rail__item"
                    aria-label={item.label}
                  >
                    <span className="rail__icon" aria-hidden="true">{item.icon}</span>
                    <span className="rail__tip" role="tooltip">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <header className="topbar">
            <NavLink className="brand" to="/" aria-label="Pokédex Atlas home">
              <span className="brand__orb" aria-hidden="true" />
              <span>Pokédex <b>Atlas</b></span>
            </NavLink>
            <div className="topbar__tools">
              <button
                className="cmdk-trigger"
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette"
                aria-keyshortcuts="Control+K Meta+K"
              >
                <span className="cmdk-trigger__icon" aria-hidden="true">⌕</span>
                <span className="cmdk-trigger__text">Search modules</span>
                <kbd className="cmdk-trigger__kbd">⌘K</kbd>
              </button>
              <button
                className="icon-button"
                onClick={() => setPreference('theme', theme === 'dark' ? 'light' : 'dark')}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☼' : '☾'}
              </button>
            </div>
          </header>

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

        {/* Mobile bottom dock — thumb-friendly primary destinations. */}
        <nav className="bottom-dock" aria-label="Quick navigation">
          {dockItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="bottom-dock__item"
              aria-label={item.label}
            >
              <span className="bottom-dock__icon" aria-hidden="true">{item.icon}</span>
              <span className="bottom-dock__label">{item.label}</span>
            </NavLink>
          ))}
          <button
            className="bottom-dock__item bottom-dock__more"
            onClick={() => setPaletteOpen(true)}
            aria-label="More modules"
          >
            <span className="bottom-dock__icon" aria-hidden="true">⋯</span>
            <span className="bottom-dock__label">More</span>
          </button>
        </nav>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
