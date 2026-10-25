import { describe, expect, it } from 'vitest';
import { applyAction, checkAction, newGame, type GameState, type PlayerId } from '../src/engine';
import { give, play, testRuleset } from './acceptance/helpers';

function round(state: GameState): GameState {
  return applyAction(state, { type: 'referee', op: { kind: 'endRound' } });
}

function event(state: GameState, id: string): GameState {
  state = give(state, 0, id);
  const uid = state.players[0].hand.find(uid => state.cards[uid].defId === id)!;
  return applyAction(state, { type: 'play', player: 0, uid });
}

function game(): GameState {
  const rules = testRuleset();
  rules.cards.forEach(card => { if (card.kind === 'event') card.copies = 1; });
  return newGame(rules, 123);
}

function active(state: GameState, player: PlayerId = 0): GameState {
  return applyAction(state, { type: 'referee', op: { kind: 'setActivePlayer', player } });
}

describe('lane: setup and action boundaries', () => {
  it('is deterministic, copies the ruleset, and excludes events from opening hands', () => {
    const rules = game().ruleset;
    const a = newGame(rules, 10);
    expect(a).toEqual(newGame(rules, 10));
    expect(a.players.every(p => p.hand.every(uid => a.ruleset.cards.find(d => d.id === a.cards[uid].defId)?.kind !== 'event'))).toBe(true);
    rules.params.startingPool.C = 999;
    expect(a.ruleset.params.startingPool.C).toBe(10);
    expect(a.players[0].deck.length + a.players[0].hand.length).toBe(40);
  });

  it('rejects inactive players, wrong targets and actions after game over without mutating input', () => {
    const state = give(newGame(testRuleset(), 1), 1, 'river-grass');
    const uid = state.players[1].hand.find(uid => state.cards[uid].defId === 'river-grass')!;
    const snapshot = structuredClone(state);
    const next = applyAction(state, { type: 'play', player: 1, uid });
    expect(next.lastError).toBeTruthy();
    expect({ ...next, lastError: undefined }).toEqual({ ...state, lastError: undefined });
    expect(state).toEqual(snapshot);
    const won = applyAction(state, { type: 'referee', op: { kind: 'setPool', player: 0, pool: { C: 50, N: 15, P: 2 } } });
    expect(checkAction(won, { type: 'endTurn', player: 0 })).toBeTruthy();
    expect(checkAction(won, { type: 'referee', op: { kind: 'setAp', player: 0, ap: 10 } })).toBeNull();
  });

  it('keeps every indexed zone consistent after referee moves and ownership changes', () => {
    let state = game();
    const uid = state.players[0].deck[0];
    for (const zone of ['hand', 'discard', 'center', 'deck', 'field', 'attached', 'removed'] as const) {
      state = applyAction(state, { type: 'referee', op: { kind: 'moveCard', uid, zone, owner: zone === 'center' ? null : 1 } });
      expect(state.cards[uid].zone).toBe(zone);
      for (const p of state.players) for (const z of ['deck', 'hand', 'discard'] as const) {
        expect(p[z].includes(uid)).toBe(p.id === 1 && zone === z);
      }
      expect(state.center.includes(uid)).toBe(zone === 'center');
    }
  });

  it('logs an empty deck draw without changing gameplay', () => {
    const state = newGame(testRuleset({ cards: [], params: { fallenLeaves: { count: 0, stored: { C: 1, N: 0, P: 0, O2: 0 } } } }), 0);
    const next = applyAction(state, { type: 'referee', op: { kind: 'draw', player: 0 } });
    expect({ ...next, log: [] }).toEqual({ ...state, log: [] });
    expect(next.log.some(entry => /empty/i.test(entry.text))).toBe(true);
  });
});

