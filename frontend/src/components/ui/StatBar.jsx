export function StatBar({ label, value, max = 180 }) {
  const number = Number(value) || 0;
  const percentage = Math.min(100, Math.round((number / max) * 100));
  return (
    <div className="stat-bar">
      <div className="stat-bar__label"><span>{label}</span><strong>{number}</strong></div>
      <div className="stat-bar__track" role="progressbar" aria-label={`${label}: ${number}`} aria-valuenow={number} aria-valuemin="0" aria-valuemax={max}>
        <span className="stat-bar__fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
