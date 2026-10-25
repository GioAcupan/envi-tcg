import { describe, expect, it } from 'vitest';
import { applyAction, checkAction, newGame, type Action, type GameState } from '../../src/engine';
import { give, play, testRuleset, uidOf } from './helpers';

describe('D1 — action validation, payments and referee', () => {
  it.each(['AP', 'nutrients'])('rejects a play without enough %s and changes only lastError', shortage => {
    let state = give(newGame(testRuleset(), 1), 0, 'river-grass');
    state = applyAction(state, { type: 'referee', op: shortage === 'AP'
      ? { kind: 'setAp', player: 0, ap: 0 }
      : { kind: 'setPool', player: 0, pool: { C: 0, N: 0 } } });
    const uid = state.players[0].hand.find(uid => state.cards[uid].defId === 'river-grass')!;
    const action: Action = { type: 'play', player: 0, uid };
    expect(checkAction(state, action)).toEqual(expect.any(String));
    const next = applyAction(state, action);
    expect(next.lastError).toEqual(expect.any(String));
    expect({ ...next, lastError: undefined }).toEqual({ ...state, lastError: undefined });
  });

  it('pays AP and C/N on a legal play and stores the cost', () => {
    const state = give(newGame(testRuleset(), 2), 0, 'river-grass');
    const uid = state.players[0].hand.find(uid => state.cards[uid].defId === 'river-grass')!;
    const action: Action = { type: 'play', player: 0, uid };
    expect(checkAction(state, action)).toBeNull();
    const next = applyAction(state, action);
    expect(next.lastError).toBeUndefined();
    expect(next.players[0].ap).toBe(state.players[0].ap - 1);
    expect(next.players[0].pool).toEqual({ ...state.players[0].pool, C: state.players[0].pool.C - 2, N: state.players[0].pool.N - 1 });
    expect(next.cards[uid]).toMatchObject({ zone: 'field', status: 'alive', stored: { C: 2, N: 1, P: 0, O2: 0 } });
  });

  it('allows and logs referee setPool even without AP', () => {
    let state = newGame(testRuleset(), 3);
    state = applyAction(state, { type: 'referee', op: { kind: 'setAp', player: 0, ap: 0 } });
    const action: Action = { type: 'referee', op: { kind: 'setPool', player: 0, pool: { C: 12, N: 4 } } };
    expect(checkAction(state, action)).toBeNull();
    state = applyAction(state, action);
    expect(state.players[0].pool).toMatchObject({ C: 12, N: 4 });
    expect(state.log.at(-1)?.text).toContain('Referee:');
  });
});

describe('D1 round flow', () => {
  it('settles Day production, upkeep and aging, then opens Night for player 1', () => {
    let { state, uid: producer } = play(newGame(testRuleset(), 4), 0, 'river-grass');
    const consumer = play(state, 0, 'caterpillar');
    state = consumer.state;
    const before = structuredClone(state);
    state = applyAction(state, { type: 'endTurn', player: 0 });
    state = applyAction(state, { type: 'endTurn', player: 1 });
    expect(state).toMatchObject({ round: 2, isDay: false, firstPlayer: 1, activePlayer: 1 });
    expect(state.players[0].pool.O2).toBe(before.players[0].pool.O2 + 2 - 1);
    expect(state.cards[producer].lifespanLeft).toBe(3);
    expect(state.cards[consumer.uid].lifespanLeft).toBe(2);
    for (const player of [0, 1] as const) {
      expect(state.players[player].hand).toHaveLength(before.players[player].hand.length + 1);
      expect(state.players[player].deck).toHaveLength(before.players[player].deck.length - 1);
      expect(state.players[player].ap).toBe(3);
    }
  });
});

describe('D1 food chain', () => {
  it('moves eaten prey under its eater and transfers its stored nutrients', () => {
    const prey = play(newGame(testRuleset(), 5), 1, 'leaf-litter-plant');
    let { state, uid: eater } = play(prey.state, 0, 'caterpillar');
    const before = structuredClone(state);
    const action: Action = { type: 'eat', player: 0, eaterUid: eater, preyUid: prey.uid };
    expect(checkAction(state, action)).toBeNull();
    state = applyAction(state, action);
    expect(state.cards[prey.uid]).toMatchObject({ zone: 'attached', attachedTo: eater });
    expect(state.cards[eater].stored.C).toBe(before.cards[eater].stored.C + before.cards[prey.uid].stored.C);
    expect(state.cards[eater].stored.N).toBe(before.cards[eater].stored.N + before.cards[prey.uid].stored.N);
    expect(state.players[0].ap).toBe(before.players[0].ap - 1);
    expect(checkAction(state, action)).toEqual(expect.any(String));
  });

  it.each(['riparian-tree', 'green-algae'])('Caterpillar cannot eat %s', defId => {
    const prey = play(newGame(testRuleset(), 6), 1, defId);
    const eater = play(prey.state, 0, 'caterpillar');
    expect(checkAction(eater.state, { type: 'eat', player: 0, eaterUid: eater.uid, preyUid: prey.uid })).toEqual(expect.any(String));
  });

  it('does not allow eating a Protected organism', () => {
    const prey = play(newGame(testRuleset(), 7), 1, 'leaf-litter-plant');
    const protectedPrey = play(prey.state, 1, 'protected-adaptation', prey.uid);
    const eater = play(protectedPrey.state, 0, 'caterpillar');
    expect(checkAction(eater.state, { type: 'eat', player: 0, eaterUid: eater.uid, preyUid: prey.uid })).toEqual(expect.any(String));
  });
});

