import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EmptyState, ErrorBanner, PokeballLoader } from './States';
import { PageHeader } from './PageHeader';
import { TypeBadge } from './TypeBadge';

describe('shared UI components', () => {
  it('renders state and header components without a browser DOM', () => {
    const html = renderToStaticMarkup(<><PageHeader eyebrow="Test" title="Dashboard" description="Ready" /><PokeballLoader label="Loading" /><ErrorBanner title="Oops" message="Try again" /><EmptyState title="Nothing here">Empty copy</EmptyState><TypeBadge type="electric" /></>);

    expect(html).toContain('Dashboard');
    expect(html).toContain('Loading');
    expect(html).toContain('Oops');
    expect(html).toContain('Nothing here');
    expect(html).toContain('electric');
  });
});