describe('lane: environmental events', () => {
  it('Drought waits for the next Day, blocks aquatic play and photosynthesis, and Aquatic Plant ignores its first drought', () => {
    const grass = play(game(), 0, 'river-grass');
    const plant = play(grass.state, 0, 'aquatic-plant');
    let state = event(plant.state, 'drought');
    state = round(state); // settle Day 1, open Night 2
    expect(state.cards[plant.uid].flags.droughtShieldUsed).not.toBe(true);
    state = round(state); // open Day 3
    state = active(give(state, 0, 'green-algae'));
    const algae = state.players[0].hand.find(uid => state.cards[uid].defId === 'green-algae')!;
    expect(checkAction(state, { type: 'play', player: 0, uid: algae })).toBeTruthy();
    const before = state.players[0].pool.O2;
    state = round(state);
    expect(state.players[0].pool.O2).toBe(before + 3); // Grass is blocked; Aquatic Plant ignores the entire Drought.
    expect(state.cards[plant.uid].flags.droughtShieldUsed).toBe(true);
  });

  it('Heat Wave charges producers at the next Night and kills unpaid organisms', () => {
    const plant = play(game(), 0, 'riparian-tree');
    let state = event(plant.state, 'heat-wave');
    state = round(state);
    state = applyAction(state, { type: 'referee', op: { kind: 'setPool', player: 0, pool: { O2: 0 } } });
    state = round(state);
    expect(state.cards[plant.uid].status).toBe('dead');
    expect(state.log.some(entry => /died/i.test(entry.text))).toBe(true);
  });

  it('a next-Night event queued during Night waits until the following Night', () => {
    let state = round(game());
    state = active(state);
    state = event(state, 'heat-wave');
    const tree = play(state, 0, 'riparian-tree');
    state = applyAction(tree.state, { type: 'referee', op: { kind: 'setPool', player: 0, pool: { O2: 0 } } });
    state = round(state);
    expect(state.cards[tree.uid].status).toBe('alive');
    state = round(state); // Day 3 -> Night 4
    state = applyAction(state, { type: 'referee', op: { kind: 'setPool', player: 0, pool: { O2: 0 } } });
    state = round(state);
    expect(state.cards[tree.uid].status).toBe('dead');
  });

  it('Flood accepts null for an empty field and gives each player +1 P', () => {
    let state = event(game(), 'flood');
    expect(state.pendingChoice).toMatchObject({ player: 0, options: [] });
    expect(checkAction(state, { type: 'endTurn', player: 0 })).toBeTruthy();
    state = applyAction(state, { type: 'choose', player: 0, uid: null });
    expect(state.pendingChoice).toMatchObject({ player: 1, options: [] });
    state = applyAction(state, { type: 'choose', player: 1, uid: null });
    expect(state.players.map(p => p.pool.P)).toEqual([1, 1]);
    expect(state.phase).toBe('action');
  });

  it('resumes event replacement draws after Flood and resolves consecutive events without AP', () => {
    let state = game();
    const deck = state.players[0].deck;
    const flood = deck.find(uid => state.cards[uid].defId === 'flood')!;
    const heat = deck.find(uid => state.cards[uid].defId === 'heat-wave')!;
    const ordinary = deck.find(uid => state.cards[uid].defId === 'river-grass') ?? state.players[0].hand.find(uid => state.cards[uid].defId === 'river-grass')!;
    for (const uid of [...deck]) state = applyAction(state, { type: 'referee', op: { kind: 'moveCard', uid, zone: 'hand' } });
    for (const uid of [flood, heat, ordinary]) state = applyAction(state, { type: 'referee', op: { kind: 'moveCard', uid, zone: 'deck' } });
    const ap = state.players[0].ap;
    state = applyAction(state, { type: 'referee', op: { kind: 'draw', player: 0 } });
    expect(state.pendingChoice?.player).toBe(0);
    expect(state.players[0].deck).toEqual([heat, ordinary]);
    state = applyAction(state, { type: 'choose', player: 0, uid: null });
    state = applyAction(state, { type: 'choose', player: 1, uid: null });
    expect(state.pendingChoice).toBeUndefined();
    expect(state.players[0].deck).toEqual([]);
    expect(state.players[0].hand).toContain(ordinary);
    expect(state.players[0].discard).toEqual(expect.arrayContaining([flood, heat]));
    expect(state.players[0].ap).toBe(ap);
    expect(state.modifiers.some(m => m.source === 'heat-wave')).toBe(true);
  });

  it('Drought reduces land producers and its aquatic immunity is used only once', () => {
    const rules = testRuleset();
    rules.cards.forEach(card => { if (card.id === 'drought') card.copies = 2; });
    const aquatic = play(newGame(rules, 1), 0, 'aquatic-plant');
    const tree = play(aquatic.state, 0, 'riparian-tree');
    let state = event(tree.state, 'drought');
    state = round(round(state));
    let before = state.players[0].pool.O2;
    state = round(state);
    expect(state.players[0].pool.O2).toBe(before + 3 + 2);
    // Keep the organisms alive long enough to observe a second drought window.
    for (const uid of [aquatic.uid, tree.uid]) state = applyAction(state, { type: 'referee', op: { kind: 'setCardField', uid, field: 'lifespanLeft', value: 10 } });
    state = event(active(state), 'drought'); // Night 4 queues Day 5.
    state = round(state);
    before = state.players[0].pool.O2;
    state = round(state);
    expect(state.players[0].pool.O2).toBe(before + 2); // Aquatic Plant now blocked, tree reduced by 1.
  });

  it('Algal Bloom charges only its owner for one round and then expires', () => {
    const algae = play(newGame(testRuleset(), 1), 0, 'bloom-algae');
    let state = applyAction(algae.state, { type: 'referee', op: { kind: 'setPool', player: 0, pool: { P: 3 } } });
    state = round(state);
    const before = state.players[0].pool.O2;
    state = round(state);
    expect(state.players[0].pool.O2).toBe(before - 1);
    expect(state.modifiers.some(m => m.source === 'algal-bloom')).toBe(false);
  });

  it('Strong Rainfall triggers bloom for eligible algae and Freshwater Snail prevents it', () => {
    let state = play(game(), 0, 'green-algae').state;
    state = play(state, 1, 'green-algae').state;
    state = play(state, 1, 'freshwater-snail').state;
    for (const player of [0, 1] as const) state = applyAction(state, { type: 'referee', op: { kind: 'setPool', player, pool: { P: 1 } } });
    state = event(active(state), 'strong-rainfall');
    expect(state.players.map(p => p.pool.P)).toEqual([3, 3]);
    expect(state.modifiers.filter(m => m.source === 'algal-bloom').map(m => m.player)).toEqual([0]);
  });

  it.each([false, true])('Bloom Algae queues next-round upkeep unless a Freshwater Snail prevents it (snail=%s)', snail => {
    let state = game();
    if (snail) state = play(state, 0, 'freshwater-snail').state;
    state = play(state, 0, 'bloom-algae').state;
    state = applyAction(state, { type: 'referee', op: { kind: 'setPool', player: 0, pool: { P: 3 } } });
    state = round(state);
    expect(state.modifiers.some(m => m.source === 'algal-bloom')).toBe(!snail);
  });
});

