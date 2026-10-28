import { describe, expect, it } from 'vitest';
import { applyAction, checkAction, newGame, type Action } from '../src/engine';
import { defaultRuleset } from '../src/ruleset';
import { give, play, testRuleset, round, ref } from './acceptance/helpers';

describe('lane: public action boundaries and lifecycle', () => {
  it('uses deterministic seeded decks and copies its input ruleset', () => {
    const rules = defaultRuleset(), first = newGame(rules, 17);
    expect(first).toEqual(newGame(rules, 17)); expect(first.players[0].deck).not.toEqual(newGame(rules, 18).players[0].deck);
    rules.params.startingPool.C = 999; expect(first.players[0].pool.C).toBe(10);
    for (const p of first.players) for (const uid of p.hand) expect(first.ruleset.cards.find(d => d.id === first.cards[uid].defId)!.kind).not.toBe('event');
  });
  it('an illegal action changes only lastError and checkAction is pure', () => {
    const state = newGame(testRuleset(), 1), before = structuredClone(state);
    const action: Action = { type: 'play', player: 1, uid: state.players[1].hand[0] };
    expect(checkAction(state, action)).toBeTruthy(); expect(state).toEqual(before);
    expect(applyAction(state, action)).toEqual({ ...before, lastError: checkAction(state, action) });
    expect(applyAction(state, { type: 'endTurn', player: 0 }).lastError).toBeUndefined();
  });
  it('compares fractional O2 and N without rounding and does not partially pay on failure', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'river-grass')!.cost.O2 = 0.5;
    let state = give(newGame(rules, 1), 0, 'river-grass'); const uid = state.players[0].hand.find(u => state.cards[u].defId === 'river-grass')!;
    state = ref(state, { kind: 'setPool', player: 0, pool: { N: 0.49, O2: 0.5 } });
    const action: Action = { type: 'play', player: 0, uid }; expect(checkAction(state, action)).toBe('Not enough nutrients');
    expect(applyAction(state, action)).toEqual({ ...state, lastError: 'Not enough nutrients' });
    state = ref(state, { kind: 'setPool', player: 0, pool: { N: 0.5 } }); state = applyAction(state, action);
    expect(state.players[0].pool.N).toBe(0); expect(state.players[0].pool.O2).toBe(0);
  });
  it('referee moves keep all zone indexes and ownership consistent', () => {
    let state = newGame(testRuleset(), 1); const uid = state.players[0].hand[0];
    for (const zone of ['deck', 'hand', 'discard', 'field', 'attached', 'removed'] as const) {
      state = ref(state, { kind: 'moveCard', uid, zone, owner: 1 });
      expect(state.cards[uid]).toMatchObject({ owner: 1, zone });
      for (const p of state.players) for (const z of ['deck', 'hand', 'discard'] as const) expect(p[z].includes(uid)).toBe(p.id === 1 && zone === z);
    }
  });
  it('referee changes fields, status, AP, active player, and can reverse a win', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    let state = ref(plant.state, { kind: 'setCardField', uid: plant.uid, field: 'lifespanLeft', value: 8 });
    state = ref(state, { kind: 'setCardField', uid: plant.uid, field: 'stored', value: { C: 0.5, N: 1.5, P: 0, O2: 0 } });
    expect(state.cards[plant.uid]).toMatchObject({ lifespanLeft: 8, stored: { C: 0.5, N: 1.5 } });
    state = ref(state, { kind: 'setStatus', uid: plant.uid, status: 'dead' }); expect(state.cards[plant.uid].status).toBe('dead');
    state = ref(state, { kind: 'setStatus', uid: plant.uid, status: 'alive' }); expect(state.cards[plant.uid].status).toBe('alive');
    state = ref(state, { kind: 'setAp', player: 1, ap: 6 }); expect(state.players[1].ap).toBe(6);
    state = ref(state, { kind: 'setActivePlayer', player: 1 }); expect(state.activePlayer).toBe(1);
    state = ref(state, { kind: 'setPool', player: 0, pool: { C: 50, N: 15, P: 1 } }); expect(state.winner).toBe(0);
    state = ref(state, { kind: 'setPool', player: 0, pool: { C: 49.5 } }); expect(state.winner).toBeUndefined(); expect(state.phase).toBe('action');
    expect(state.log.every(l => l.text.startsWith(`Round ${l.round}: `))).toBe(true);
  });
  it('reshuffles discard on an empty deck and skips a draw only when both are empty', () => {
    let state = newGame(testRuleset(), 1);
    for (const uid of [...state.players[0].deck]) state = ref(state, { kind: 'moveCard', uid, zone: 'hand' });
    const cards = state.players[0].hand.slice(0, 3);
    for (const uid of cards) state = ref(state, { kind: 'moveCard', uid, zone: 'discard' });
    const result = ref(state, { kind: 'draw', player: 0 }); expect(result).toEqual(ref(state, { kind: 'draw', player: 0 }));
    expect(result.players[0].discard).toHaveLength(0); expect(result.players[0].deck).toHaveLength(2); expect(cards.some(uid => result.players[0].hand.includes(uid))).toBe(true);
    let empty = newGame(testRuleset(), 1); for (const uid of [...empty.players[0].deck]) empty = ref(empty, { kind: 'moveCard', uid, zone: 'hand' });
    const before = empty.players[0].hand.length; empty = ref(empty, { kind: 'draw', player: 0 }); expect(empty.players[0].hand).toHaveLength(before); expect(empty.log.at(-1)!.text).toMatch(/skips a draw/);
  });
  it('discard-and-draw pays AP and a recycled organism starts with fresh biomass', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass');
    let state = ref(plant.state, { kind: 'setCardField', uid: plant.uid, field: 'stored', value: { C: 0, N: 0, P: 0, O2: 0 } });
    state = ref(state, { kind: 'moveCard', uid: plant.uid, zone: 'hand' }); const ap = state.players[0].ap;
    state = applyAction(state, { type: 'discardDraw', player: 0, uid: plant.uid }); expect(state.players[0].ap).toBe(ap - 1); expect(state.cards[plant.uid].zone).toBe('discard');
    state = ref(state, { kind: 'moveCard', uid: plant.uid, zone: 'hand' }); state = applyAction(state, { type: 'play', player: 0, uid: plant.uid });
    expect(state.cards[plant.uid].stored.C).toBe(6); expect(state.cards[plant.uid].lifespanLeft).toBe(4);
  });
  it('alternates first player and resets AP; referee endRound uses the same flow', () => {
    let state = newGame(testRuleset(), 1); state = round(state); expect(state.round).toBe(2); expect(state.activePlayer).toBe(1); expect(state.players.map(p => p.ap)).toEqual([3, 3]);
    state = ref(state, { kind: 'endRound' }); expect(state.round).toBe(3); expect(state.activePlayer).toBe(0);
    const rules = testRuleset({ params: { firstPlayerAlternates: false } }); expect(round(newGame(rules, 1)).activePlayer).toBe(0);
  });
});

