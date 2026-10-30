import type { Ruleset, GameState, Action, CardInstance, PlayerId, RefereeOp, Modifier, Pool } from './types';
import { abilities, algalBloom, createCard, definition, die, gain, living, move, note, shuffle } from './abilities';
export * from './types';

/** Build a fresh game with seeded, shuffled decks and starting pools/AP. Opening events are shuffled back
 *  and replaced. Round 1 starts with player 0; never throws for a valid Ruleset. Each player uses every
 *  CardDef's copies of the same deck list. */
export function newGame(ruleset: Ruleset, seed: number, names?: [string, string]): GameState {
  const players = ([0, 1] as const).map(id => ({
    id, name: names?.[id] ?? `Player ${id + 1}`, pool: { ...ruleset.params.startingPool },
    ap: ruleset.params.apPerTurn, deck: [] as string[], hand: [] as string[], discard: [] as string[],
  }));
  const state: GameState = {
    ruleset: structuredClone(ruleset), seed, rngState: seed >>> 0, round: 1,
    firstPlayer: 0, activePlayer: 0, phase: 'action', cards: {}, modifiers: [], drawnEvents: [], log: [],
    players: [players[0], players[1]],
  };
  for (const player of state.players) {
    for (const def of state.ruleset.cards) {
      for (let copy = 0; copy < def.copies; copy++) createCard(state, def.id, player.id, 'deck');
    }
    shuffle(state, player.deck);
    const events: CardInstance[] = [];
    while (player.hand.length < ruleset.params.startingHand && player.deck.length) {
      const card = state.cards[player.deck[0]];
      if (definition(state, card).kind === 'event') {
        move(state, card, 'removed'); events.push(card);
        note(state, `${player.name} replaces an opening ${definition(state, card).name}`);
      } else {
        move(state, card, 'hand');
        note(state, `${player.name} draws ${definition(state, card).name} (opening hand)`);
      }
    }
    for (const card of events) move(state, card, 'deck');
    if (events.length) shuffle(state, player.deck);
  }
  note(state, `Game starts; ${state.players[0].name} acts first`);
  return state;
}

/** Return null when action is legal, otherwise a short human-readable reason. Pure; the UI uses this
 *  same validation path to enable controls as applyAction uses before changing state. */
export function checkAction(state: GameState, action: Action): string | null {
  if (action.type === 'referee') return null;
  if (state.phase === 'gameOver') return 'The game is over';
  if (action.player !== state.activePlayer) return 'It is not your turn';
  const player = state.players[action.player], params = state.ruleset.params;
  if (action.type === 'endTurn') return null;
  if (action.type === 'play' || action.type === 'discardDraw') {
    const card = state.cards[action.uid];
    if (!card || card.zone !== 'hand' || card.owner !== action.player || !player.hand.includes(card.uid)) return 'Choose a card in your hand';
    if (action.type === 'discardDraw') return player.ap >= params.discardDrawApCost ? null : 'Not enough AP';
    const def = definition(state, card);
    if (def.kind === 'event') return null;
    const ap = params.playApCost + (def.kind === 'detritivore' && action.targetUid ? params.detritivoreAssignApCost : 0);
    if (player.ap < ap) return 'Not enough AP';
    if (player.pool.C < def.cost.C || player.pool.N < def.cost.N || player.pool.P < (def.cost.P ?? 0) || player.pool.O2 < (def.cost.O2 ?? 0)) return 'Not enough nutrients';
    if (def.tags.includes('aquatic') && modifiers(state, 'noAquaticPlay', action.player).length) return 'Drought prevents playing aquatic cards this round';
    const target = action.targetUid ? state.cards[action.targetUid] : undefined;
    if (def.kind === 'microbe') return target?.zone === 'field' && target.status === 'dead' ? null : 'Choose a dead card in the field';
    if (action.targetUid) return def.kind === 'detritivore' ? assignReason(state, card, target) : 'This card does not take a target';
    return null;
  }
  const worker = state.cards[action.detritivoreUid];
  if (!isAlive(worker) || worker!.owner !== action.player || definition(state, worker!).kind !== 'detritivore') return 'Choose your own living detritivore';
  if (player.ap < params.detritivoreAssignApCost) return 'Not enough AP';
  return assignReason(state, worker!, state.cards[action.targetUid]);
}

/** Apply an action without mutating state. Illegal actions change only lastError. Legal actions clear
 *  lastError, log their effects, check victory and, after both turns, resolve Appendix A's Environmental
 *  Phase. Referee ops bypass validation, are logged as Referee, and still check victory. */
