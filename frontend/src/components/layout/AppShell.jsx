import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';

const navItems = [
  { to: '/pokedex', label: 'Pokédex', icon: '◈' },
  { to: '/map', label: 'Sightings', icon: '⌖' },
  { to: '/battle', label: 'Battle', icon: '⚔' },
  { to: '/analytics', label: 'Analytics', icon: '◌' },
];

export function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('pokedex-theme') || 'dark');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('pokedex-theme', theme); }, [theme]);
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="topbar">
      <NavLink className="brand" to="/" aria-label="Pokédex Atlas home"><span className="brand__orb" aria-hidden="true" /><span>Pokédex <b>Atlas</b></span></NavLink>
      <nav className="topnav" aria-label="Primary navigation">{navItems.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}</nav>
      <div className="topbar__tools"><button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? '☼' : '☾'}</button><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-nav">☰<span className="sr-only">Menu</span></button></div>
    </header>
    <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`} id="mobile-nav"><nav aria-label="Application navigation">{navItems.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}><span aria-hidden="true">{item.icon}</span>{item.label}</NavLink>)}<span className="sidebar__rule" /><NavLink to="/favorites" onClick={() => setMenuOpen(false)}>Favorites <small>Soon</small></NavLink><NavLink to="/team-builder" onClick={() => setMenuOpen(false)}>Team Builder <small>Soon</small></NavLink><NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink></nav></aside>
    <main id="main-content" className="app-main">{children}</main>
    <footer className="app-footer"><span>Built for discovery, strategy, and a little joy.</span><span>Data: PokéAPI · Sightings: local dataset</span></footer>
  </div>;
}
