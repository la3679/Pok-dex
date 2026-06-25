export function PokeballLoader({ label = 'Loading Pokédex data…' }) {
  return (
    <div className="state-loader" role="status">
      <div className="pokeball-loader-wrapper">
        <span className="pokeball-loader" aria-hidden="true" />
        <span className="scanner-ring" aria-hidden="true" />
      </div>
      <div className="state-loader__text">
        <span>{label}</span>
        <small>SYSTEM OPERATION IN PROGRESS</small>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <span />
      <i />
      <b />
      <em />
    </div>
  );
}

export function ErrorBanner({ title = 'System Error', message, onRetry }) {
  return (
    <div className="error-banner" role="alert">
      <div className="error-banner__icon">⚠</div>
      <div className="error-banner__content">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button className="button button--quiet" onClick={onRetry}>
          Rerun diagnostics
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <section className="empty-state">
      <div className="empty-state__orb" aria-hidden="true" />
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </section>
  );
}
