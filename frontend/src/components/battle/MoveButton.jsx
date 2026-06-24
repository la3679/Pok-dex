import { TypeBadge } from '../ui/TypeBadge';

export function MoveButton({ move, onClick, disabled }) {
  return <button className="move-button" onClick={onClick} disabled={disabled}><span>{move.name?.replace(/-/g, ' ')}</span><TypeBadge type={move.type} compact /><small>{move.power || 40} power · {move.accuracy ?? 100}% acc.</small></button>;
}
