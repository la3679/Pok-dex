export const BATTLE_TYPES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];

export function typeMap(records = []) { return Object.fromEntries(records.map((record) => [record.api_name, record])); }

export function effectiveness(attacking, defendingTypes, records) {
  const relations = records[attacking]?.damage_relations || {};
  return defendingTypes.filter(Boolean).reduce((multiplier, defending) => {
    if (relations.no_damage_to?.includes(defending)) return 0;
    if (relations.double_damage_to?.includes(defending)) return multiplier * 2;
    if (relations.half_damage_to?.includes(defending)) return multiplier * 0.5;
    return multiplier;
  }, 1);
}

export function toCard(member) {
  if (member.pokemon) return member;
  return { _id: member.id, image_url: member.imageUrl, pokemon: { pokemonId: member.id, name: member.name, primary_type: member.types?.[0], secondary_type: member.types?.[1], ...member.stats, height: member.height, weight: member.weight, capture_rate: member.capture_rate } };
}

export function teamAnalysis(team, records) {
  const lookup = typeMap(records);
  const entries = team.map(toCard);
  const coverage = [...new Set(entries.flatMap((entry) => [entry.pokemon.primary_type, entry.pokemon.secondary_type]).filter(Boolean))];
  const defense = BATTLE_TYPES.map((attacking) => {
    const multipliers = entries.map((entry) => effectiveness(attacking, [entry.pokemon.primary_type, entry.pokemon.secondary_type], lookup));
    return { attacking, weak: multipliers.filter((value) => value > 1).length, resist: multipliers.filter((value) => value > 0 && value < 1).length, immune: multipliers.filter((value) => value === 0).length };
  });
  const averages = ['hp', 'attack', 'defense', 'speed'].reduce((result, stat) => ({ ...result, [stat]: entries.length ? Math.round(entries.reduce((sum, entry) => sum + (entry.pokemon[stat] || 0), 0) / entries.length) : 0 }), {});
  return { coverage, defense, averages, highestWeaknesses: defense.filter((entry) => entry.weak > 0).sort((a, b) => b.weak - a.weak).slice(0, 3) };
}

export function strategyAdvice(mode, analysis, preferredType) {
  if (!analysis.coverage.length) return ['Add Pokémon to begin your team analysis.'];
  const advice = [];
  if (mode === 'offensive') advice.push(`Your average Attack is ${analysis.averages.attack}; add a high-Attack attacker if you want more pressure.`);
  if (mode === 'defensive') advice.push(`Your average Defense is ${analysis.averages.defense}; favor bulk and resistances to stabilize the team.`);
  if (mode === 'fast') advice.push(`Your average Speed is ${analysis.averages.speed}; prioritize a faster Pokémon to improve tempo.`);
  if (mode === 'balanced') advice.push(`You currently cover ${analysis.coverage.length} attacking types. Aim for different roles rather than duplicate typing.`);
  if (preferredType) advice.push(`Candidate search is biased toward ${preferredType}-type Pokémon.`);
  const biggest = analysis.highestWeaknesses[0];
  if (biggest) advice.push(`${biggest.attacking} attacks threaten ${biggest.weak} team member${biggest.weak === 1 ? '' : 's'}; look for a resistance or immunity.`);
  return advice;
}