export function applyAction(state: GameState, action: Action): GameState {
  const error = checkAction(state, action), next = structuredClone(state);
  if (error) { next.lastError = error; return next; }
  delete next.lastError;
  const params = next.ruleset.params;
  switch (action.type) {
    case 'referee': referee(next, action.op); break;
    case 'play': {
      const card = next.cards[action.uid], def = definition(next, card);
      const target = action.targetUid ? next.cards[action.targetUid] : undefined;
      note(next, `${next.players[action.player].name} plays ${def.name}`);
      // A played event waits out its rounds like a drawn one, then goes to the discard.
      if (def.kind === 'event') { resolveEvent(next, card); break; }
      const ap = params.playApCost + (def.kind === 'detritivore' && target ? params.detritivoreAssignApCost : 0);
      next.players[action.player].ap -= ap;
      const cost: Partial<Pool> = { C: -def.cost.C, N: -def.cost.N };
      if (def.cost.P) cost.P = -def.cost.P;
      if (def.cost.O2) cost.O2 = -def.cost.O2;
      gain(next, action.player, cost, `${def.name} cost; ${ap} AP`);
      card.stored = { C: 0, N: 0, P: 0, O2: 0, ...def.biomass };
      card.flags = {}; delete card.status; delete card.lifespanLeft;
      if (def.kind === 'microbe') {
        move(next, card, 'attached'); card.attachedTo = target!.uid;
        note(next, `${def.name} attaches to ${definition(next, target!).name}`);
      } else {
        move(next, card, 'field'); card.status = 'alive'; card.lifespanLeft = def.lifespan;
        card.flags.playOrder = 1 + Math.max(0, ...Object.values(next.cards).map(c => Number(c.flags.playOrder) || 0));
      }
      if (target && def.kind === 'detritivore') assign(next, card, target);
      break;
    }
    case 'discardDraw': {
      const card = next.cards[action.uid]; next.players[action.player].ap -= params.discardDrawApCost;
      move(next, card, 'discard'); note(next, `${next.players[action.player].name} discards ${definition(next, card).name} and draws (${params.discardDrawApCost} AP)`);
      draw(next, action.player); break;
    }
    case 'assign':
      next.players[action.player].ap -= params.detritivoreAssignApCost;
      assign(next, next.cards[action.detritivoreUid], next.cards[action.targetUid]); break;
    case 'endTurn':
      note(next, `${next.players[action.player].name} ends their turn`);
      next.players[action.player].ap = 0; next.endedTurns ??= [];
      if (!next.endedTurns.includes(action.player)) next.endedTurns.push(action.player);
      if (next.endedTurns.length === 2) environment(next); else next.activePlayer = action.player === 0 ? 1 : 0;
      break;
  }
  winCheck(next);
  return next;
}

function isAlive(card: CardInstance | undefined): boolean { return card?.zone === 'field' && card.status === 'alive'; }

function modifiers(state: GameState, effect: Modifier['effect'], player: PlayerId): Modifier[] {
  return state.modifiers.filter(m => m.effect === effect && (m.player === undefined || m.player === player) && m.activeRound === state.round);
}

function assignReason(state: GameState, worker: CardInstance, target: CardInstance | undefined): string | null {
  if (worker.working) return 'This detritivore is already working a card';
  if (!target || target.zone !== 'field' || target === worker) return 'Choose a card in the field';
  const def = definition(state, worker);
  if (target.status !== 'dead' && !(target.status === 'alive' && def.eatsAlive)) return 'This detritivore requires a dead card';
  if (!def.canEat?.some(tag => definition(state, target).tags.includes(tag))) return `${def.name} cannot work ${definition(state, target).name}`;
  return null;
}

function assign(state: GameState, worker: CardInstance, target: CardInstance): void {
  worker.working = target.uid;
  note(state, `${definition(state, worker).name} starts working ${definition(state, target).name}`);
}

const microbesOn = (state: GameState, card: CardInstance) =>
  Object.values(state.cards).filter(c => c.zone === 'attached' && c.attachedTo === card.uid);

/** UPDATE-3: a fully decomposed card goes to its owner's discard and its microbes return to their owners'
 *  hands; biomass left on it is lost. */
function recycle(state: GameState, card: CardInstance): void {
  for (const microbe of microbesOn(state, card)) {
    move(state, microbe, 'hand'); note(state, `${definition(state, microbe).name} returns to ${state.players[microbe.owner].name}'s hand`);
  }
  card.stored = { C: 0, N: 0, P: 0, O2: 0 };
  move(state, card, 'discard');
  note(state, `${definition(state, card).name} is fully decomposed and goes to ${state.players[card.owner].name}'s discard`);
}

/** A wild event affects its drawer now, then waits in 'removed' until its last affected round ends. */
function resolveEvent(state: GameState, card: CardInstance): void {
  const def = definition(state, card);
  move(state, card, 'removed');
  card.flags.activeUntil = state.round + (def.lifespan ?? 1) - 1;
  state.drawnEvents.push({ round: state.round, player: card.owner, uid: card.uid });
  abilities[def.id]?.event?.(state, card);
}

