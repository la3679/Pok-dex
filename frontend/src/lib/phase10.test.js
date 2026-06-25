import { describe, expect, it } from 'vitest';
import { achievementSummary } from './achievements';
import { comparisonCsv } from './exports';
import { predictWinner } from './phase10';

const profile = {
  favorites: [{}], recentlyViewed: Array.from({ length: 10 }, () => ({})), savedTeams: [{}], battles: { wins: 1 },
  activity: { comparedPokemonIds: ['1', '2', '3', '4', '5'], legendaryPokemonIds: ['150'], mapVisits: 1 },
};

const entry = (id, name, type, stats) => ({ _id: String(id), pokemon: { pokemonId: String(id), name, primary_type: type, ...stats } });

describe('phase 10 local features', () => {
  it('unlocks achievement milestones from local profile activity', () => {
    const summary = achievementSummary(profile);
    expect(summary.unlocked).toBe(summary.total);
  });

  it('builds an exportable comparison CSV', () => {
    const csv = comparisonCsv([{ name: 'Pikachu', types: ['electric'], stats: { hp: 35, attack: 55 } }, { name: 'Raichu', types: ['electric'], stats: { hp: 60, attack: 90 } }]);
    expect(csv).toContain('"Metric","Pikachu","Raichu"');
    expect(csv).toContain('"Attack","55","90"');
  });

  it('explains an advantage in the Who Would Win estimate', () => {
    const fire = entry(1, 'Fire', 'fire', { hp: 70, attack: 100, defense: 70, speed: 90, special_attack: 100, special_defense: 70 });
    const grass = entry(2, 'Grass', 'grass', { hp: 70, attack: 85, defense: 75, speed: 65, special_attack: 85, special_defense: 75 });
    const records = { fire: { damage_relations: { double_damage_to: ['grass'], half_damage_to: [], no_damage_to: [] } }, grass: { damage_relations: { double_damage_to: [], half_damage_to: [], no_damage_to: [] } } };
    const result = predictWinner(fire, grass, records);
    expect(result.winner._id).toBe('1');
    expect(result.firstMultiplier).toBe(2);
    expect(result.confidence).toBeGreaterThanOrEqual(50);
  });
});
