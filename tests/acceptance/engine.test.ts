import { describe, expect, it } from 'vitest';
import { applyAction, checkAction, newGame } from '../../src/engine';
import { defaultRuleset } from '../../src/ruleset';
import { give, play, testRuleset, round, ref } from './helpers';

describe('U1 UPDATE-2.1 decks', () => {
  it('deals five from a 27-card deck of producers, detritivores, microbes and five events', () => {
    const rules = defaultRuleset();
    const state = newGame(rules, 12);
    for (const p of state.players) { expect(p.hand).toHaveLength(5); expect(p.deck.length + p.hand.length).toBe(27); }
    expect(new Set(Object.values(state.cards).map(c => rules.cards.find(d => d.id === c.defId)!.kind))).toEqual(new Set(['producer', 'detritivore', 'microbe', 'event']));
  });
});

describe('U2 play costs and initial biomass', () => {
  it('pays fractional N and AP and stores printed biomass', () => {
    let state = give(newGame(testRuleset(), 1), 0, 'emergent-plant');
    const uid = state.players[0].hand.find(u => state.cards[u].defId === 'emergent-plant')!;
    state = applyAction(state, { type: 'play', player: 0, uid });
    expect(state.lastError).toBeUndefined(); expect(state.players[0].pool).toEqual({ C: 8, N: 2.5, P: 0, O2: 7 });
    expect(state.players[0].ap).toBe(2); expect(state.cards[uid].stored).toEqual({ C: 6, N: 2, P: 0, O2: 0 });
  });
  it('microbes cost only AP to play and require a dead target', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    state = give(state, 0, 'carbon-bacteria'); const uid = state.players[0].hand.find(u => state.cards[u].defId === 'carbon-bacteria')!;
    const before = state.players[0].pool.O2;
    expect(checkAction(state, { type: 'play', player: 0, uid })).toBeTruthy();
    state = applyAction(state, { type: 'play', player: 0, uid, targetUid: plant.uid });
    expect(state.players[0].pool.O2).toBe(before); expect(state.cards[uid].attachedTo).toBe(plant.uid);
  });
  it.each(['green-algae', 'cyanobacteria'])('%s costs 2 P', id => {
    let state = give(newGame(testRuleset(), 1), 0, id); const uid = state.players[0].hand.find(u => state.cards[u].defId === id)!;
    expect(checkAction(state, { type: 'play', player: 0, uid })).toBe('Not enough nutrients');
    state = ref(state, { kind: 'setPool', player: 0, pool: { P: 2.5 } }); state = applyAction(state, { type: 'play', player: 0, uid });
    expect(state.lastError).toBeUndefined(); expect(state.players[0].pool.P).toBe(0.5);
  });
});

describe('U3 round production', () => {
  it('grows and yields every round after both turns', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'emergent-plant');
    let state = plant.state; const before = state.players[0].pool;
    state = applyAction(state, { type: 'endTurn', player: 0 }); expect(state.round).toBe(1);
    state = applyAction(state, { type: 'endTurn', player: 1 });
    expect(state.cards[plant.uid].stored.C).toBe(7); expect(state.players[0].pool.C).toBe(before.C + 1); expect(state.players[0].pool.O2).toBe(before.O2 + 2);
    state = round(state); expect(state.cards[plant.uid].stored.C).toBe(8);
  });
});

describe('U4 detritivore release and completion', () => {
  it('releases three C, pauses lifespan, shuffles the finished card into its deck and frees workers', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'emergent-plant');
    let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    const shrimp = play(state, 0, 'freshwater-shrimp', plant.uid); state = shrimp.state;
    const before = state.players[0].pool.C; state = round(state);
    expect(state.players[0].pool.C).toBe(before + 3); expect(state.cards[plant.uid].stored.C).toBe(3); expect(state.cards[shrimp.uid].lifespanLeft).toBe(4);
    state = round(state); expect(state.cards[plant.uid].zone).toBe('deck'); expect(state.players[0].deck).toContain(plant.uid); expect(state.cards[shrimp.uid].working).toBeUndefined();
    expect(state.cards[shrimp.uid]).toMatchObject({ zone: 'field', status: 'alive' });
  });
  it('allows multiple workers and collector + shredder bonus from biomass', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    state = play(state, 0, 'freshwater-shrimp', plant.uid).state;
    const worm = play(state, 1, 'tubifex-worm', plant.uid); state = worm.state;
    const before = state.players[1].pool; state = round(state);
    expect(state.players[1].pool.C).toBe(before.C + 2); expect(state.players[1].pool.N).toBe(before.N + 1); expect(state.cards[plant.uid].stored.C).toBe(1); expect(state.cards[worm.uid].lifespanLeft).toBe(3);
  });
});

