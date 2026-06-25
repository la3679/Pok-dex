import { effectiveness } from './strategy';

const statKeys = ['hp', 'attack', 'defense', 'speed'];

export function pickDistinct(entries, count, excluded = []) {
  const available = entries.filter((entry) => !excluded.some((item) => item._id === entry._id));
  return [...available].sort(() => Math.random() - 0.5).slice(0, count);
}

export function quizQuestion(mode, entries) {
  const target = pickDistinct(entries, 1)[0];
  if (!target) return null;
  const pokemon = target.pokemon;
  if (mode === 'type') return { mode, prompt: `Which type belongs to ${pokemon.name}?`, target, options: [...new Set([pokemon.primary_type, ...pickDistinct(entries, 8, [target]).map((entry) => entry.pokemon.primary_type)])].slice(0, 4), answer: pokemon.primary_type };
  if (mode === 'higher-stat') {
    const challenger = pickDistinct(entries, 1, [target])[0];
    const stat = statKeys[Math.floor(Math.random() * statKeys.length)];
    const targetValue = Number(pokemon[stat]) || 0;
    const challengerValue = Number(challenger.pokemon[stat]) || 0;
    const winner = targetValue === challengerValue ? (Number(pokemon.speed) >= Number(challenger.pokemon.speed) ? target : challenger) : targetValue > challengerValue ? target : challenger;
    return { mode, prompt: `Which Pokémon has the higher ${stat.replace('_', ' ')}?`, stat, target, challenger, options: [target, challenger].sort(() => Math.random() - 0.5), answer: winner._id };
  }
  const options = [target, ...pickDistinct(entries, 3, [target])].sort(() => Math.random() - 0.5);
  if (mode === 'stats') return { mode, prompt: 'Which Pokémon matches this base-stat signature?', target, options, answer: target._id, stats: statKeys.map((stat) => [stat, pokemon[stat] || 0]) };
  return { mode: 'silhouette', prompt: 'Who is that Pokémon?', target, options, answer: target._id };
}

export function predictWinner(first, second, typeRecords) {
  if (!first || !second) return null;
  const data = (entry) => entry.pokemon || entry;
  const firstData = data(first); const secondData = data(second);
  const typesFor = (pokemon) => [pokemon.primary_type, pokemon.secondary_type].filter(Boolean);
  const firstTypes = typesFor(firstData); const secondTypes = typesFor(secondData);
  const sum = (pokemon) => statKeys.reduce((total, stat) => total + (Number(pokemon[stat]) || 0), 0) + (Number(pokemon.special_attack) || 0) + (Number(pokemon.special_defense) || 0);
  const advantage = (attacking, defending) => Math.max(1, ...attacking.map((type) => effectiveness(type, defending, typeRecords)));
  const firstMultiplier = advantage(firstTypes, secondTypes);
  const secondMultiplier = advantage(secondTypes, firstTypes);
  const firstScore = sum(firstData) + (Number(firstData.speed) || 0) * 0.25 + (firstMultiplier - 1) * 120;
  const secondScore = sum(secondData) + (Number(secondData.speed) || 0) * 0.25 + (secondMultiplier - 1) * 120;
  const difference = Math.abs(firstScore - secondScore);
  const confidence = Math.min(95, Math.max(50, Math.round(50 + (difference / Math.max(firstScore, secondScore, 1)) * 100)));
  const winner = firstScore === secondScore ? null : firstScore > secondScore ? first : second;
  const winningMultiplier = winner === first ? firstMultiplier : secondMultiplier;
  const explanation = winner
    ? `${data(winner).name} projects ahead on combined base stats${winningMultiplier > 1 ? ` with a ${winningMultiplier}× type advantage` : ''}. This is a strategic estimate, not a simulated battle.`
    : 'Their weighted stats and type matchup are level. A real battle would come down to move choices and turn order.';
  return { winner, confidence, firstMultiplier, secondMultiplier, explanation };
}