describe('D1 decomposition', () => {
  it('processes a dead card over processRounds and returns stored nutrients to the microbe owner', () => {
    const dead = play(newGame(testRuleset(), 8), 1, 'river-grass');
    let state = applyAction(dead.state, { type: 'referee', op: { kind: 'setStatus', uid: dead.uid, status: 'dead' } });
    const detritivore = play(state, 0, 'freshwater-shrimp');
    state = applyAction(detritivore.state, { type: 'assign', player: 0, detritivoreUid: detritivore.uid, deadUid: dead.uid });
    expect(state.lastError).toBeUndefined();
    for (let round = 0; round < state.ruleset.params.processRounds; round++) {
      state = applyAction(state, { type: 'referee', op: { kind: 'endRound' } });
      expect(state.cards[dead.uid].status).toBe(round + 1 < state.ruleset.params.processRounds ? 'dead' : 'processed');
    }
    const stored = state.cards[dead.uid].stored;
    state = give(state, 0, 'decomposer-fungus');
    state = applyAction(state, { type: 'referee', op: { kind: 'setActivePlayer', player: 0 } });
    state = applyAction(state, { type: 'referee', op: { kind: 'setAp', player: 0, ap: 3 } });
    const before = state.players[0].pool;
    const microbe = state.players[0].hand.find(uid => state.cards[uid].defId === 'decomposer-fungus')!;
    state = applyAction(state, { type: 'play', player: 0, uid: microbe, targetUid: dead.uid });
    expect(state.lastError).toBeUndefined();
    expect(state.players[0].pool.C).toBe(before.C + stored.C + 1); // Shrimp's Shred bonus
    expect(state.players[0].pool.N).toBe(before.N + stored.N + 1);
    expect(state.cards[dead.uid].zone).toBe('discard');
    expect(state.players[1].discard).toContain(dead.uid);
    expect(state.cards[microbe].zone).toBe('field');
  });

  it('allows Super Decomposer on unprocessed dead matter', () => {
    let state = newGame(testRuleset(), 9);
    const dead = uidOf(state, 'fallen-leaf', 'center');
    const result = play(state, 0, 'super-decomposer', dead);
    state = result.state;
    expect(state.cards[dead]?.zone ?? 'removed').toBe('removed');
    expect(state.players[0].pool.C).toBe(31);
  });
});

describe('D1 events', () => {
  it('resolves drawn Strong Rainfall immediately and queues next Night upkeep', () => {
    const ruleset = testRuleset();
    ruleset.cards = ruleset.cards.map(card => ({ ...card, copies: card.id === 'strong-rainfall' ? 1 : card.copies }));
    let state = newGame(ruleset, 10);
    const event = Object.values(state.cards).find(card => card.defId === 'strong-rainfall' && card.owner === 0 && card.zone === 'deck')!;
    // Moving every other deck card to hand leaves the event as the only drawable card.
    for (const uid of [...state.players[0].deck]) {
      if (uid !== event.uid) state = applyAction(state, { type: 'referee', op: { kind: 'moveCard', uid, zone: 'hand', owner: 0 } });
    }
    const before = structuredClone(state);
    state = applyAction(state, { type: 'referee', op: { kind: 'draw', player: 0 } });
    expect(state.players[0].pool.P).toBe(before.players[0].pool.P + 2);
    expect(state.players[1].pool.P).toBe(before.players[1].pool.P + 2);
    expect(state.modifiers).toEqual(expect.arrayContaining([expect.objectContaining({ source: 'strong-rainfall', appliesTo: 'nextNight', effect: 'upkeep+1' })]));
    expect(state.players[0].hand).not.toContain(event.uid);
    expect(state.players[0].ap).toBe(before.players[0].ap);
  });

  it('Flood asks the drawer, then the other player, to choose an organism', () => {
    const ruleset = testRuleset();
    ruleset.cards = ruleset.cards.map(card => ({ ...card, copies: card.id === 'flood' ? 1 : card.copies }));
    const p0 = play(newGame(ruleset, 11), 0, 'river-grass');
    let { state, uid: p1 } = play(p0.state, 1, 'river-grass');
    const event = Object.values(state.cards).find(card => card.defId === 'flood' && card.owner === 0 && card.zone === 'deck')!;
    for (const uid of [...state.players[0].deck]) {
      if (uid !== event.uid) state = applyAction(state, { type: 'referee', op: { kind: 'moveCard', uid, zone: 'hand', owner: 0 } });
    }
    state = applyAction(state, { type: 'referee', op: { kind: 'draw', player: 0 } });
    expect(state.phase).toBe('choice');
    expect(state.pendingChoice).toMatchObject({ player: 0, options: expect.arrayContaining([p0.uid]) });
    const before = structuredClone(state);
    state = applyAction(state, { type: 'choose', player: 0, uid: p0.uid });
    expect(state.cards[p0.uid].status).toBe('processed');
    expect(state.players[0].pool.C).toBe(before.players[0].pool.C + 1);
    expect(state.pendingChoice).toMatchObject({ player: 1, options: expect.arrayContaining([p1]) });
    state = applyAction(state, { type: 'choose', player: 1, uid: p1 });
    expect(state.cards[p1].status).toBe('processed');
    expect(state.players[1].pool.C).toBe(before.players[1].pool.C + 1);
    expect(state.pendingChoice).toBeUndefined();
  });
});

