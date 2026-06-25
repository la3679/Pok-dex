import { describe, expect, it } from 'vitest';
import { effectiveness, teamAnalysis, typeMap } from './strategy';

const types = [
  { api_name: 'fire', damage_relations: { double_damage_to: ['grass'], half_damage_to: ['water'], no_damage_to: [] } },
  { api_name: 'water', damage_relations: { double_damage_to: ['fire'], half_damage_to: ['grass'], no_damage_to: [] } },
  { api_name: 'grass', damage_relations: { double_damage_to: ['water'], half_damage_to: ['fire'], no_damage_to: [] } },
];

describe('strategy utilities', () => {
  it('calculates multipliers from the imported type chart', () => {
    const records = typeMap(types);
    expect(effectiveness('fire', ['grass'], records)).toBe(2);
    expect(effectiveness('fire', ['water'], records)).toBe(0.5);
  });

  it('summarizes team coverage and average stats', () => {
    const analysis = teamAnalysis([
      { _id: '4', pokemon: { pokemonId: '4', name: 'Charmander', primary_type: 'fire', hp: 39, attack: 52, defense: 43, speed: 65 } },
      { _id: '7', pokemon: { pokemonId: '7', name: 'Squirtle', primary_type: 'water', hp: 44, attack: 48, defense: 65, speed: 43 } },
    ], types);
    expect(analysis.coverage).toEqual(['fire', 'water']);
    expect(analysis.averages.attack).toBe(50);
    expect(analysis.defense.find((entry) => entry.attacking === 'grass').weak).toBe(1);
  });
});
