import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flatNav, auxNav } from './navConfig';

const destinations = [...flatNav, ...auxNav];

function score(item, query) {
  const haystack = `${item.label} ${item.group} ${item.keywords || ''}`.toLowerCase();
  return haystack.includes(query) ? haystack.indexOf(query) : -1;
}

/**
 * Global ⌘K / Ctrl+K launcher. Renders nothing until opened; fully keyboard
 * driven (arrows + Enter + Escape) with an accessible listbox.
 */
export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations
      .map((item) => ({ item, rank: score(item, q) }))
      .filter((entry) => entry.rank >= 0)
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => entry.item);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // Focus after the element is painted.
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (item) => {
    if (!item) return;
    onClose();
    navigate(item.to);
  };

  const onInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[active]);
    }
  };

  return (
    <div className="cmdk" role="presentation" onClick={onClose}>
      <div
        className="cmdk__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cmdk__search">
          <span className="cmdk__search-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="text"
            className="cmdk__input"
            placeholder="Jump to a module…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-activedescendant={results[active] ? `cmdk-opt-${active}` : undefined}
            aria-label="Search modules"
          />
          <kbd className="cmdk__hint">ESC</kbd>
        </div>
        <ul className="cmdk__list" id="cmdk-list" role="listbox" ref={listRef} aria-label="Modules">
          {results.length === 0 && (
            <li className="cmdk__empty" role="presentation">No modules match “{query}”.</li>
          )}
          {results.map((item, index) => (
            <li key={item.to + item.label} role="presentation">
              <button
                type="button"
                id={`cmdk-opt-${index}`}
                role="option"
                aria-selected={index === active}
                className={`cmdk__option ${index === active ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(item)}
              >
                <span className="cmdk__option-icon" aria-hidden="true">{item.icon}</span>
                <span className="cmdk__option-label">{item.label}</span>
                <span className="cmdk__option-group">{item.group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
