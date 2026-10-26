import type { Ruleset, GameState, Action, CardInstance, PlayerId, RefereeOp, Modifier, Pool } from './types';
import { abilities, algalBloom, createCard, definition, die, gain, living, move, note, shuffle } from './abilities';
export * from './types';

/** Build a fresh game with seeded, shuffled decks and starting pools/AP. Opening events are shuffled back
 *  and replaced. Evolution off excludes adaptation cards entirely. Round 1 starts with player 0; never
 *  throws for a valid Ruleset. Each player uses every CardDef's copies of the same deck list. */
export function newGame(ruleset: Ruleset, seed: number, names?: [string, string]): GameState {
  const players = ([0, 1] as const).map(id => ({
    id, name: names?.[id] ?? `Player ${id + 1}`, pool: { ...ruleset.params.startingPool },
    ap: ruleset.params.apPerTurn, deck: [] as string[], hand: [] as string[], discard: [] as string[],
  }));
  const state: GameState = {
    ruleset: structuredClone(ruleset), seed, rngState: seed >>> 0, round: 1,
    firstPlayer: 0, activePlayer: 0, phase: 'action', cards: {}, modifiers: [], log: [],
    players: [players[0], players[1]],
  };
  for (const player of state.players) {
    for (const def of state.ruleset.cards) {
      if (def.kind === 'adaptation' && !ruleset.params.evolutionEnabled) continue;
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
    if (def.kind === 'adaptation' && !params.evolutionEnabled) return 'Evolution is off';
    if (def.kind === 'event') return null;
    const ap = params.playApCost + (def.kind === 'detritivore' && action.targetUid ? params.detritivoreAssignApCost : 0);
    if (player.ap < ap) return 'Not enough AP';
    if (player.pool.C < def.cost.C || player.pool.N < def.cost.N || player.pool.O2 < (def.cost.O2 ?? 0)) return 'Not enough nutrients';
    if (def.tags.includes('aquatic') && modifiers(state, 'noAquaticPlay', action.player).length) return 'Drought prevents playing aquatic cards this round';
    const target = action.targetUid ? state.cards[action.targetUid] : undefined;
    if (def.kind === 'adaptation') {
      if (!isAlive(target) || target!.owner !== action.player) return 'Choose your own living organism';
      const required = abilities[def.id]?.adaptationTarget;
      if (required && required !== 'organism' && required !== definition(state, target!).kind) return `This adaptation requires a ${required}`;
      if (target!.adaptations.includes(def.id)) return 'This adaptation is already attached';
      if (def.id === 'consumer-specialization' && (target!.marks < 2 || target!.specialized)) return 'Specialization requires an unspecialized consumer with two marks';
      return null;
    }
    if (def.kind === 'microbe') return target?.zone === 'field' && target.status === 'dead' ? null : 'Choose a dead card in the field';
    if (action.targetUid) return def.kind === 'detritivore' ? assignReason(state, card, target) : 'This card does not take a target';
    return null;
  }
  if (action.type === 'assign') {
    const worker = state.cards[action.detritivoreUid];
    if (!isAlive(worker) || worker!.owner !== action.player || definition(state, worker!).kind !== 'detritivore') return 'Choose your own living detritivore';
    if (player.ap < params.detritivoreAssignApCost) return 'Not enough AP';
    return assignReason(state, worker!, state.cards[action.targetUid]);
  }
  const eater = state.cards[action.eaterUid], prey = state.cards[action.preyUid];
  if (!isAlive(eater) || eater!.owner !== action.player || definition(state, eater!).kind !== 'consumer') return 'Choose your own living consumer';
  if (!isAlive(prey) || prey === eater) return 'Choose another living organism as prey';
  if (prey!.adaptations.includes('protected-adaptation')) return 'Protected organisms cannot be eaten';
  if (!definition(state, eater!).canEat?.some(tag => definition(state, prey!).tags.includes(tag))) return `${definition(state, eater!).name} cannot eat ${definition(state, prey!).name}`;
  const limit = eater!.specialized ? 2 : params.maxEatsPerRound;
  if (eater!.eatsThisRound >= limit) return 'This organism has eaten its limit this round';
  return player.ap >= params.eatApCost ? null : 'Not enough AP';
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
      if (def.kind === 'event') { move(next, card, 'discard'); abilities[def.id]?.event?.(next, card); break; }
      const ap = params.playApCost + (def.kind === 'detritivore' && target ? params.detritivoreAssignApCost : 0);
      next.players[action.player].ap -= ap;
      gain(next, action.player, { C: -def.cost.C, N: -def.cost.N, O2: -(def.cost.O2 ?? 0) }, `${def.name} cost; ${ap} AP`);
      card.stored = { C: 0, N: 0, P: 0, O2: 0, ...def.biomass };
      card.adaptations = []; card.marks = 0; card.eatsThisRound = 0; card.flags = {};
      delete card.specialized; delete card.status; delete card.lifespanLeft;
      if (def.kind === 'adaptation' || def.kind === 'microbe') {
        move(next, card, 'attached'); card.attachedTo = target!.uid;
        if (def.kind === 'adaptation') target!.adaptations.push(def.id);
        note(next, `${def.name} attaches to ${definition(next, target!).name}`);
      } else {
        move(next, card, 'field'); card.status = 'alive'; card.lifespanLeft = def.lifespan;
        card.flags.playOrder = 1 + Math.max(0, ...Object.values(next.cards).map(c => Number(c.flags.playOrder) || 0));
      }
      abilities[def.id]?.onPlay?.(next, card, target);
      if (target && def.kind === 'detritivore') assign(next, card, target);
      break;
    }
    case 'discardDraw': {
      const card = next.cards[action.uid]; next.players[action.player].ap -= params.discardDrawApCost;
      move(next, card, 'discard'); note(next, `${next.players[action.player].name} discards ${definition(next, card).name} and draws (${params.discardDrawApCost} AP)`);
      draw(next, action.player); break;
    }
    case 'eat': {
      const eater = next.cards[action.eaterUid], prey = next.cards[action.preyUid];
      next.players[action.player].ap -= params.eatApCost; eater.eatsThisRound++;
      for (const key of Object.keys(eater.stored) as (keyof Pool)[]) { eater.stored[key] += prey.stored[key]; prey.stored[key] = 0; }
      if (params.evolutionEnabled) { eater.marks++; note(next, `${definition(next, eater).name} gains a specialization mark (${eater.marks})`); }
      if (eater.specialized) gain(next, action.player, { C: 1 }, 'Consumer Specialization');
      move(next, prey, 'attached'); prey.attachedTo = eater.uid; prey.status = 'dead';
      note(next, `${definition(next, eater).name} eats ${definition(next, prey).name}; biomass transfers (${params.eatApCost} AP)`); break;
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

/** A decomposed host and everything under it go to their respective owners' discards; remaining biomass is lost. */
function discardTree(state: GameState, card: CardInstance): void {
  for (const child of Object.values(state.cards).filter(c => c.attachedTo === card.uid && c.zone === 'attached')) discardTree(state, child);
  card.stored = { C: 0, N: 0, P: 0, O2: 0 };
  move(state, card, 'discard');
  note(state, `${definition(state, card).name} goes to ${state.players[card.owner].name}'s discard`);
}

/** Draw one non-event, resolving drawn events without AP and using the state RNG to recycle discard.
 *  Events drawn in this chain are set aside until it ends, so an event-only deck always terminates. */
function draw(state: GameState, playerId: PlayerId): void {
  const player = state.players[playerId], events: CardInstance[] = [];
  while (true) {
    if (!player.deck.length && player.discard.length) {
      for (const uid of [...player.discard]) move(state, state.cards[uid], 'deck');
      shuffle(state, player.deck); note(state, `${player.name} reshuffles discard into deck`);
    }
    if (!player.deck.length) { note(state, `${player.name} skips a draw: deck and discard are empty`); break; }
    const card = state.cards[player.deck[0]], def = definition(state, card);
    note(state, `${player.name} draws ${def.name}`);
    if (def.kind !== 'event') { move(state, card, 'hand'); break; }
    move(state, card, 'removed'); events.push(card);
    note(state, `${def.name} resolves immediately (no AP); draw a replacement`);
    abilities[def.id]?.event?.(state, card);
  }
  for (const card of events) move(state, card, 'discard');
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
    const produced = { ...def.yield, O2: Math.max(0, (def.yield?.O2 ?? 0) + (card.adaptations.includes('oxygen-rich-adaptation') ? 2 : 0) - modifiers(state, 'producerO2-1', player).length) };
    gain(state, player, produced, `${def.name} photosynthesis`);
    for (const id of card.adaptations) abilities[id]?.onPhotosynthesis?.(state, card);
  }
  for (const player of state.players) algalBloom(state, player.id);
  const organisms = living(state).sort((a, b) => Number(a.flags.playOrder ?? 0) - Number(b.flags.playOrder ?? 0));
  for (const card of organisms) {
    const def = definition(state, card), player = card.owner;
    const cost = (def.kind === 'producer' ? 0 : def.o2PerRound ?? 0) + modifiers(state, 'upkeep+1', player).length;
    if (state.players[player].pool.O2 < cost) die(state, card, `could not pay ${cost} O2 upkeep`);
    else if (cost) gain(state, player, { O2: -cost }, `${def.name} upkeep`);
  }
  const released = new Set<string>();
  for (const target of Object.values(state.cards).filter(c => c.zone === 'field')) {
    const workers = living(state).filter(c => c.working === target.uid);
    if (!workers.length) continue;
    const carbon: [number, number] = [0, 0]; let acted = false;
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
      acted = true; released.add(worker.uid); carbon[worker.owner] += delta.C ?? 0;
      gain(state, worker.owner, delta, `${def.name} releases biomass from ${definition(state, target).name}`);
      abilities[def.id]?.onWork?.(state, worker, target);
    }
    if (acted) {
      for (const microbe of Object.values(state.cards).filter(c => c.zone === 'attached' && c.attachedTo === target.uid && definition(state, c).kind === 'microbe')) {
        abilities[microbe.defId]?.onAssist?.(state, microbe, target, carbon);
        move(state, microbe, 'hand'); note(state, `${definition(state, microbe).name} returns to hand after assisting`);
      }
    }
    if (target.stored.C <= 0) {
      if (isAlive(target)) die(state, target, 'biomass depleted by grazing');
      discardTree(state, target);
    }
  }
  for (const card of living(state)) {
    if (released.has(card.uid)) { note(state, `${definition(state, card).name} does not age: released nutrients this round`); continue; }
    if (card.lifespanLeft !== undefined) {
      card.lifespanLeft--; note(state, `${definition(state, card).name}: ${card.lifespanLeft} lifespan remaining`);
      if (card.lifespanLeft <= 0) die(state, card, 'lifespan ended');
    }
  }
  state.round++; state.modifiers = state.modifiers.filter(m => m.activeRound >= state.round); state.endedTurns = [];
  if (state.ruleset.params.firstPlayerAlternates) state.firstPlayer = state.firstPlayer === 0 ? 1 : 0;
  state.activePlayer = state.firstPlayer;
  for (const player of state.players) player.ap = state.ruleset.params.apPerTurn;
  for (const card of Object.values(state.cards)) card.eatsThisRound = 0;
  note(state, `${state.players[state.activePlayer].name} acts first; AP resets to ${state.ruleset.params.apPerTurn}; eating limits reset`);
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