describe('U5 microbes decompose until their card is gone', () => {
  // River Grass holds 6 C / 2 N; the shrimp releases 3 C a round and each microbe eats 1 C / 0.5 N of what is left.
  it.each([
    ['carbon-bacteria', { C: 6, N: 0, P: 0 }],     // 3 released + 3 doubled
    ['nitrifying-bacteria', { C: 3, N: 4, P: 0 }], // 3 released; all 2 N doubled
    ['phosphorus-bacteria', { C: 3, N: 0, P: 1 }], // 3 released; +1 P
  ] as const)('%s with a detritivore uses its doubling ability, pays O2, eats biomass and returns to hand at the end', (id, gained) => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    state = play(state, 0, 'freshwater-shrimp', plant.uid).state;
    const microbe = play(state, 0, id, plant.uid); state = microbe.state;
    const before = state.players[0].pool; state = round(state);
    expect(state.cards[microbe.uid]).toMatchObject({ zone: 'attached', attachedTo: plant.uid }); expect(state.cards[plant.uid].stored.C).toBe(2);
    expect(state.players[0].pool).toEqual({ C: before.C + gained.C, N: before.N + gained.N, P: before.P + gained.P, O2: before.O2 - 2 });
    if (id === 'nitrifying-bacteria') expect(state.cards[plant.uid].stored.N).toBe(0);
    state = round(state);
    expect(state.cards[microbe.uid].zone).toBe('hand'); expect(state.cards[plant.uid].zone).toBe('deck');
  });
  it('waits attached when no worker acts but still pays O2, and is discarded when it cannot', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    const state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    const microbe = play(state, 0, 'carbon-bacteria', plant.uid);
    const waited = round(microbe.state);
    expect(waited.cards[microbe.uid]).toMatchObject({ zone: 'attached', attachedTo: plant.uid }); expect(waited.players[0].pool.O2).toBe(microbe.state.players[0].pool.O2 - 1);
    const starved = round(ref(microbe.state, { kind: 'setPool', player: 0, pool: { O2: 0 } }));
    expect(starved.cards[microbe.uid].zone).toBe('discard');
  });
  it.each([
    ['carbon-bacteria', { C: 1, N: 0, P: 0 }, { C: 4, N: 1.5 }],
    ['nitrifying-bacteria', { C: 0, N: 1, P: 0 }, { C: 5, N: 0.5 }],
    ['phosphorus-bacteria', { C: 0, N: 0, P: 1 }, { C: 5, N: 1.5 }],
  ] as const)('%s alone releases its own amount and eats 1 C / 0.5 N of the card', (id, gained, left) => {
    const plant = play(newGame(testRuleset(), 1), 1, 'river-grass');
    const microbe = play(ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' }), 0, id, plant.uid);
    const before = microbe.state.players[0].pool, state = round(microbe.state);
    expect(state.players[0].pool).toEqual({ C: before.C + gained.C, N: before.N + gained.N, P: before.P + gained.P, O2: before.O2 - 1 });
    expect(state.cards[plant.uid].stored).toMatchObject(left);
  });
  it('a microbe alone eventually finishes its card and returns to hand', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    let state = ref(plant.state, { kind: 'setCardField', uid: plant.uid, field: 'stored', value: { C: 2, N: 0, P: 0, O2: 0 } });
    const microbe = play(ref(state, { kind: 'setStatus', uid: plant.uid, status: 'dead' }), 0, 'carbon-bacteria', plant.uid);
    state = round(microbe.state); expect(state.cards[plant.uid].zone).toBe('deck'); expect(state.cards[microbe.uid].zone).toBe('hand');
  });
});

