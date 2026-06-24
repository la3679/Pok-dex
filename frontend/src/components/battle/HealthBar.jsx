export function HealthBar({ combatant, align = 'left' }) {
  const percent = Math.max(0, Math.round((combatant.hp / combatant.maxHp) * 100));
  return <div className={`battle-health battle-health--${align}`}><div><strong>{combatant.name}</strong><span>{combatant.status && <em className={`status status--${combatant.status}`}>{combatant.status.slice(0, 3).toUpperCase()}</em>}<small>Lv. 50</small></span></div><div className="battle-health__track"><i className={percent <= 20 ? 'is-critical' : percent <= 50 ? 'is-low' : ''} style={{ width: `${percent}%` }} /></div><small>{Math.ceil(combatant.hp)} / {combatant.maxHp} HP</small></div>;
}
