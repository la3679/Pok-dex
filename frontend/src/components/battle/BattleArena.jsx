import { motion, AnimatePresence } from 'framer-motion';
import { HealthBar } from './HealthBar';
import { TypeBadge } from '../ui/TypeBadge';

export function BattleArena({ battle }) {
  const user = battle.userTeam[battle.userActive];
  const cpu = battle.cpuTeam[battle.cpuActive];
  
  // Track most recent log line involving damage
  const recent = [...battle.log].reverse().find((line) => line.includes(' damage')) || '';
  const damage = recent.match(/for (\d+) damage/)?.[1];
  const userAttacked = recent.startsWith(user.name);
  const critical = battle.log.slice(-4).some(line => line.includes('A critical hit!'));

  // Animation variants
  const playerAnim = {
    idle: { y: [0, -5, 0], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
    attack: { x: [0, 50, -10, 0], scale: [1, 1.1, 1], transition: { duration: 0.5 } },
    hit: { x: [0, -15, 15, -10, 10, 0], filter: ["brightness(1)", "brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)", "brightness(1)"], transition: { duration: 0.4 } },
    faint: { y: 100, opacity: 0, filter: "grayscale(100%)", transition: { duration: 0.8 } }
  };

  const cpuAnim = {
    idle: { y: [0, 5, 0], transition: { repeat: Infinity, duration: 3.5, ease: "easeInOut" } },
    attack: { x: [0, -50, 10, 0], scale: [1, 1.1, 1], transition: { duration: 0.5 } },
    hit: { x: [0, 15, -15, 10, -10, 0], filter: ["brightness(1)", "brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)", "brightness(1)"], transition: { duration: 0.4 } },
    faint: { y: 100, opacity: 0, filter: "grayscale(100%)", transition: { duration: 0.8 } }
  };

  const damageText = {
    initial: { opacity: 0, y: 0, scale: 0.5 },
    animate: { opacity: [0, 1, 1, 0], y: -40, scale: [0.5, 1.2, 1, 1], transition: { duration: 1.5, times: [0, 0.1, 0.8, 1] } }
  };

  const getPlayerState = () => {
    if (user.hp <= 0) return "faint";
    if (recent && userAttacked) return "attack";
    if (recent && !userAttacked && damage) return "hit";
    return "idle";
  };

  const getCpuState = () => {
    if (cpu.hp <= 0) return "faint";
    if (recent && !userAttacked) return "attack";
    if (recent && userAttacked && damage) return "hit";
    return "idle";
  };

  return (
    <section className={`battle-arena ${critical ? 'battle-arena--critical' : ''}`}>
      <div className="battle-arena__opponent">
        <HealthBar combatant={cpu} align="right" />
        <div className="battle-creature battle-creature--cpu">
          <AnimatePresence>
            {damage && userAttacked && (
              <motion.b 
                className={`damage-number ${critical ? 'damage-number--critical' : ''}`}
                key={`${battle.turn}-${damage}-cpu`}
                variants={damageText}
                initial="initial"
                animate="animate"
              >
                −{damage}
              </motion.b>
            )}
          </AnimatePresence>
          
          <motion.div
            variants={cpuAnim}
            animate={getCpuState()}
            initial="idle"
          >
            {cpu.imageUrl ? (
              <img src={cpu.imageUrl} alt={cpu.name} className={critical ? "critical-hit-flash" : ""} />
            ) : <span>?</span>}
          </motion.div>
          
          <div className="battle-creature__types">
            {cpu.types.map((type) => <TypeBadge key={type} type={type} compact />)}
          </div>
        </div>
      </div>
      
      <div className="battle-arena__player">
        <div className="battle-creature battle-creature--player">
          <AnimatePresence>
            {damage && !userAttacked && (
              <motion.b 
                className={`damage-number ${critical ? 'damage-number--critical' : ''}`}
                key={`${battle.turn}-${damage}-user`}
                variants={damageText}
                initial="initial"
                animate="animate"
              >
                −{damage}
              </motion.b>
            )}
          </AnimatePresence>
          
          <motion.div
            variants={playerAnim}
            animate={getPlayerState()}
            initial="idle"
          >
            {user.imageUrl ? (
              <img src={user.imageUrl} alt={user.name} className={critical ? "critical-hit-flash" : ""} />
            ) : <span>?</span>}
          </motion.div>
          
          <div className="battle-creature__types">
            {user.types.map((type) => <TypeBadge key={type} type={type} compact />)}
          </div>
        </div>
        <HealthBar combatant={user} />
      </div>
    </section>
  );
}
