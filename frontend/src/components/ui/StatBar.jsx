import { motion } from 'framer-motion';

export function StatBar({ label, value, max = 180 }) {
  const number = Number(value) || 0;
  const percentage = Math.min(100, Math.round((number / max) * 100));
  
  // Color scale based on value
  const getColor = (val) => {
    if (val < 50) return '#ef4444'; // Red
    if (val < 90) return '#eab308'; // Yellow
    if (val < 130) return '#4ade80'; // Green
    return '#38bdf8'; // Blue for very high
  };

  const fillStyle = {
    background: getColor(number),
    boxShadow: `0 0 10px ${getColor(number)}`
  };

  return (
    <div className="stat-bar">
      <div className="stat-bar__label">
        <span className="stat-bar__name">{label}</span>
        <strong className="stat-bar__value">{String(number).padStart(3, '0')}</strong>
      </div>
      <div 
        className="stat-bar__track" 
        role="progressbar" 
        aria-label={`${label}: ${number}`} 
        aria-valuenow={number} 
        aria-valuemin="0" 
        aria-valuemax={max}
      >
        <motion.span 
          className="stat-bar__fill" 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          style={fillStyle} 
        />
      </div>
    </div>
  );
}