describe('U7 wild events', () => {
  it('Drought affects only its drawer, for this round and the next, and aquatic plants produce nothing', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'drought')!.copies = 1;
    const a = play(newGame(rules, 1), 0, 'aquatic-plant'); const b = play(a.state, 0, 'river-grass');
    let state = play(b.state, 0, 'drought').state; const before = state.players[0].pool;
    expect(state.modifiers.every(m => m.player === 0)).toBe(true);
    state = round(state); expect(state.cards[a.uid].stored.C).toBe(6); expect(state.cards[b.uid].stored.C).toBe(7); expect(state.players[0].pool.O2).toBe(before.O2 + 1);
    expect(state.modifiers.map(m => m.activeRound)).toEqual([2, 2, 2]);
    state = round(state); expect(state.cards[a.uid].stored.C).toBe(6); expect(state.modifiers.filter(m => m.source === 'drought' && m.activeRound === 2)).toHaveLength(0);
  });
  it('a played event stays out until its last round ends, then is shuffled back into its owner\'s deck', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'drought')!.copies = 1;
    const drought = play(newGame(rules, 1), 0, 'drought');
    expect(drought.state.cards[drought.uid].zone).toBe('removed'); expect(drought.state.drawnEvents).toEqual([{ round: 1, player: 0, uid: drought.uid }]);
    let state = round(drought.state); expect(state.cards[drought.uid].zone).toBe('removed');
    state = round(state); expect(state.log.some(l => l.text === 'Round 3: Drought ends for Player 1 after round 2; shuffled back into their deck')).toBe(true);
  });
  it('Heat Wave can kill producers and charges upkeep in play order', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'heat-wave')!.copies = 1;
    // Remove production using a zero-yield edited producer so the producer cannot pay even one O2.
    const edited = testRuleset({ cards: rules.cards.map(c => c.kind === 'producer' ? { ...c, yield: {} } : c) });
    const p = play(newGame(edited, 1), 0, 'river-grass'); let state = play(p.state, 0, 'heat-wave').state; state = ref(state, { kind: 'setPool', player: 0, pool: { O2: 0 } });
    state = round(state); expect(state.cards[p.uid].status).toBe('dead');
  });
  it('Flash Flood kills one of the drawer\'s living organisms at random, or gives them P without one', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'flood')!.copies = 1;
    const plant = play(newGame(rules, 5), 0, 'river-grass'); const shrimp = play(plant.state, 0, 'freshwater-shrimp');
    const enemy = play(shrimp.state, 1, 'emergent-plant');
    const state = play(enemy.state, 0, 'flood').state;
    expect([plant.uid, shrimp.uid].filter(uid => state.cards[uid].status === 'dead')).toHaveLength(1); expect(state.cards[enemy.uid].status).toBe('alive');
    expect(state.players[0].pool.C).toBe(31); expect(state.players[1].pool.P).toBe(2);
    expect(play(enemy.state, 0, 'flood').state).toEqual(state);
    expect(play(newGame(rules, 5), 0, 'flood').state.players[0].pool.P).toBe(3);
  });
  it('Introduced Non-native Species kills two of the drawer\'s organisms and costs 5 C / 2 N, doubled with none alive', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'introduced-species')!.copies = 1;
    const a = play(newGame(rules, 5), 0, 'river-grass'), b = play(a.state, 0, 'freshwater-shrimp'), c = play(b.state, 0, 'aquatic-worm');
    const state = play(c.state, 0, 'introduced-species').state;
    expect([a.uid, b.uid, c.uid].filter(uid => state.cards[uid].status === 'dead')).toHaveLength(2); expect(state.players[0].pool).toMatchObject({ C: 25, N: 18 });
    expect(play(newGame(rules, 5), 0, 'introduced-species').state.players[0].pool).toMatchObject({ C: 20, N: 16 });
  });
});

describe('U8 Algal Bloom', () => {
  it.each([false, true])('Rainfall gives its drawer P and bloom respects snail=%s', snail => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'strong-rainfall')!.copies = 1;
    const algae = play(newGame(rules, 1), 0, 'green-algae'); let state = algae.state;
    if (snail) state = play(state, 0, 'freshwater-snail').state;
    state = give(state, 0, 'strong-rainfall'); const uid = state.players[0].hand.find(u => state.cards[u].defId === 'strong-rainfall')!;
    state = ref(state, { kind: 'setPool', player: 0, pool: { P: 2 } });
    state = applyAction(state, { type: 'play', player: 0, uid });
    expect(state.players[0].pool.P).toBe(3); expect(state.players[1].pool.P).toBe(0); expect(state.cards[algae.uid].stored.C).toBe(snail ? 2 : 4);
    state = round(state); expect(state.cards[algae.uid].stored.C).toBe(snail ? 3 : 10); expect(state.cards[algae.uid].stored.N).toBe(snail ? 1 : 2);
  });
});

describe('U9 victory', () => {
  it('wins at 50 C / 15 N / 1 P but not a fractional amount short', () => {
    let state = ref(newGame(testRuleset(), 1), { kind: 'setPool', player: 0, pool: { C: 49.5, N: 15, P: 1 } }); expect(state.phase).toBe('action');
    state = ref(state, { kind: 'setPool', player: 0, pool: { C: 50 } }); expect(state.winner).toBe(0); expect(state.phase).toBe('gameOver');
  });
});
