import { effectiveness } from './strategy';

const fallbackMoves = {
  normal: ['Tackle', 40], fire: ['Flame Burst', 55], water: ['Water Pulse', 60], electric: ['Thunder Shock', 40], grass: ['Razor Leaf', 55], ice: ['Ice Shard', 40], fighting: ['Karate Chop', 50], poison: ['Sludge', 65], ground: ['Mud Shot', 55], flying: ['Air Cutter', 60], psychic: ['Psybeam', 65], bug: ['Struggle Bug', 50], rock: ['Rock Throw', 50], ghost: ['Shadow Sneak', 40], dragon: ['Dragon Breath', 60], dark: ['Bite', 60], steel: ['Metal Claw', 50], fairy: ['Draining Kiss', 50],
};

const fallbackMove = (type = 'normal') => ({ name: fallbackMoves[type]?.[0] || 'Tackle', type, power: fallbackMoves[type]?.[1] || 40, accuracy: 100, damage_class: 'physical' });

export function prepareCombatant(entry, moves = []) {
  const pokemon = entry.pokemon || entry;
  const types = [pokemon.primary_type, pokemon.secondary_type].filter(Boolean);
  const usable = moves.filter((move) => move.power && move.accuracy !== null).sort((a, b) => (b.power || 0) - (a.power || 0));
  const matching = usable.filter((move) => types.includes(move.type));
  const selected = [...matching, ...usable].reduce((result, move) => result.some((item) => item.name === move.name) || result.length >= 4 ? result : [...result, move], []);
  while (selected.length < 4) selected.push(fallbackMove(types[selected.length % Math.max(1, types.length)]));
  const maxHp = Math.max(60, Math.round((pokemon.hp || 40) * 2 + (pokemon.defense || 40)));
  return { id: String(pokemon.pokemonId || entry._id), name: pokemon.name, imageUrl: entry.image_url, types, stats: { hp: pokemon.hp || 40, attack: pokemon.attack || 40, defense: pokemon.defense || 40, speed: pokemon.speed || 40, special_attack: pokemon.special_attack || pokemon.attack || 40, special_defense: pokemon.special_defense || pokemon.defense || 40 }, maxHp, hp: maxHp, moves: selected, status: null, fainted: false };
}

const livingIndexes = (team) => team.map((member, index) => member.hp > 0 ? index : -1).filter((index) => index >= 0);
const display = (value) => value?.replace(/-/g, ' ') || 'Unknown';
const cloneBattle = (battle) => ({ ...battle, userTeam: battle.userTeam.map((member) => ({ ...member, moves: [...member.moves] })), cpuTeam: battle.cpuTeam.map((member) => ({ ...member, moves: [...member.moves] })) });

function damageFor(attacker, defender, move, records) {
  const special = move.damage_class === 'special';
  const attack = special ? attacker.stats.special_attack : attacker.stats.attack;
  const defense = special ? defender.stats.special_defense : defender.stats.defense;
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const multiplier = effectiveness(move.type, defender.types, records);
  const critical = Math.random() < 1 / 16;
  const random = 0.85 + Math.random() * 0.15;
  const raw = (((22 * (move.power || 40) * attack / Math.max(1, defense)) / 50) + 2) * stab * multiplier * (critical ? 1.5 : 1) * random;
  return { amount: multiplier === 0 ? 0 : Math.max(1, Math.floor(raw)), multiplier, critical };
}

function statusFor(move) {
  const chance = move.type === 'poison' ? 0.2 : move.type === 'fire' ? 0.1 : move.type === 'electric' ? 0.15 : 0;
  if (!chance || Math.random() > chance) return null;
  return move.type === 'poison' ? 'poison' : move.type === 'fire' ? 'burn' : 'paralysis';
}

function applyMove(battle, side, moveIndex, records, logs) {
  const attackerTeam = side === 'user' ? battle.userTeam : battle.cpuTeam;
  const defenderTeam = side === 'user' ? battle.cpuTeam : battle.userTeam;
  const attacker = attackerTeam[side === 'user' ? battle.userActive : battle.cpuActive];
  const defenderIndex = side === 'user' ? battle.cpuActive : battle.userActive;
  const defender = defenderTeam[defenderIndex];
  const move = attacker.moves[moveIndex] || attacker.moves[0];
  if (attacker.status === 'paralysis' && Math.random() < 0.25) { logs.push(`${attacker.name} is paralyzed and cannot move!`); return; }
  if (Math.random() * 100 > (move.accuracy ?? 100)) { logs.push(`${attacker.name}'s ${display(move.name)} missed!`); return; }
  const outcome = damageFor(attacker, defender, move, records);
  if (outcome.multiplier === 0) { logs.push(`${attacker.name}'s ${display(move.name)} has no effect on ${defender.name}.`); return; }
  defender.hp = Math.max(0, defender.hp - outcome.amount);
  logs.push(`${attacker.name} used ${display(move.name)} for ${outcome.amount} damage.`);
  if (outcome.critical) logs.push('A critical hit!');
  if (outcome.multiplier > 1) logs.push('It is super effective!');
  if (outcome.multiplier < 1) logs.push('It is not very effective…');
  if (!defender.status && defender.hp > 0) { const status = statusFor(move); if (status) { defender.status = status; logs.push(`${defender.name} is ${status === 'burn' ? 'burned' : status === 'poison' ? 'poisoned' : 'paralyzed'}!`); } }
  if (defender.hp === 0) { defender.fainted = true; logs.push(`${defender.name} fainted!`); }
}

