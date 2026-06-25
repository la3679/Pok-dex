import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';
import { ProfileProvider } from '../../context/ProfileContext';

function renderShell() {
  return render(
    <ProfileProvider>
      <MemoryRouter initialEntries={['/pokedex']}>
        <AppShell>
          <h1>Screen content</h1>
        </AppShell>
      </MemoryRouter>
    </ProfileProvider>,
  );
}

describe('AppShell navigation', () => {
  beforeEach(() => {
    // Skip the boot overlay so the shell mounts directly.
    window.sessionStorage.setItem('pokedexBooted', 'true');
  });

  it('renders the module rail with primary destinations and marks the active route', () => {
    renderShell();
    const rail = screen.getByRole('navigation', { name: /primary navigation/i });
    expect(within(rail).getByLabelText('Pokédex')).toBeDefined();
    expect(within(rail).getByLabelText('Battle')).toBeDefined();
    // The active link reflects the current route.
    expect(within(rail).getByLabelText('Pokédex').classList.contains('active')).toBe(true);
  });

  it('opens the command palette and filters destinations', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: /open command palette/i }));
    const dialog = screen.getByRole('dialog', { name: /command palette/i });
    expect(within(dialog).getByRole('option', { name: /Team Builder/i })).toBeDefined();

    await user.type(within(dialog).getByRole('combobox'), 'predictor');
    const options = within(dialog).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toMatch(/Battle Predictor/i);
  });
});
