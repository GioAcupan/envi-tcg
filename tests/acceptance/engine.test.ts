import { describe, expect, it } from 'vitest';
import { applyAction, checkAction, newGame } from '../../src/engine';
import { defaultRuleset } from '../../src/ruleset';
import { give, play, testRuleset, round, ref } from './helpers';

describe('U1 decks and evolution baseline', () => {
  it.each([true, false])('deals five of %s evolution deck', evolutionEnabled => {
    const rules = defaultRuleset(); rules.params.evolutionEnabled = evolutionEnabled;
    const state = newGame(rules, 12);
    for (const p of state.players) { expect(p.hand).toHaveLength(5); expect(p.deck.length + p.hand.length).toBe(evolutionEnabled ? 36 : 26); }
    if (!evolutionEnabled) expect(Object.values(state.cards).some(c => rules.cards.find(d => d.id === c.defId)!.kind === 'adaptation')).toBe(false);
  });
});

describe('U2 play costs and initial biomass', () => {
  it('pays fractional N and AP and stores printed biomass', () => {
    let state = give(newGame(testRuleset(), 1), 0, 'emergent-plant');
    const uid = state.players[0].hand.find(u => state.cards[u].defId === 'emergent-plant')!;
    state = applyAction(state, { type: 'play', player: 0, uid });
    expect(state.lastError).toBeUndefined(); expect(state.players[0].pool).toEqual({ C: 8, N: 2.5, P: 0, O2: 7 });
    expect(state.players[0].ap).toBe(2); expect(state.cards[uid].stored).toEqual({ C: 6, N: 1, P: 0, O2: 0 });
  });
  it('pays microbe O2 and requires a dead target', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    state = give(state, 0, 'carbon-bacteria'); const uid = state.players[0].hand.find(u => state.cards[u].defId === 'carbon-bacteria')!;
    const before = state.players[0].pool.O2;
    expect(checkAction(state, { type: 'play', player: 0, uid })).toBeTruthy();
    state = applyAction(state, { type: 'play', player: 0, uid, targetUid: plant.uid });
    expect(state.players[0].pool.O2).toBe(before - 1); expect(state.cards[uid].attachedTo).toBe(plant.uid);
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
  it('Oxygen-Rich adds two O2 and P-Accumulator adds biomass P', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    let state = play(plant.state, 0, 'oxygen-rich-adaptation', plant.uid).state;
    state = play(state, 0, 'p-accumulator-adaptation', plant.uid).state;
    const before = state.players[0].pool.O2; state = round(state);
    expect(state.players[0].pool.O2).toBe(before + 4); expect(state.cards[plant.uid].stored.P).toBe(1);
  });
});

describe('U4 detritivore release and completion', () => {
  it('releases three C, pauses lifespan, completes and frees workers', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'emergent-plant');
    let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    const shrimp = play(state, 0, 'freshwater-shrimp', plant.uid); state = shrimp.state;
    const before = state.players[0].pool.C; state = round(state);
    expect(state.players[0].pool.C).toBe(before + 3); expect(state.cards[plant.uid].stored.C).toBe(3); expect(state.cards[shrimp.uid].lifespanLeft).toBe(4);
    state = round(state); expect(state.cards[plant.uid].zone).toBe('discard'); expect(state.cards[shrimp.uid].working).toBeUndefined();
    expect(Object.values(state.cards).some(c => c.zone === 'field' && c.uid === plant.uid)).toBe(false);
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

describe('U5 one-use microbe assistance', () => {
  it.each(['carbon-bacteria', 'nitrifying-bacteria', 'phosphorus-bacteria'])('%s assists and returns to hand', id => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    state = play(state, 0, 'freshwater-shrimp', plant.uid).state;
    const microbe = play(state, 0, id, plant.uid); state = microbe.state;
    const before = state.players[0].pool; state = round(state);
    expect(state.cards[microbe.uid].zone).toBe('hand'); expect(state.cards[plant.uid].stored.C).toBe(3);
    if (id === 'carbon-bacteria') expect(state.players[0].pool.C).toBe(before.C + 6);
    if (id === 'nitrifying-bacteria') { expect(state.players[0].pool.N).toBe(before.N + 1); expect(state.cards[plant.uid].stored.N).toBe(0); }
    if (id === 'phosphorus-bacteria') expect(state.players[0].pool.P).toBe(before.P + 1);
  });
  it('waits attached when no worker acts', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    const state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    const microbe = play(state, 0, 'carbon-bacteria', plant.uid);
    expect(round(microbe.state).cards[microbe.uid]).toMatchObject({ zone: 'attached', attachedTo: plant.uid });
  });
});

describe('U6 consumer eating', () => {
  it('transfers prey biomass, attaches prey, charges AP and limits eating', () => {
    const fish = play(newGame(testRuleset(), 1), 0, 'small-fish');
    const shrimp = play(fish.state, 1, 'freshwater-shrimp');
    const worm = play(shrimp.state, 1, 'aquatic-worm');
    let state = ref(worm.state, { kind: 'setActivePlayer', player: 0 }); const before = state.players[0].ap;
    state = applyAction(state, { type: 'eat', player: 0, eaterUid: fish.uid, preyUid: shrimp.uid });
    expect(state.lastError).toBeUndefined(); expect(state.cards[fish.uid].stored).toEqual({ C: 6, N: 2, P: 0, O2: 0 }); expect(state.cards[shrimp.uid]).toMatchObject({ zone: 'attached', attachedTo: fish.uid }); expect(state.players[0].ap).toBe(before - 1);
    expect(checkAction(state, { type: 'eat', player: 0, eaterUid: fish.uid, preyUid: worm.uid })).toMatch(/limit/);
  });
  it('blocks Protected prey', () => {
    const fish = play(newGame(testRuleset(), 1), 0, 'small-fish'); const prey = play(fish.state, 1, 'freshwater-shrimp');
    let state = play(prey.state, 1, 'protected-adaptation', prey.uid).state; state = ref(state, { kind: 'setActivePlayer', player: 0 });
    expect(checkAction(state, { type: 'eat', player: 0, eaterUid: fish.uid, preyUid: prey.uid })).toMatch(/Protected/);
  });
});

describe('U7 wild events', () => {
  it('Drought affects this round and aquatic plants produce nothing', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'drought')!.copies = 1;
    const a = play(newGame(rules, 1), 0, 'aquatic-plant'); const b = play(a.state, 0, 'river-grass');
    let state = play(b.state, 0, 'drought').state; const before = state.players[0].pool;
    state = round(state); expect(state.cards[a.uid].stored.C).toBe(6); expect(state.cards[b.uid].stored.C).toBe(7); expect(state.players[0].pool.O2).toBe(before.O2 + 1); expect(state.modifiers).toHaveLength(0);
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
    const plant = play(newGame(rules, 5), 0, 'river-grass'); const fish = play(plant.state, 0, 'small-fish');
    const state = play(fish.state, 0, 'flood').state;
    expect([plant.uid, fish.uid].filter(uid => state.cards[uid].status === 'dead')).toHaveLength(1); expect(state.players[0].pool.C).toBe(31); expect(state.players[1].pool.P).toBe(1);
    expect(play(fish.state, 0, 'flood').state).toEqual(state);
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
