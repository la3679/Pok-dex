import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AboutPage from './AboutPage';

describe('AboutPage', () => {
  it('renders the About page with its mission and stack', () => {
    render(<AboutPage />);
    
    // Header text
    expect(screen.getByText('About Pokédex Atlas')).toBeDefined();
    expect(screen.getByText('Project Information')).toBeDefined();
    
    // Content sections
    expect(screen.getByText('The Mission')).toBeDefined();
    expect(screen.getByText('Tech Stack')).toBeDefined();
    expect(screen.getByText('Key Features')).toBeDefined();

    // Specific text checking
    expect(screen.getByText(/React 18, Vite, React Router, TanStack Query, Framer Motion/)).toBeDefined();
    expect(screen.getByText(/Developed as a portfolio showcase/)).toBeDefined();
  });
});
