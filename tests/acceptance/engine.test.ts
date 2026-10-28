import { describe, expect, it } from 'vitest';
import { applyAction, checkAction, newGame } from '../../src/engine';
import { defaultRuleset } from '../../src/ruleset';
import { give, play, testRuleset, round, ref } from './helpers';

describe('U1 UPDATE-2 decks', () => {
  it('deals five from a 26-card deck of producers, detritivores, microbes and events', () => {
    const rules = defaultRuleset();
    const state = newGame(rules, 12);
    for (const p of state.players) { expect(p.hand).toHaveLength(5); expect(p.deck.length + p.hand.length).toBe(26); }
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

describe('U5 microbes assist until their card is decomposed', () => {
  // River Grass holds 6 C / 2 N; the shrimp releases 3 C a round, so the card lasts two rounds.
  it.each([
    ['carbon-bacteria', { C: 5, N: 0, P: 0 }],      // 3 released + 3 doubled - 1 taken
    ['nitrifying-bacteria', { C: 2, N: 3.5, P: 0 }], // 3 released - 1; all 2 N doubled - 0.5
    ['phosphorus-bacteria', { C: 2, N: 0, P: 1 }],   // 3 released - 1; +1 P
  ] as const)('%s assists each round, pays O2, takes its share and returns to hand at the end', (id, gained) => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    state = play(state, 0, 'freshwater-shrimp', plant.uid).state;
    const microbe = play(state, 0, id, plant.uid); state = microbe.state;
    const before = state.players[0].pool; state = round(state);
    expect(state.cards[microbe.uid]).toMatchObject({ zone: 'attached', attachedTo: plant.uid }); expect(state.cards[plant.uid].stored.C).toBe(3);
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
  it('never takes back nutrients its owner did not get from the card', () => {
    const plant = play(newGame(testRuleset(), 1), 1, 'river-grass');
    let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    state = play(state, 1, 'freshwater-shrimp', plant.uid).state;
    const microbe = play(state, 0, 'phosphorus-bacteria', plant.uid); state = microbe.state;
    const before = state.players[0].pool; state = round(state);
    expect(state.players[0].pool).toEqual({ ...before, P: before.P + 1, O2: before.O2 - 1 });
  });
});

describe('U7 wild events', () => {
  it('Drought affects this round and aquatic plants produce nothing', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'drought')!.copies = 1;
    const a = play(newGame(rules, 1), 0, 'aquatic-plant'); const b = play(a.state, 0, 'river-grass');
    let state = play(b.state, 0, 'drought').state; const before = state.players[0].pool;
    state = round(state); expect(state.cards[a.uid].stored.C).toBe(6); expect(state.cards[b.uid].stored.C).toBe(7); expect(state.players[0].pool.O2).toBe(before.O2 + 1); expect(state.modifiers).toHaveLength(0);
  });
  it('a played event waits out its round, then is shuffled back into its owner\'s deck', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'drought')!.copies = 1;
    const drought = play(newGame(rules, 1), 0, 'drought');
    expect(drought.state.cards[drought.uid].zone).toBe('removed');
    const state = round(drought.state); expect(state.players[0].deck).toContain(drought.uid);
  });
  it('Heat Wave can kill producers and charges upkeep in play order', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'heat-wave')!.copies = 1;
    // Remove production using a zero-yield edited producer so the producer cannot pay even one O2.
    const edited = testRuleset({ cards: rules.cards.map(c => c.kind === 'producer' ? { ...c, yield: {} } : c) });
    const p = play(newGame(edited, 1), 0, 'river-grass'); let state = play(p.state, 0, 'heat-wave').state; state = ref(state, { kind: 'setPool', player: 0, pool: { O2: 0 } });
    state = round(state); expect(state.cards[p.uid].status).toBe('dead');
  });
  it('Flood randomly kills one living organism per player, or gives P without one', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'flood')!.copies = 1;
    const plant = play(newGame(rules, 5), 0, 'river-grass'); const shrimp = play(plant.state, 0, 'freshwater-shrimp');
    const state = play(shrimp.state, 0, 'flood').state;
    expect([plant.uid, shrimp.uid].filter(uid => state.cards[uid].status === 'dead')).toHaveLength(1); expect(state.players[0].pool.C).toBe(31); expect(state.players[1].pool.P).toBe(1);
    expect(play(shrimp.state, 0, 'flood').state).toEqual(state);
  });
});

describe('U8 Algal Bloom', () => {
  it.each([false, true])('Rainfall gives each player P and bloom respects snail=%s', snail => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'strong-rainfall')!.copies = 1;
    const algae = play(newGame(rules, 1), 0, 'green-algae'); let state = algae.state;
    if (snail) state = play(state, 0, 'freshwater-snail').state;
    state = give(state, 0, 'strong-rainfall'); const uid = state.players[0].hand.find(u => state.cards[u].defId === 'strong-rainfall')!;
    state = ref(state, { kind: 'setPool', player: 0, pool: { P: 2 } });
    state = applyAction(state, { type: 'play', player: 0, uid });
    expect(state.players[0].pool.P).toBe(3); expect(state.players[1].pool.P).toBe(1); expect(state.cards[algae.uid].stored.C).toBe(snail ? 2 : 4);
    state = round(state); expect(state.cards[algae.uid].stored.C).toBe(snail ? 3 : 10); expect(state.cards[algae.uid].stored.N).toBe(snail ? 1 : 2);
  });
});

describe('U9 victory', () => {
  it('wins at 50 C / 15 N / 1 P but not a fractional amount short', () => {
    let state = ref(newGame(testRuleset(), 1), { kind: 'setPool', player: 0, pool: { C: 49.5, N: 15, P: 1 } }); expect(state.phase).toBe('action');
    state = ref(state, { kind: 'setPool', player: 0, pool: { C: 50 } }); expect(state.winner).toBe(0); expect(state.phase).toBe('gameOver');
  });
});
