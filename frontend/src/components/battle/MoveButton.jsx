import { motion } from 'framer-motion';
import { TYPE_COLORS } from '../ui/TypeBadge';

export function MoveButton({ move, onClick, disabled }) {
  const typeColor = TYPE_COLORS[move.type?.toLowerCase()] || TYPE_COLORS.unknown;
  
  return (
    <motion.button 
      className="move-button" 
      onClick={onClick} 
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02, backgroundColor: "var(--surface-2)" } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      style={{ '--move-color': typeColor }}
    >
      <div className="move-button__header">
        <span className="move-button__name">{move.name?.replace(/-/g, ' ')}</span>
        <span className="move-button__type" style={{ color: typeColor }}>{move.type}</span>
      </div>
      <div className="move-button__stats">
        <small>PWR <strong>{move.power || 40}</strong></small>
        <small>ACC <strong>{move.accuracy ?? 100}%</strong></small>
      </div>
      <div className="move-button__bg" style={{ backgroundColor: typeColor }} />
    </motion.button>
  );
}
