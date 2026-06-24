import { describe, expect, it, vi } from 'vitest';
import { beginBattle, prepareCombatant, resolveTurn } from './battle';

const typeRecords = {
  fire: { damage_relations: { double_damage_to: ['grass'], half_damage_to: [], no_damage_to: [] } },
  grass: { damage_relations: { double_damage_to: [], half_damage_to: ['fire'], no_damage_to: [] } },
  normal: { damage_relations: { double_damage_to: [], half_damage_to: [], no_damage_to: [] } },
};

const entry = (id, name, type, stats = {}) => ({ _id: String(id), pokemon: { pokemonId: String(id), name, primary_type: type, hp: 60, attack: 70, defense: 55, speed: 60, ...stats } });

describe('battle engine', () => {
  it('prepares a combatant with a complete move set', () => {
    const combatant = prepareCombatant(entry(1, 'Flare', 'fire'), [{ name: 'ember', type: 'fire', power: 40, accuracy: 100, damage_class: 'special' }]);
    expect(combatant.moves).toHaveLength(4);
    expect(combatant.hp).toBe(combatant.maxHp);
  });

  it('resolves a turn without negative health and detects a winner', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const user = prepareCombatant(entry(1, 'Flare', 'fire', { attack: 200, speed: 100 }), [{ name: 'inferno', type: 'fire', power: 250, accuracy: 100, damage_class: 'physical' }]);
    const cpu = prepareCombatant(entry(2, 'Leaf', 'grass', { hp: 1, defense: 1, speed: 1 }), [{ name: 'tackle', type: 'normal', power: 40, accuracy: 100, damage_class: 'physical' }]);
    const result = resolveTurn(beginBattle([user], [cpu]), { type: 'move', index: 0 }, typeRecords, 'hard');
    expect(result.cpuTeam[0].hp).toBeGreaterThanOrEqual(0);
    expect(result.winner).toBe('User');
    vi.restoreAllMocks();
  });
});