describe('lane: assignment, decomposition and microbes', () => {
  it('assignment on play costs two AP and later assignment costs one; occupied workers cannot reassign', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass'); let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    state = give(state, 0, 'freshwater-shrimp'); const uid = state.players[0].hand.find(u => state.cards[u].defId === 'freshwater-shrimp')!;
    state = ref(state, { kind: 'setAp', player: 0, ap: 1 });
    expect(checkAction(state, { type: 'play', player: 0, uid, targetUid: plant.uid })).toBe('Not enough AP');
    state = ref(state, { kind: 'setAp', player: 0, ap: 2 }); state = applyAction(state, { type: 'play', player: 0, uid, targetUid: plant.uid }); expect(state.players[0].ap).toBe(0); expect(state.cards[uid].working).toBe(plant.uid);
    state = ref(state, { kind: 'setAp', player: 0, ap: 3 }); expect(checkAction(state, { type: 'assign', player: 0, detritivoreUid: uid, targetUid: plant.uid })).toMatch(/already working/);
    state = round(round(state)); state = ref(state, { kind: 'setActivePlayer', player: 0 });
    const other = play(state, 1, 'emergent-plant'); state = ref(other.state, { kind: 'setStatus', uid: other.uid, status: 'dead' }); state = ref(state, { kind: 'setActivePlayer', player: 0 });
    const ap = state.players[0].ap; state = applyAction(state, { type: 'assign', player: 0, detritivoreUid: uid, targetUid: other.uid }); expect(state.lastError).toBeUndefined(); expect(state.players[0].ap).toBe(ap - 1);
  });
  it('shredders reject live plants and dead animals while collectors recycle dead animals', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass'); const shrimp = play(plant.state, 0, 'freshwater-shrimp');
    expect(checkAction(shrimp.state, { type: 'assign', player: 0, detritivoreUid: shrimp.uid, targetUid: plant.uid })).toMatch(/dead/);
    const animal = play(shrimp.state, 1, 'aquatic-worm'); let state = ref(animal.state, { kind: 'setStatus', uid: animal.uid, status: 'dead' }); state = ref(state, { kind: 'setActivePlayer', player: 0 });
    expect(checkAction(state, { type: 'assign', player: 0, detritivoreUid: shrimp.uid, targetUid: animal.uid })).toMatch(/cannot work/);
    for (const collector of ['tubifex-worm', 'caddisfly-larva']) {
      const worker = play(state, 0, collector, animal.uid); expect(round(worker.state).cards[animal.uid].stored.C).toBe(2);
    }
  });
  it('grazers work living algae and remove P only from the worker owner, floored at zero', () => {
    const algae = play(newGame(testRuleset(), 1), 1, 'green-algae'); const grazer = play(algae.state, 0, 'aquatic-grazer', algae.uid);
    let state = ref(grazer.state, { kind: 'setPool', player: 0, pool: { P: 0.5 } }); state = ref(state, { kind: 'setPool', player: 1, pool: { P: 1 } });
    state = round(state); expect(state.players[0].pool.P).toBe(0); expect(state.players[1].pool.P).toBe(1); expect(state.cards[algae.uid].stored.C).toBe(2); expect(state.cards[grazer.uid].lifespanLeft).toBe(3);
  });
  it('grazed algae at zero C is shuffled into its deck and workers freed', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'green-algae')!.growth = {};
    const algae = play(newGame(rules, 1), 1, 'green-algae'); let state = ref(algae.state, { kind: 'setCardField', uid: algae.uid, field: 'stored', value: { C: 1, N: 0, P: 0, O2: 0 } });
    const snail = play(state, 0, 'freshwater-snail', algae.uid); state = round(snail.state); expect(state.cards[algae.uid].zone).toBe('deck'); expect(state.cards[snail.uid].working).toBeUndefined();
  });
  it('microbes assist before the final biomass is recycled and can be played again', () => {
    const plant = play(newGame(testRuleset(), 1), 1, 'river-grass'); let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    state = ref(state, { kind: 'setCardField', uid: plant.uid, field: 'stored', value: { C: 3, N: 5, P: 7, O2: 0 } });
    const shrimp = play(state, 0, 'freshwater-shrimp', plant.uid); const microbe = play(shrimp.state, 0, 'nitrifying-bacteria', plant.uid); state = round(microbe.state);
    expect(state.players[0].pool.N).toBe(29.5); expect(state.cards[microbe.uid].zone).toBe('hand'); expect(state.cards[plant.uid].zone).toBe('deck'); expect(state.cards[plant.uid].stored).toEqual({ C: 0, N: 0, P: 0, O2: 0 }); expect(state.cards[shrimp.uid].working).toBeUndefined();
    const other = play(state, 1, 'emergent-plant'); state = ref(other.state, { kind: 'setStatus', uid: other.uid, status: 'dead' }); state = ref(state, { kind: 'setActivePlayer', player: 0 });
    expect(checkAction(state, { type: 'play', player: 0, uid: microbe.uid, targetUid: other.uid })).toBeNull();
  });
  it('death stops work, and unpaid workers and microbes cannot release or assist', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'river-grass'); let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    const shrimp = play(state, 0, 'freshwater-shrimp', plant.uid); const microbe = play(shrimp.state, 0, 'carbon-bacteria', plant.uid); state = ref(microbe.state, { kind: 'setPool', player: 0, pool: { O2: 0 } });
    state = round(state); expect(state.cards[shrimp.uid].status).toBe('dead'); expect(state.cards[shrimp.uid].working).toBeUndefined(); expect(state.cards[plant.uid].stored.C).toBe(6); expect(state.cards[microbe.uid].zone).toBe('discard');
  });
  it('a decomposed card goes to its owner\'s deck and each microbe on it to its own owner\'s hand', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'emergent-plant');
    let state = ref(plant.state, { kind: 'setCardField', uid: plant.uid, field: 'lifespanLeft', value: 1 }); state = round(state); expect(state.cards[plant.uid].status).toBe('dead');
    state = ref(state, { kind: 'setCardField', uid: plant.uid, field: 'stored', value: { C: 1, N: 1, P: 0, O2: 0 } });
    const microbe = play(state, 1, 'carbon-bacteria', plant.uid); const shrimp = play(microbe.state, 1, 'freshwater-shrimp', plant.uid); state = round(shrimp.state);
    expect(state.players[0].deck).toContain(plant.uid); expect(state.players[1].hand).toContain(microbe.uid); expect(state.cards[shrimp.uid]).toMatchObject({ zone: 'field', status: 'alive' });
  });
});