describe('lane: abilities and decomposition', () => {
  it('Aquatic Worm completes processing in one round and frees itself for another assignment', () => {
    const worm = play(newGame(testRuleset(), 1), 0, 'aquatic-worm');
    let state = worm.state;
    const leaf = state.center[0];
    state = applyAction(state, { type: 'assign', player: 0, detritivoreUid: worm.uid, deadUid: leaf });
    expect(state.cards[leaf].processing?.roundsLeft).toBe(1);
    const before = state.players[0].pool.C;
    state = round(state);
    expect(state.cards[leaf].status).toBe('processed');
    expect(state.players[0].pool.C).toBe(before + 1);
    state = active(state);
    expect(checkAction(state, { type: 'assign', player: 0, detritivoreUid: worm.uid, deadUid: state.center[1] })).toBeNull();
  });

  it.each(['nitrogen-bacteria', 'phosphorus-bacteria'])('%s gets its bonus only once per game and decomposes at most once per round', id => {
    const rules = testRuleset();
    const microbe = play(newGame(rules, 1), 0, id);
    let state = microbe.state;
    const nutrient = id === 'nitrogen-bacteria' ? 'N' : 'P';
    const before = state.players[0].pool[nutrient];
    for (let i = 0; i < 2; i++) {
      const leaf = state.center[i];
      state = applyAction(state, { type: 'referee', op: { kind: 'setStatus', uid: leaf, status: 'processed' } });
      state = active(state);
      state = applyAction(state, { type: 'decompose', player: 0, microbeUid: microbe.uid, detritusUid: leaf });
      expect(state.lastError).toBeUndefined();
      expect(state.players[0].pool[nutrient]).toBe(before + 1);
      expect(checkAction(state, { type: 'decompose', player: 0, microbeUid: microbe.uid, detritusUid: state.center[2] })).toBeTruthy();
      state = round(state);
    }
  });

  it('specialization requires two marks, adds lifespan, allows two eats and awards carbon', () => {
    const eater = play(newGame(testRuleset(), 1), 0, 'caterpillar');
    let state = give(eater.state, 0, 'consumer-specialization');
    const adaptation = state.players[0].hand.find(uid => state.cards[uid].defId === 'consumer-specialization')!;
    expect(checkAction(state, { type: 'play', player: 0, uid: adaptation, targetUid: eater.uid })).toBeTruthy();
    state = applyAction(state, { type: 'referee', op: { kind: 'setCardField', uid: eater.uid, field: 'marks', value: 2 } });
    state = applyAction(state, { type: 'play', player: 0, uid: adaptation, targetUid: eater.uid });
    expect(state.cards[eater.uid]).toMatchObject({ specialized: true, lifespanLeft: 5 });
    const prey1 = play(state, 1, 'river-grass');
    const prey2 = play(prey1.state, 1, 'leaf-litter-plant');
    state = active(prey2.state);
    const before = state.players[0].pool.C;
    for (const preyUid of [prey1.uid, prey2.uid]) state = applyAction(state, { type: 'eat', player: 0, eaterUid: eater.uid, preyUid });
    expect(state.lastError).toBeUndefined();
    expect(state.cards[eater.uid].eatsThisRound).toBe(2);
    expect(state.players[0].pool.C).toBe(before + 2);
  });

  it('gains specialization marks from adapted producers and rejects adaptations on enemy organisms', () => {
    const eater = play(newGame(testRuleset(), 1), 0, 'caterpillar');
    const plant = play(eater.state, 1, 'river-grass');
    const adapted = play(plant.state, 1, 'oxygen-rich-adaptation', plant.uid);
    let state = active(adapted.state);
    state = give(state, 0, 'protected-adaptation');
    const uid = state.players[0].hand.find(uid => state.cards[uid].defId === 'protected-adaptation')!;
    expect(checkAction(state, { type: 'play', player: 0, uid, targetUid: plant.uid })).toBeTruthy();
    state = applyAction(state, { type: 'eat', player: 0, eaterUid: eater.uid, preyUid: plant.uid });
    expect(state.cards[eater.uid].marks).toBe(1);
  });

  it('Protected prevents eating but not age death', () => {
    const plant = play(newGame(testRuleset(), 1), 0, 'leaf-litter-plant');
    const adapted = play(plant.state, 0, 'protected-adaptation', plant.uid);
    const eater = play(adapted.state, 1, 'caterpillar');
    expect(checkAction(eater.state, { type: 'eat', player: 1, eaterUid: eater.uid, preyUid: plant.uid })).toBeTruthy();
    let state = applyAction(eater.state, { type: 'referee', op: { kind: 'setCardField', uid: plant.uid, field: 'lifespanLeft', value: 1 } });
    state = round(state);
    expect(state.cards[plant.uid].status).toBe('dead');
  });

  it('Oxygen-Rich and P-Accumulator act at photosynthesis, and Diatom returns the stored P plus its own bonus', () => {
    const diatom = play(newGame(testRuleset(), 1), 0, 'diatom');
    const oxygen = play(diatom.state, 0, 'oxygen-rich-adaptation', diatom.uid);
    let state = play(oxygen.state, 0, 'p-accumulator-adaptation', diatom.uid).state;
    const before = state.players[0].pool.O2;
    state = round(state);
    expect(state.players[0].pool.O2).toBe(before + 4);
    expect(state.cards[diatom.uid].stored.P).toBe(1);
    state = applyAction(state, { type: 'referee', op: { kind: 'setStatus', uid: diatom.uid, status: 'processed' } });
    state = play(state, 1, 'decomposer-fungus', diatom.uid).state;
    expect(state.players[1].pool.P).toBe(2);
  });

  it.each(['freshwater-snail', 'aquatic-grazer'])('%s grazes algae and transfers stored nutrients', id => {
    const algae = play(newGame(testRuleset(), 1), 1, 'green-algae');
    const grazer = play(algae.state, 0, id);
    let state = applyAction(grazer.state, { type: 'referee', op: { kind: 'setPool', player: 1, pool: { P: 2 } } });
    const before = state.players[0].pool.C;
    state = applyAction(state, { type: 'eat', player: 0, eaterUid: grazer.uid, preyUid: algae.uid });
    expect(state.lastError).toBeUndefined();
    expect(state.players[0].pool.C).toBe(before + (id === 'freshwater-snail' ? 1 : 0));
    expect(state.players[1].pool.P).toBe(id === 'aquatic-grazer' ? 1 : 2);
    expect(state.cards[algae.uid].zone).toBe('attached');
  });

  it('Tubifex adds its processing carbon and Chironomid can collect processed detritus', () => {
    const worm = play(newGame(testRuleset(), 1), 0, 'tubifex-worm');
    let state = worm.state;
    const leaf = state.center[0];
    state = applyAction(state, { type: 'assign', player: 0, detritivoreUid: worm.uid, deadUid: leaf });
    const before = state.players[0].pool.C;
    state = round(round(state));
    expect(state.players[0].pool.C).toBe(before + 2);
    const larva = play(state, 0, 'chironomid-larva');
    state = applyAction(larva.state, { type: 'assign', player: 0, detritivoreUid: larva.uid, deadUid: leaf });
    expect(state.lastError).toBeUndefined();
    expect(state.players[0].pool.N).toBe(20);
    expect(state.cards[leaf].status).toBe('processed');
    state = applyAction(state, { type: 'assign', player: 0, detritivoreUid: larva.uid, deadUid: leaf });
    expect(state.lastError).toBeUndefined();
    expect(state.players[0].pool.N).toBe(21); // The draft places no per-card collection limit; each assignment costs AP.
  });

  it('Green Algae gains carbon at photosynthesis and upkeep follows play order', () => {
    const algae = play(newGame(testRuleset(), 1), 0, 'green-algae');
    const before = algae.state.players[0].pool.C;
    expect(round(algae.state).players[0].pool.C).toBe(before + 1);
    const first = play(newGame(testRuleset(), 1), 0, 'caterpillar');
    const second = play(first.state, 0, 'grasshopper');
    let state = applyAction(second.state, { type: 'referee', op: { kind: 'setPool', player: 0, pool: { O2: 1 } } });
    state = round(state);
    expect(state.cards[first.uid].status).toBe('alive');
    expect(state.cards[second.uid].status).toBe('dead');
    expect(state.players[0].pool.O2).toBe(0);
  });
});