/** Draw one non-event, resolving drawn events without AP and using the state RNG to recycle discard.
 *  Drawn events wait in 'removed' while they last, so an event-only deck always terminates. */
function draw(state: GameState, playerId: PlayerId): void {
  const player = state.players[playerId];
  while (true) {
    if (!player.deck.length && player.discard.length) {
      for (const uid of [...player.discard]) move(state, state.cards[uid], 'deck');
      shuffle(state, player.deck); note(state, `${player.name} reshuffles discard into deck`);
    }
    if (!player.deck.length) { note(state, `${player.name} skips a draw: deck and discard are empty`); break; }
    const card = state.cards[player.deck[0]], def = definition(state, card);
    note(state, `${player.name} draws ${def.name}`);
    if (def.kind !== 'event') { move(state, card, 'hand'); break; }
    note(state, `${def.name} resolves immediately for ${player.name} (no AP); draw a replacement`);
    resolveEvent(state, card);
  }
}

/** Resolve production, bloom, upkeep, decomposition, aging, then next-round reset and draws (Appendix A). */
function environment(state: GameState): void {
  note(state, 'Environmental Phase begins');
  for (const card of living(state).filter(c => definition(state, c).kind === 'producer')) {
    const def = definition(state, card), player = card.owner;
    if (def.tags.includes('aquatic') && def.tags.includes('plant') && modifiers(state, 'noAquaticPhotosynthesis', player).length) {
      note(state, `${def.name} cannot photosynthesize during Drought`); continue;
    }
    for (const key of Object.keys(def.growth ?? {}) as (keyof Pool)[]) card.stored[key] += def.growth![key]!;
    note(state, `${def.name} grows biomass (${Object.entries(def.growth ?? {}).map(([k, v]) => `+${v} ${k}`).join(', ') || 'no growth'})`);
    const produced = { ...def.yield, O2: Math.max(0, (def.yield?.O2 ?? 0) - modifiers(state, 'producerO2-1', player).length) };
    gain(state, player, produced, `${def.name} photosynthesis`);
  }
  for (const player of state.players) algalBloom(state, player.id);
  const organisms = living(state).sort((a, b) => Number(a.flags.playOrder ?? 0) - Number(b.flags.playOrder ?? 0));
  for (const card of organisms) {
    const def = definition(state, card), player = card.owner;
    const cost = (def.kind === 'producer' ? 0 : def.o2PerRound ?? 0) + modifiers(state, 'upkeep+1', player).length;
    if (state.players[player].pool.O2 < cost) die(state, card, `could not pay ${cost} O2 upkeep`);
    else if (cost) gain(state, player, { O2: -cost }, `${def.name} upkeep`);
  }
  // UPDATE-2: microbes pay O2 every round they sit on a card; Heat Wave adds only to organisms.
  for (const microbe of Object.values(state.cards).filter(c => c.zone === 'attached')) {
    const def = definition(state, microbe), cost = def.o2PerRound ?? 0;
    if (state.players[microbe.owner].pool.O2 < cost) {
      move(state, microbe, 'discard'); note(state, `${state.players[microbe.owner].name}'s ${def.name} could not pay ${cost} O2 upkeep and is discarded`);
    } else if (cost) gain(state, microbe.owner, { O2: -cost }, `${def.name} upkeep`);
  }
  const worked = new Set<string>();
  for (const target of Object.values(state.cards).filter(c => c.zone === 'field')) {
    const workers = living(state).filter(c => c.working === target.uid), microbes = microbesOn(state, target);
    if (!workers.length && !microbes.length) continue;
    const carbon: [number, number] = [0, 0];
    let acted = false;
    const paired = workers.some(c => definition(state, c).subtype === 'shredder');
    for (const worker of workers) {
      const def = definition(state, worker);
      const release = { ...def.release };
      if (def.subtype === 'collector' && paired) { release.C = (release.C ?? 0) + 1; release.N = (release.N ?? 0) + 1; }
      const delta: Partial<Pool> = {};
      for (const key of Object.keys(release) as (keyof Pool)[]) {
        const amount = Math.min(release[key]!, target.stored[key]);
        target.stored[key] -= amount; delta[key] = amount;
      }
      if (!Object.values(delta).some(n => n > 0)) continue;
      acted = true; worked.add(worker.uid); carbon[worker.owner] += delta.C ?? 0;
      gain(state, worker.owner, delta, `${def.name} releases biomass from ${definition(state, target).name}`);
      abilities[def.id]?.onWork?.(state, worker, target);
    }
    // UPDATE-2.1: microbes decompose their card every round until it is gone; with a detritivore they double
    // instead of releasing their own amount. Either way they eat part of the card's remaining biomass.
    for (const microbe of microbes) {
      const def = definition(state, microbe), ability = abilities[microbe.defId];
      if (acted) ability?.onAssist?.(state, microbe, target, carbon);
      else if (ability?.onAlone) ability.onAlone(state, microbe, target);
      else {
        const delta: Partial<Pool> = {};
        for (const key of Object.keys(def.release ?? {}) as (keyof Pool)[]) {
          delta[key] = Math.min(def.release![key]!, target.stored[key]); target.stored[key] -= delta[key]!;
        }
        if (Object.values(delta).some(n => n > 0)) gain(state, microbe.owner, delta, `${def.name} releases biomass from ${definition(state, target).name}`);
      }
      const eaten: string[] = [];
      for (const key of Object.keys(def.consumes ?? {}) as (keyof Pool)[]) {
        const amount = Math.min(def.consumes![key]!, target.stored[key]);
        target.stored[key] -= amount; if (amount > 0) eaten.push(`${amount} ${key}`);
      }
      if (eaten.length) note(state, `${def.name} consumes ${eaten.join(', ')} of ${definition(state, target).name}'s biomass`);
    }
    if (target.stored.C <= 0) {
      if (isAlive(target)) die(state, target, 'biomass depleted by grazing');
      recycle(state, target);
    }
  }
  for (const card of living(state)) {
    if (worked.has(card.uid)) { note(state, `${definition(state, card).name} does not age: released nutrients this round`); continue; }
    if (card.lifespanLeft !== undefined) {
      card.lifespanLeft--; note(state, `${definition(state, card).name}: ${card.lifespanLeft} lifespan remaining`);
      if (card.lifespanLeft <= 0) die(state, card, 'lifespan ended');
    }
  }
  state.round++;
  state.modifiers = state.modifiers.filter(m => m.activeRound >= state.round); state.endedTurns = [];
  // UPDATE-3: a wild event happens once; it lasts its rounds, then goes to its owner's discard. Saying when it
  // ends keeps back-to-back Droughts reading as two events rather than one long one.
  for (const player of state.players) {
    const events = Object.values(state.cards).filter(c => c.owner === player.id && c.zone === 'removed' && definition(state, c).kind === 'event' &&
      Number(c.flags.activeUntil ?? 0) < state.round);
    for (const card of events) {
      move(state, card, 'discard');
      note(state, `${definition(state, card).name} ends for ${player.name} after round ${state.round - 1}; put in their discard`);
    }
  }
  if (state.ruleset.params.firstPlayerAlternates) state.firstPlayer = state.firstPlayer === 0 ? 1 : 0;
  state.activePlayer = state.firstPlayer;
  for (const player of state.players) player.ap = state.ruleset.params.apPerTurn;
  note(state, `${state.players[state.activePlayer].name} acts first; AP resets to ${state.ruleset.params.apPerTurn}`);
  for (const player of state.players) for (let i = 0; i < state.ruleset.params.drawPerRound; i++) draw(state, player.id);
}

