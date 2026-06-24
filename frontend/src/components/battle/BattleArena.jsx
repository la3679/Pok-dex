import { HealthBar } from './HealthBar';
import { TypeBadge } from '../ui/TypeBadge';

export function BattleArena({ battle }) {
  const user = battle.userTeam[battle.userActive];
  const cpu = battle.cpuTeam[battle.cpuActive];
  const recent = [...battle.log].reverse().find((line) => line.includes(' damage')) || '';
  const damage = recent.match(/for (\d+) damage/)?.[1];
  const userAttacked = recent.startsWith(user.name);
  const critical = battle.log.slice(-4).includes('A critical hit!');
  return <section className={`battle-arena ${critical ? 'battle-arena--critical' : ''}`}><div className="battle-arena__opponent"><HealthBar combatant={cpu} align="right" /><div className={`battle-creature battle-creature--cpu ${cpu.hp === 0 ? 'battle-creature--fainted' : ''} ${recent ? userAttacked ? 'battle-creature--struck' : 'battle-creature--attacking' : ''}`}>{damage && userAttacked && <b className="damage-number" key={`${battle.turn}-${damage}`}>−{damage}</b>}{cpu.imageUrl ? <img src={cpu.imageUrl} alt={cpu.name} /> : <span>?</span>}<div>{cpu.types.map((type) => <TypeBadge key={type} type={type} compact />)}</div></div></div><div className="battle-arena__player"><div className={`battle-creature ${user.hp === 0 ? 'battle-creature--fainted' : ''} ${userAttacked ? 'battle-creature--attacking' : recent ? 'battle-creature--struck' : ''}`}>{damage && !userAttacked && <b className="damage-number" key={`${battle.turn}-${damage}`}>−{damage}</b>}{user.imageUrl ? <img src={user.imageUrl} alt={user.name} /> : <span>?</span>}<div>{user.types.map((type) => <TypeBadge key={type} type={type} compact />)}</div></div><HealthBar combatant={user} /></div></section>;
}
