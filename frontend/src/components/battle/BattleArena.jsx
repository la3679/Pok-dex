import { HealthBar } from './HealthBar';
import { TypeBadge } from '../ui/TypeBadge';

export function BattleArena({ battle }) {
  const user = battle.userTeam[battle.userActive];
  const cpu = battle.cpuTeam[battle.cpuActive];
  return <section className="battle-arena"><div className="battle-arena__opponent"><HealthBar combatant={cpu} align="right" /><div className="battle-creature battle-creature--cpu">{cpu.imageUrl ? <img src={cpu.imageUrl} alt={cpu.name} /> : <span>?</span>}<div>{cpu.types.map((type) => <TypeBadge key={type} type={type} compact />)}</div></div></div><div className="battle-arena__player"><div className="battle-creature">{user.imageUrl ? <img src={user.imageUrl} alt={user.name} /> : <span>?</span>}<div>{user.types.map((type) => <TypeBadge key={type} type={type} compact />)}</div></div><HealthBar combatant={user} /></div></section>;
}