function switchTo(battle, side, nextIndex, logs) {
  const team = side === 'user' ? battle.userTeam : battle.cpuTeam;
  const currentKey = side === 'user' ? 'userActive' : 'cpuActive';
  if (team[nextIndex]?.hp <= 0 || battle[currentKey] === nextIndex) return false;
  battle[currentKey] = nextIndex;
  logs.push(`${side === 'user' ? 'Go' : 'CPU sent out'} ${team[nextIndex].name}!`);
  return true;
}

function ensureActive(battle, side, logs) {
  const team = side === 'user' ? battle.userTeam : battle.cpuTeam;
  const activeKey = side === 'user' ? 'userActive' : 'cpuActive';
  if (team[battle[activeKey]]?.hp > 0) return true;
  const next = livingIndexes(team)[0];
  if (next === undefined) return false;
  battle[activeKey] = next;
  logs.push(`${side === 'user' ? 'Go' : 'CPU sent out'} ${team[next].name}!`);
  return true;
}

function residual(member, logs) {
  if (!member.status || member.hp <= 0) return;
  if (member.status === 'poison' || member.status === 'burn') {
    const amount = Math.max(1, Math.floor(member.maxHp / (member.status === 'poison' ? 8 : 16)));
    member.hp = Math.max(0, member.hp - amount);
    logs.push(`${member.name} is hurt by ${member.status} (${amount}).`);
    if (member.hp === 0) { member.fainted = true; logs.push(`${member.name} fainted!`); }
  }
}

export function cpuDecision(battle, records, difficulty) {
  const cpu = battle.cpuTeam[battle.cpuActive];
  const user = battle.userTeam[battle.userActive];
  const choices = cpu.moves.map((move, index) => ({ index, score: (move.power || 40) * effectiveness(move.type, user.types, records) * (move.accuracy || 100) / 100 }));
  if (difficulty === 'easy') return { type: 'move', index: Math.floor(Math.random() * choices.length) };
  if (difficulty === 'expert') {
    const incoming = Math.max(...user.moves.map((move) => effectiveness(move.type, cpu.types, records)));
    const replacement = livingIndexes(battle.cpuTeam).find((index) => index !== battle.cpuActive && Math.max(...user.moves.map((move) => effectiveness(move.type, battle.cpuTeam[index].types, records))) < incoming);
    if (incoming > 1 && replacement !== undefined) return { type: 'switch', index: replacement };
  }
  choices.sort((a, b) => b.score - a.score);
  return { type: 'move', index: difficulty === 'normal' && choices.length > 1 && Math.random() < 0.35 ? choices[1].index : choices[0].index };
}

export function beginBattle(userTeam, cpuTeam) { return { userTeam, cpuTeam, userActive: 0, cpuActive: 0, turn: 1, log: ['The battle begins!'], winner: null }; }

export function resolveTurn(current, userAction, records, difficulty) {
  const battle = cloneBattle(current);
  const logs = [];
  if (battle.winner) return battle;
  const cpuAction = cpuDecision(battle, records, difficulty);
  const actions = [{ side: 'user', ...userAction }, { side: 'cpu', ...cpuAction }].map((action) => ({ ...action, actorId: battle[action.side === 'user' ? 'userTeam' : 'cpuTeam'][action.side === 'user' ? battle.userActive : battle.cpuActive].id })).sort((a, b) => {
    if (a.type === 'switch' && b.type !== 'switch') return -1;
    if (b.type === 'switch' && a.type !== 'switch') return 1;
    const aSpeed = battle[a.side === 'user' ? 'userTeam' : 'cpuTeam'][a.side === 'user' ? battle.userActive : battle.cpuActive].stats.speed;
    const bSpeed = battle[b.side === 'user' ? 'userTeam' : 'cpuTeam'][b.side === 'user' ? battle.userActive : battle.cpuActive].stats.speed;
    return bSpeed - aSpeed || (Math.random() < 0.5 ? -1 : 1);
  });
  for (const action of actions) {
    const opponent = action.side === 'user' ? 'cpu' : 'user';
    if (!ensureActive(battle, action.side, logs) || !ensureActive(battle, opponent, logs)) break;
    const currentActor = battle[action.side === 'user' ? 'userTeam' : 'cpuTeam'][action.side === 'user' ? battle.userActive : battle.cpuActive];
    if (currentActor.id !== action.actorId) continue;
    if (action.type === 'switch') switchTo(battle, action.side, action.index, logs); else applyMove(battle, action.side, action.index, records, logs);
    if (!ensureActive(battle, opponent, logs)) break;
  }
  const userAlive = ensureActive(battle, 'user', logs);
  const cpuAlive = ensureActive(battle, 'cpu', logs);
  if (userAlive && cpuAlive) {
    residual(battle.userTeam[battle.userActive], logs);
    residual(battle.cpuTeam[battle.cpuActive], logs);
  }
  const finalUserAlive = ensureActive(battle, 'user', logs);
  const finalCpuAlive = ensureActive(battle, 'cpu', logs);
  if (!finalUserAlive || !finalCpuAlive) { battle.winner = finalUserAlive ? 'User' : finalCpuAlive ? 'CPU' : 'Draw'; logs.push(battle.winner === 'Draw' ? 'The battle ends in a draw.' : `${battle.winner} wins the battle!`); }
  battle.turn += 1;
  battle.log = [...battle.log, ...logs];
  return battle;
}