describe('lane: draws and events', () => {
  it('drawn events resolve with replacement, no AP, and current-round modifiers', () => {
    let state = newGame(defaultRuleset(), 17);
    const wanted = ['flood', 'heat-wave', 'river-grass'].map(id => Object.values(state.cards).find(c => c.owner === 0 && c.defId === id)!.uid);
    for (const uid of [...state.players[0].deck]) state = ref(state, { kind: 'moveCard', uid, zone: 'hand' });
    for (const uid of wanted) state = ref(state, { kind: 'moveCard', uid, zone: 'deck' });
    const ap = state.players[0].ap, before = state.players[0].hand.length; state = ref(state, { kind: 'draw', player: 0 });
    expect(state.players[0].hand).toHaveLength(before + 1); expect(state.players[0].hand).toContain(wanted[2]); expect(wanted.slice(0, 2).map(uid => state.cards[uid].zone)).toEqual(['removed', 'removed']); expect(state.players[0].ap).toBe(ap); expect(state.modifiers).toMatchObject([{ effect: 'upkeep+1', activeRound: 1 }]); expect(state.players[0].pool.P).toBe(1); expect(state.players[1].pool.P).toBe(1);
  });
  it('round-start event draws apply to the new round', () => {
    let state = newGame(defaultRuleset(), 17); const uid = Object.values(state.cards).find(c => c.owner === 0 && c.defId === 'drought')!.uid;
    for (const c of [...state.players[0].deck]) state = ref(state, { kind: 'moveCard', uid: c, zone: 'hand' });
    state = ref(state, { kind: 'moveCard', uid, zone: 'deck' }); state = round(state);
    expect(state.round).toBe(2); expect(state.modifiers.filter(m => m.source === 'drought').every(m => m.activeRound === 2)).toBe(true); expect(state.modifiers.some(m => m.source === 'drought')).toBe(true);
    state = ref(state, { kind: 'setActivePlayer', player: 0 }); state = give(state, 0, 'aquatic-plant'); const aquatic = state.players[0].hand.find(u => state.cards[u].defId === 'aquatic-plant')!;
    expect(checkAction(state, { type: 'play', player: 0, uid: aquatic })).toMatch(/Drought/);
  });
  it('event-only decks terminate opening hands and replacement draws', () => {
    const rules = testRuleset({ cards: defaultRuleset().cards.filter(c => c.kind === 'event') }); let state = newGame(rules, 2); expect(state.players[0].hand).toHaveLength(0);
    state = ref(state, { kind: 'draw', player: 0 }); expect(state.players[0].deck).toHaveLength(0); expect(Object.values(state.cards).filter(c => c.owner === 0 && c.zone === 'removed')).toHaveLength(4); expect(state.players[0].hand).toHaveLength(0);
  });
  it('upkeep uses play order and newly dead organisms can be recycled before aging', () => {
    const first = play(newGame(testRuleset(), 1), 0, 'freshwater-shrimp'); const second = play(first.state, 0, 'aquatic-worm'); let state = ref(second.state, { kind: 'setPool', player: 0, pool: { O2: 1 } });
    state = round(state); expect(state.cards[first.uid].status).toBe('alive'); expect(state.cards[second.uid].status).toBe('dead'); expect(state.players[0].pool.O2).toBe(0);
  });
});

