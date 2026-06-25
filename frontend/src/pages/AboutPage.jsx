import { PageHeader } from '../components/ui/PageHeader';

export default function AboutPage() {
  return (
    <section className="about-page">
      <PageHeader 
        title="About Pokédex Atlas" 
        eyebrow="Project Information" 
        description="A portfolio-ready full-stack platform for Pokémon discovery, data exploration, and play." 
      />
      <div style={{
        padding: '2rem',
        border: '1px solid var(--line)',
        borderRadius: '1rem',
        backgroundColor: 'var(--surface)',
        maxWidth: '48rem',
        margin: '0 auto'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>The Mission</h2>
        <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '2rem' }}>
          Pokédex Atlas turns a legacy Pokémon sightings project into a polished portfolio application with a searchable Pokédex, Pokémon detail pages, a sightings map, a team builder, comparison tools, an analytics dashboard, and a classic-inspired battle simulator.
        </p>

        <h2 style={{ marginBottom: '1rem' }}>Tech Stack</h2>
        <ul style={{ color: 'var(--muted)', lineHeight: '1.6', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
          <li><strong>Frontend:</strong> React 18, Vite, React Router, TanStack Query, Framer Motion, CSS custom properties.</li>
          <li><strong>Backend:</strong> Flask, PyMongo, python-dotenv.</li>
          <li><strong>Database:</strong> MongoDB with geospatial indexes.</li>
          <li><strong>Data Sources:</strong> PokéAPI, approved local Pokémon stats data, approved local sightings dataset.</li>
        </ul>

        <h2 style={{ marginBottom: '1rem' }}>Key Features</h2>
        <ul style={{ color: 'var(--muted)', lineHeight: '1.6', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
          <li>Searchable, filterable canonical Pokédex with pagination.</li>
          <li>Deep Pokémon detail pages showing stats, abilities, and evolution chains.</li>
          <li>Classic-inspired battle simulator with type effectiveness and status effects.</li>
          <li>MongoDB-backed analytics dashboard with various insights.</li>
          <li>A repeatable data pipeline for PokéAPI enrichment.</li>
        </ul>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Developed as a portfolio showcase. Data provided by PokéAPI.
        </div>
      </div>
    </section>
  );
}