describe('D1 win', () => {
  it('ends the game when an action reaches every nutrient threshold', () => {
    const state = applyAction(newGame(testRuleset(), 12), { type: 'referee', op: { kind: 'setPool', player: 0, pool: { C: 50, N: 15, P: 2 } } });
    expect(state.winner).toBe(0);
    expect(state.phase).toBe('gameOver');
  });
});

describe('D3 — applyAction purity', () => {
  it.each(['legal', 'illegal', 'referee', 'endTurn'] as const)('never mutates input for %s actions', kind => {
    let state = give(newGame(testRuleset(), 13), 0, 'river-grass');
    if (kind === 'illegal') state = applyAction(state, { type: 'referee', op: { kind: 'setAp', player: 0, ap: 0 } });
    const uid = state.players[0].hand.find(uid => state.cards[uid].defId === 'river-grass')!;
    const action: Action = kind === 'referee' ? { type: 'referee', op: { kind: 'setPool', player: 0, pool: { C: 12 } } }
      : kind === 'endTurn' ? { type: 'endTurn', player: 0 } : { type: 'play', player: 0, uid };
    const before = structuredClone(state);
    applyAction(state, action);
    expect(state).toEqual(before);
  });
});

describe('D6 — card ability handlers', () => {
  it('River Grass gains +1 C when photosynthesizing', () => {
    const played = play(newGame(testRuleset(), 14), 0, 'river-grass');
    const before = played.state.players[0].pool.C;
    const state = applyAction(played.state, { type: 'referee', op: { kind: 'endRound' } });
    expect(state.players[0].pool.C).toBe(before + 1);
  });

  it('Fast-Growing Plant gains +1 C on play', () => {
    const state = give(newGame(testRuleset(), 15), 0, 'fast-growing-plant');
    const uid = state.players[0].hand.find(uid => state.cards[uid].defId === 'fast-growing-plant')!;
    const next = applyAction(state, { type: 'play', player: 0, uid });
    expect(next.players[0].pool.C).toBe(state.players[0].pool.C - 1 + 1);
  });

  it('Riparian Tree is uneatable by primaries', () => {
    const prey = play(newGame(testRuleset(), 16), 1, 'riparian-tree');
    const eater = play(prey.state, 0, 'grasshopper');
    expect(checkAction(eater.state, { type: 'eat', player: 0, eaterUid: eater.uid, preyUid: prey.uid })).toEqual(expect.any(String));
  });

  it('Leaf Litter Plant creates a Fallen Leaf on death', () => {
    const played = play(newGame(testRuleset(), 17), 0, 'leaf-litter-plant');
    const state = applyAction(played.state, { type: 'referee', op: { kind: 'setCardField', uid: played.uid, field: 'lifespanLeft', value: 1 } });
    const next = applyAction(state, { type: 'referee', op: { kind: 'endRound' } });
    expect(next.cards[played.uid].status).toBe('dead');
    const leaves = Object.values(next.cards).filter(card => card.defId === 'fallen-leaf' && card.owner === 0 && card.zone === 'field');
    expect(leaves).toHaveLength(1);
    expect(leaves[0]).toMatchObject({ status: 'dead', stored: { C: 1, N: 0, P: 0, O2: 0 } });
  });

  it('Nutrient-Rich prey gives the eater owner +1 C and +1 N', () => {
    const prey = play(newGame(testRuleset(), 18), 1, 'river-grass');
    const adapted = play(prey.state, 1, 'nutrient-rich-adaptation', prey.uid);
    const eater = play(adapted.state, 0, 'caterpillar');
    const before = eater.state.players[0].pool;
    const state = applyAction(eater.state, { type: 'eat', player: 0, eaterUid: eater.uid, preyUid: prey.uid });
    expect(state.players[0].pool).toEqual({ ...before, C: before.C + 1, N: before.N + 1 });
  });

  it('Super Decomposer can decompose unprocessed dead matter from the field', () => {
    const dead = play(newGame(testRuleset(), 19), 1, 'river-grass');
    const state = applyAction(dead.state, { type: 'referee', op: { kind: 'setStatus', uid: dead.uid, status: 'dead' } });
    const next = play(state, 0, 'super-decomposer', dead.uid).state;
    expect(next.players[0].pool).toMatchObject({ C: 32, N: 21 });
    expect(next.players[1].discard).toContain(dead.uid);
  });
});
