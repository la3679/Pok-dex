export function PokeballLoader({ label = 'Loading Pokédex data…' }) {
  return <div className="state-loader" role="status"><span className="pokeball-loader" aria-hidden="true" /><span>{label}</span></div>;
}

export function SkeletonCard() {
  return <div className="skeleton-card" aria-hidden="true"><span /><i /><b /><em /></div>;
}

export function ErrorBanner({ title = 'Something went wrong', message, onRetry }) {
  return <div className="error-banner" role="alert"><div><strong>{title}</strong><p>{message}</p></div>{onRetry && <button className="button button--quiet" onClick={onRetry}>Try again</button>}</div>;
}

export function EmptyState({ title, children, action }) {
  return <section className="empty-state"><div className="empty-state__orb" aria-hidden="true" /><h2>{title}</h2>{children && <p>{children}</p>}{action}</section>;
}
