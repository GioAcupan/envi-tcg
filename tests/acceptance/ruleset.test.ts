import { describe, expect, it } from 'vitest';
import { newGame } from '../../src/engine';
import { defaultRuleset, exportRuleset, importRuleset } from '../../src/ruleset';

describe('D5 — ruleset sharing', () => {
  it('round-trips a ruleset without changing it', () => {
    const ruleset = defaultRuleset();
    expect(importRuleset(exportRuleset(ruleset))).toEqual({ ok: true, ruleset });
  });

  it('fills a missing param with its default', () => {
    const ruleset = defaultRuleset();
    const { drawPerRound: omitted, ...params } = ruleset.params;
    expect(omitted).toBe(1);
    const result = importRuleset(JSON.stringify({ ...ruleset, params }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.ruleset).toEqual(ruleset);
  });

  it('rejects invalid JSON', () => {
    expect(importRuleset('{not json')).toMatchObject({ ok: false, error: expect.any(String) });
  });
});

describe('D5 defaults', () => {
  it('contains every Appendix B id and the exact numbers for five representative cards', () => {
    const ruleset = defaultRuleset();
    expect(ruleset.cards.map(card => card.id).sort()).toEqual([
      'leaf-litter-plant', 'river-grass', 'aquatic-plant', 'riparian-tree', 'fast-growing-plant', 'green-algae', 'diatom', 'bloom-algae',
      'caterpillar', 'zooplankton', 'snail', 'grasshopper', 'small-fish', 'frog', 'predatory-insect', 'large-fish', 'water-snake', 'heron',
      'freshwater-shrimp', 'aquatic-worm', 'tubifex-worm', 'chironomid-larva', 'freshwater-snail', 'aquatic-grazer',
      'decomposer-fungus', 'nitrogen-bacteria', 'phosphorus-bacteria', 'super-decomposer', 'nutrient-rich-adaptation',
      'oxygen-rich-adaptation', 'p-accumulator-adaptation', 'consumer-specialization', 'protected-adaptation',
      'strong-rainfall', 'drought', 'heat-wave', 'flood', 'fallen-leaf',
    ].sort());
    for (const [id, expected] of [
      ['river-grass', { kind: 'producer', subtype: 'plant', trophicLevel: 1, cost: { C: 2, N: 1 }, o2Produced: 2, lifespan: 4, copies: 1 }],
      ['heron', { kind: 'consumer', subtype: 'tertiary', trophicLevel: 4, cost: { C: 5, N: 3 }, o2PerRound: 2, lifespan: 5, copies: 1 }],
      ['aquatic-worm', { kind: 'detritivore', subtype: 'shredder', cost: { C: 1, N: 1 }, o2PerRound: 1, lifespan: 3, copies: 1 }],
      ['nitrogen-bacteria', { kind: 'microbe', subtype: 'bacteria', cost: { C: 0, N: 0 }, copies: 2 }],
      ['nutrient-rich-adaptation', { kind: 'adaptation', cost: { C: 2, N: 1 }, copies: 1 }],
    ] as const) expect(ruleset.cards.find(card => card.id === id)).toMatchObject(expected);
    expect(ruleset.cards.reduce((sum, card) => sum + card.copies, 0)).toBe(40);
  });

  it('builds identical 40-card decks, deals five non-events and sets up the shared leaves', () => {
    const ruleset = defaultRuleset();
    const state = newGame(ruleset, 20);
    for (const player of [0, 1] as const) {
      expect(state.players[player].deck.length + state.players[player].hand.length).toBe(40);
      expect(state.players[player].hand).toHaveLength(5);
      expect(state.players[player].pool).toEqual({ C: 10, N: 3, P: 0, O2: 7 });
      const definitions = [...state.players[player].deck, ...state.players[player].hand].map(uid => state.cards[uid].defId);
      for (const def of ruleset.cards) expect(definitions.filter(id => id === def.id)).toHaveLength(def.copies);
      for (const uid of state.players[player].hand) expect(ruleset.cards.find(card => card.id === state.cards[uid].defId)?.kind).not.toBe('event');
    }
    expect(state.center).toHaveLength(3);
    for (const uid of state.center) expect(state.cards[uid]).toMatchObject({ defId: 'fallen-leaf', owner: null, zone: 'center', status: 'dead', stored: { C: 1, N: 0, P: 0, O2: 0 } });
    expect(state).toMatchObject({ round: 1, isDay: true, firstPlayer: 0, activePlayer: 0 });
  });
});