describe('lane: fractional release and remaining event boundaries', () => {
  it('releases only fractional remaining biomass and pauses the worker for that final round', () => {
    const plant = play(newGame(testRuleset(), 1), 1, 'river-grass');
    let state = ref(plant.state, { kind: 'setStatus', uid: plant.uid, status: 'dead' });
    state = ref(state, { kind: 'setCardField', uid: plant.uid, field: 'stored', value: { C: 0.5, N: 0.5, P: 0, O2: 0 } });
    const shrimp = play(state, 0, 'freshwater-shrimp', plant.uid); const before = shrimp.state.players[0].pool.C;
    state = round(shrimp.state);
    expect(state.players[0].pool.C).toBe(before + 0.5); expect(state.cards[plant.uid].zone).toBe('deck'); expect(state.cards[shrimp.uid].lifespanLeft).toBe(4);
  });
  it('Heat Wave adds one to detritivore upkeep and expires after this round', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'heat-wave')!.copies = 1;
    const first = play(newGame(rules, 1), 0, 'freshwater-shrimp'); const second = play(first.state, 0, 'aquatic-worm');
    let state = play(second.state, 0, 'heat-wave').state;
    state = ref(state, { kind: 'setPool', player: 0, pool: { O2: 3 } }); state = round(state);
    expect(state.cards[first.uid].status).toBe('alive'); expect(state.cards[second.uid].status).toBe('dead'); expect(state.players[0].pool.O2).toBe(1); expect(state.modifiers).toHaveLength(0);
    state = round(state); expect(state.cards[first.uid].status).toBe('alive'); expect(state.players[0].pool.O2).toBe(0);
  });
  it('Drought allows algae to photosynthesize with one less O2', () => {
    const rules = testRuleset(); rules.cards.find(c => c.id === 'drought')!.copies = 1;
    const algae = play(newGame(rules, 1), 0, 'green-algae'); let state = play(algae.state, 0, 'drought').state;
    const before = state.players[0].pool.O2; state = round(state); expect(state.cards[algae.uid].stored).toEqual({ C: 3, N: 1, P: 0, O2: 0 }); expect(state.players[0].pool.O2).toBe(before + 2);
  });
});