function referee(state: GameState, op: RefereeOp): void {
  note(state, `Referee: ${JSON.stringify(op)}`);
  switch (op.kind) {
    case 'setPool': Object.assign(state.players[op.player].pool, op.pool); break;
    case 'setAp': state.players[op.player].ap = op.ap; break;
    case 'setStatus': {
      const card = state.cards[op.uid];
      if (card) { if (op.status === 'dead') die(state, card, 'referee'); card.status = op.status; if (op.status === 'dead') delete card.working; }
      break;
    }
    case 'moveCard': { const card = state.cards[op.uid]; if (card) move(state, card, op.zone, op.owner); break; }
    case 'setCardField': {
      const card = state.cards[op.uid];
      if (card) { if (op.field === 'stored' && typeof op.value !== 'number') card.stored = { ...op.value }; else if (op.field !== 'stored' && typeof op.value === 'number') card[op.field] = op.value; }
      break;
    }
    case 'draw': draw(state, op.player); break;
    case 'setActivePlayer': state.activePlayer = op.player; break;
    case 'endRound': environment(state); break;
  }
}

function winCheck(state: GameState): void {
  const threshold = state.ruleset.params.winThreshold;
  const winners = state.players.filter(p => p.pool.C >= threshold.C && p.pool.N >= threshold.N && p.pool.P >= threshold.P);
  if (winners.length) {
    const winner = winners.length === 2 ? 'draw' : winners[0].id;
    if (state.phase !== 'gameOver' || state.winner !== winner) note(state, winner === 'draw' ? 'Both players reach the threshold: draw' : `${state.players[winner].name} wins`);
    state.winner = winner; state.phase = 'gameOver';
  } else if (state.phase === 'gameOver') { delete state.winner; state.phase = 'action'; }
}
