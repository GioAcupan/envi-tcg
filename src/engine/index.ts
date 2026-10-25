import type { Ruleset, GameState, Action, CardInstance, PlayerId, RefereeOp, Modifier, Pool } from './types';
import { abilities, createCard, definition, gain, living, move, note, promptFlood } from './abilities';
export * from './types';

/** Build a fresh game. Shuffles each player's deck (every CardDef's `copies`, same list for both players) with
 *  the seeded RNG, places params.fallenLeaves.count Fallen Leaf tokens (status 'dead') in `center`, deals
 *  startingHand cards each (wild events drawn in the opening hand are shuffled back and replaced, [I]), sets
 *  pools to startingPool, round 1, Day, player 0 first and active, ap = apPerTurn. Never throws for a valid Ruleset. */
export function newGame(ruleset: Ruleset, seed: number, names?: [string, string]): GameState {
  const players = ([0, 1] as const).map(id => ({
    id, name: names?.[id] ?? `Player ${id + 1}`, pool: { ...ruleset.params.startingPool },
    ap: ruleset.params.apPerTurn, deck: [] as string[], hand: [] as string[], discard: [] as string[],
  }));
  const state: GameState = {
    ruleset: structuredClone(ruleset), seed, rngState: seed >>> 0, round: 1, isDay: true,
    firstPlayer: 0, activePlayer: 0, phase: 'action', cards: {}, center: [], modifiers: [], log: [],
    players: [players[0], players[1]],
  };
  for (const player of state.players) {
    for (const def of state.ruleset.cards) {
      for (let copy = 0; copy < def.copies; copy++) createCard(state, def.id, player.id, 'deck');
    }
    shuffle(state, player.deck);
    // Opening events are set aside until the hand is dealt, then shuffled back.
    // This also terminates for edited decks containing only events.
    const events: CardInstance[] = [];
    while (player.hand.length < ruleset.params.startingHand && player.deck.length) {
      const card = state.cards[player.deck[0]];
      if (definition(state, card).kind === 'event') {
        move(state, card, 'removed');
        events.push(card);
        note(state, `${player.name} replaces an opening ${definition(state, card).name}`);
      } else {
        move(state, card, 'hand');
        note(state, `${player.name} draws ${definition(state, card).name} (opening hand)`);
      }
    }
    for (const card of events) move(state, card, 'deck');
    if (events.length) shuffle(state, player.deck);
  }
  for (let i = 0; i < ruleset.params.fallenLeaves.count; i++) {
    const leaf = createCard(state, 'fallen-leaf', null, 'center');
    leaf.status = 'dead';
    leaf.stored = { ...ruleset.params.fallenLeaves.stored };
  }
  note(state, `Game starts; ${state.center.length} shared Fallen Leaves; ${state.players[0].name} acts first`);
  return state;
}

/** Return null when `action` is legal in `state`, otherwise a short human-readable reason
 *  ("Not enough AP", "Caterpillar can't eat Riparian Tree"). Pure. The UI uses it to enable/disable controls. */
export function checkAction(state: GameState, action: Action): string | null {
  if (action.type === 'referee') return null;
  if (state.phase === 'gameOver') return 'The game is over';
  if (action.type === 'choose') {
    const choice = state.pendingChoice;
    if (!choice) return 'There is no pending choice';
    if (choice.player !== action.player) return 'This choice is for the other player';
    const options = choice.options.filter(uid => isAlive(state.cards[uid]) && state.cards[uid].owner === action.player);
    return (options.length ? action.uid !== null && options.includes(action.uid) : action.uid === null) ? null : 'Choose a valid organism';
  }
  if (state.pendingChoice || state.phase === 'choice') return 'Resolve the pending choice first';
  if (action.player !== state.activePlayer) return 'It is not your turn';
  const player = state.players[action.player];
  const params = state.ruleset.params;
  if (action.type === 'endTurn') return null;
  if (action.type === 'play' || action.type === 'discardDraw') {
    const card = state.cards[action.uid];
    if (!card || card.zone !== 'hand' || card.owner !== action.player || !player.hand.includes(card.uid)) return 'Choose a card in your hand';
    if (action.type === 'discardDraw') return player.ap >= params.discardDrawApCost ? null : 'Not enough AP';
    const def = definition(state, card);
    if (!def) return 'Unknown card';
    if (def.kind === 'token') return 'Tokens cannot be played from hand';
    if (def.kind === 'event') return null;
    if (player.ap < params.playApCost) return 'Not enough AP';
    if (player.pool.C < def.cost.C || player.pool.N < def.cost.N) return 'Not enough nutrients';
    if (def.tags.includes('aquatic') && modifiers(state, 'noAquaticPlay', action.player).length) return 'Drought prevents playing aquatic cards this Day';
    const target = action.targetUid ? state.cards[action.targetUid] : undefined;
    if (def.kind === 'adaptation') {
      if (!isAlive(target) || target!.owner !== action.player) return 'Choose your own living organism';
      const kind = definition(state, target!).kind;
      const required = abilities[def.id]?.adaptationTarget;
      if (required && required !== 'organism' && required !== kind) return `This adaptation requires a ${required}`;
      if (target!.adaptations.includes(def.id)) return 'This adaptation is already attached';
      if (def.id === 'consumer-specialization' && (target!.marks < 2 || target!.specialized)) return 'Specialization requires an unspecialized consumer with two marks';
      return null;
    }
    if (action.targetUid) {
      if (def.kind === 'microbe') return decomposeReason(state, card, target);
      if (def.kind === 'detritivore') return assignReason(state, card, target);
      return 'This card does not take a target';
    }
    return null;
  }
  if (action.type === 'eat') {
    const eater = state.cards[action.eaterUid], prey = state.cards[action.preyUid];
    if (!isAlive(eater) || eater!.owner !== action.player) return 'Choose your own living eater';
    const def = definition(state, eater!);
    if (def.kind !== 'consumer' && !(def.kind === 'detritivore' && def.canEat?.length)) return 'This organism cannot eat';
    if (!isAlive(prey) || prey === eater) return 'Choose another living organism as prey';
    const preyDef = definition(state, prey!);
    if (prey!.adaptations.includes('protected-adaptation')) return 'Protected organisms cannot be eaten';
    if (def.trophicLevel === 4 && preyDef.kind === 'producer') return 'Tertiary consumers cannot eat producers';
    if (def.trophicLevel === 2 && abilities[preyDef.id]?.protectedFromPrimary) return `${def.name} cannot eat ${preyDef.name}`;
    if (!def.canEat?.some(tag => preyDef.tags.includes(tag))) return `${def.name} cannot eat ${preyDef.name}`;
    const limit = eater!.specialized ? Math.max(2, params.maxEatsPerRound) : params.maxEatsPerRound;
    if (eater!.eatsThisRound >= limit) return 'This organism has eaten its limit this round';
    return player.ap >= params.eatApCost ? null : 'Not enough AP';
  }
  if (action.type === 'assign') {
    const card = state.cards[action.detritivoreUid];
    if (!isAlive(card) || card!.owner !== action.player || definition(state, card!).kind !== 'detritivore') return 'Choose your own living detritivore';
    if (player.ap < params.detritivoreAssignApCost) return 'Not enough AP';
    return assignReason(state, card!, state.cards[action.deadUid]);
  }
  const card = state.cards[action.microbeUid];
  if (!isAlive(card) || card!.owner !== action.player || definition(state, card!).kind !== 'microbe') return 'Choose your own living microbe';
  if (player.ap < params.decomposeApCost) return 'Not enough AP';
  return decomposeReason(state, card!, state.cards[action.detritusUid]);
}

/** Apply one action and return the new state. Pure: never mutates `state` (structuredClone then mutate is fine).
 *  Illegal action → returns a copy of `state` with `lastError` set and nothing else changed; never throws.
 *  Legal action → applies it, appends log entries, clears `lastError`, runs the win check, and when both players
 *  have ended their turn runs the Environmental Phase (Appendix A §A2) and starts the next round.
 *  Referee actions are always legal (they bypass checks), are logged as "Referee: …", and still run the win check. */
export function applyAction(state: GameState, action: Action): GameState {
  const error = checkAction(state, action);
  const next = structuredClone(state);
  if (error) {
    next.lastError = error;
    return next;
  }
  delete next.lastError;
  const params = next.ruleset.params;
  switch (action.type) {
    case 'referee':
      referee(next, action.op);
      break;
    case 'play': {
      const card = next.cards[action.uid], def = definition(next, card);
      const target = action.targetUid ? next.cards[action.targetUid] : undefined;
      note(next, `${next.players[action.player].name} plays ${def.name}`);
      if (def.kind === 'event') {
        move(next, card, 'discard');
        abilities[def.id]?.event?.(next, card);
        break;
      }
      next.players[action.player].ap -= params.playApCost;
      gain(next, action.player, { C: -def.cost.C, N: -def.cost.N }, `${def.name} cost; ${params.playApCost} AP`);
      card.stored = { C: def.cost.C, N: def.cost.N, P: 0, O2: 0 };
      if (def.kind === 'adaptation') {
        move(next, card, 'attached');
        card.attachedTo = target!.uid;
        target!.adaptations.push(def.id);
        note(next, `${def.name} attaches to ${definition(next, target!).name}`);
      } else {
        move(next, card, 'field');
        card.status = 'alive';
        card.lifespanLeft = def.lifespan;
        card.flags.playOrder = 1 + Math.max(0, ...Object.values(next.cards).map(c => Number(c.flags.playOrder) || 0));
      }
      abilities[def.id]?.onPlay?.(next, card, target);
      if (target && def.kind === 'microbe') decompose(next, card, target);
      if (target && def.kind === 'detritivore') assign(next, card, target);
      break;
    }
    case 'discardDraw': {
      const card = next.cards[action.uid];
      next.players[action.player].ap -= params.discardDrawApCost;
      move(next, card, 'discard');
      note(next, `${next.players[action.player].name} discards ${definition(next, card).name} and draws (${params.discardDrawApCost} AP)`);
      draw(next, [action.player]);
      break;
    }
    case 'eat': {
      const eater = next.cards[action.eaterUid], prey = next.cards[action.preyUid];
      next.players[action.player].ap -= params.eatApCost;
      eater.eatsThisRound++;
      for (const key of Object.keys(eater.stored) as (keyof Pool)[]) eater.stored[key] += prey.stored[key];
      if (prey.adaptations.includes('nutrient-rich-adaptation')) gain(next, action.player, { C: 1, N: 1 }, 'Nutrient-Rich prey');
      if (definition(next, eater).kind === 'consumer' && definition(next, prey).kind === 'producer' && prey.adaptations.length) {
        eater.marks++;
        note(next, `${definition(next, eater).name} gains a specialization mark (${eater.marks})`);
      }
      if (eater.specialized) gain(next, action.player, { C: 1 }, 'Consumer Specialization');
      abilities[eater.defId]?.onEat?.(next, eater, prey);
      releaseProcessing(next, prey);
      move(next, prey, 'attached');
      prey.attachedTo = eater.uid;
      note(next, `${definition(next, eater).name} eats ${definition(next, prey).name}; stored nutrients transfer (${params.eatApCost} AP)`);
      break;
    }
    case 'assign':
      next.players[action.player].ap -= params.detritivoreAssignApCost;
      assign(next, next.cards[action.detritivoreUid], next.cards[action.deadUid]);
      break;
    case 'decompose':
      next.players[action.player].ap -= params.decomposeApCost;
      decompose(next, next.cards[action.microbeUid], next.cards[action.detritusUid]);
      break;
    case 'choose': {
      if (action.uid) {
        const card = next.cards[action.uid];
        releaseProcessing(next, card);
        card.status = 'processed';
        delete card.processing;
        note(next, `Flood processes ${definition(next, card).name}`);
        gain(next, action.player, { C: 1 }, 'Flood choice');
      } else gain(next, action.player, { P: 1 }, 'Flood: no organism');
      promptFlood(next);
      if (!next.pendingChoice) draw(next, []);
      break;
    }
    case 'endTurn': {
      note(next, `${next.players[action.player].name} ends their turn`);
      next.players[action.player].ap = 0;
      next.endedTurns ??= [];
      if (!next.endedTurns.includes(action.player)) next.endedTurns.push(action.player);
      if (next.endedTurns.length === 2) environment(next);
      else next.activePlayer = action.player === 0 ? 1 : 0;
      break;
    }
  }
  winCheck(next);
  return next;
}

/** Seeded Fisher-Yates; all random state lives in GameState for reproducible replays. */
function shuffle(state: GameState, uids: string[]): void {
  for (let i = uids.length - 1; i > 0; i--) {
    state.rngState = (state.rngState + 0x6D2B79F5) >>> 0;
    let value = state.rngState;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    const j = Math.floor(((value ^ value >>> 14) >>> 0) / 4294967296 * (i + 1));
    [uids[i], uids[j]] = [uids[j], uids[i]];
  }
}

function isAlive(card: CardInstance | undefined): boolean {
  return card?.zone === 'field' && card.status === 'alive';
}

function modifiers(state: GameState, effect: string, player: PlayerId): Modifier[] {
  return state.modifiers.filter(m => m.effect === effect && (m.player === undefined || m.player === player) &&
    (m.activeRound === state.round || (m.activeRound === undefined && m.appliesTo === 'thisRound')));
}

function assignReason(state: GameState, worker: CardInstance, dead: CardInstance | undefined): string | null {
  if (!dead || !['field', 'center'].includes(dead.zone) || !['dead', 'processed'].includes(dead.status ?? '')) return 'Choose dead matter in the field or center';
  if (Object.values(state.cards).some(c => c.processing?.by === worker.uid)) return 'This detritivore is already processing a card';
  if (dead.processing) return 'This card is already being processed';
  if (abilities[worker.defId]?.fineDetritus && (dead.status === 'processed' || dead.flags.shredded)) return null;
  return dead.status === 'dead' ? null : 'This card is already processed';
}

function decomposeReason(state: GameState, microbe: CardInstance, dead: CardInstance | undefined): string | null {
  if (microbe.flags.decomposedRound === state.round) return 'This microbe already decomposed this round';
  if (!dead || !['field', 'center'].includes(dead.zone)) return 'Choose detritus in the field or center';
  if (dead.status === 'processed' || (dead.status === 'dead' && abilities[microbe.defId]?.rawDecomposition)) return null;
  return 'This microbe requires processed detritus';
}

function assign(state: GameState, worker: CardInstance, dead: CardInstance): void {
  if (abilities[worker.defId]?.fineDetritus && (dead.status === 'processed' || dead.flags.shredded)) {
    dead.status = 'processed';
    gain(state, worker.owner!, { N: 1 }, 'Chironomid Larva Fine Detritus');
  } else {
    dead.processing = { by: worker.uid, roundsLeft: Math.max(1, state.ruleset.params.processRounds - (abilities[worker.defId]?.processReduction ?? 0)) };
    note(state, `${definition(state, worker).name} starts processing ${definition(state, dead).name} (${dead.processing.roundsLeft} rounds)`);
  }
}

/** Attached prey/adaptations leave play with their host; only the host's stored pool is returned. */
function discardTree(state: GameState, card: CardInstance): void {
  for (const child of Object.values(state.cards).filter(c => c.attachedTo === card.uid)) discardTree(state, child);
  move(state, card, card.owner === null ? 'removed' : 'discard');
}

function decompose(state: GameState, microbe: CardInstance, dead: CardInstance): void {
  microbe.flags.decomposedRound = state.round;
  gain(state, microbe.owner!, dead.stored, `${definition(state, microbe).name} decomposes ${definition(state, dead).name}`);
  if (dead.flags.shredded) gain(state, microbe.owner!, { C: 1, N: 1 }, 'Shred bonus');
  abilities[dead.defId]?.onDecomposed?.(state, dead, microbe);
  abilities[microbe.defId]?.onDecompose?.(state, microbe, dead);
  discardTree(state, dead);
}

/** A dying/eaten worker stops unfinished processing; dead matter remains available for reassignment. */
function releaseProcessing(state: GameState, worker: CardInstance): void {
  for (const card of Object.values(state.cards)) {
    if (card.processing?.by === worker.uid) {
      delete card.processing;
      note(state, `${definition(state, card).name} is no longer being processed`);
    }
  }
}

function die(state: GameState, card: CardInstance, reason: string): void {
  if (card.status !== 'alive') return;
  card.status = 'dead';
  releaseProcessing(state, card);
  note(state, `${state.players[card.owner!].name}'s ${definition(state, card).name} died: ${reason}`);
  abilities[card.defId]?.onDeath?.(state, card);
}

/** Finish scheduled draws until a Flood pauses play; event draws schedule a replacement at the front. */
function draw(state: GameState, players: PlayerId[]): void {
  (state.pendingDraws ??= []).push(...players);
  while (state.pendingDraws.length && !state.pendingChoice) {
    const player = state.players[state.pendingDraws.shift()!];
    const uid = player.deck[0];
    if (!uid) {
      note(state, `${player.name} cannot draw: deck is empty`);
      continue;
    }
    const card = state.cards[uid], def = definition(state, card);
    note(state, `${player.name} draws ${def.name}`);
    if (def.kind === 'event') {
      move(state, card, 'discard');
      note(state, `${def.name} resolves immediately (no AP)`);
      state.pendingDraws.unshift(player.id);
      abilities[def.id]?.event?.(state, card);
    } else move(state, card, 'hand');
  }
  if (!state.pendingDraws.length) delete state.pendingDraws;
}

/** Settle the ending round before opening the next: photosynthesis, upkeep, age, processing, then draws. */
function environment(state: GameState): void {
  note(state, 'Environmental Phase begins');
  if (state.isDay) {
    for (const card of living(state).filter(c => definition(state, c).kind === 'producer')) {
      const def = definition(state, card), player = card.owner!;
      const shielded = card.flags.droughtImmuneRound === state.round;
      if (!shielded && def.tags.includes('aquatic') && def.tags.includes('plant') && modifiers(state, 'noAquaticPhotosynthesis', player).length) {
        note(state, `${def.name} cannot photosynthesize during Drought`);
        continue;
      }
      const reduction = shielded ? 0 : modifiers(state, 'producerO2-1', player).length;
      const produced = Math.max(0, (def.o2Produced ?? 0) + (card.adaptations.includes('oxygen-rich-adaptation') ? 2 : 0) - reduction);
      gain(state, player, { O2: produced }, `${def.name} photosynthesis`);
      abilities[def.id]?.onPhotosynthesis?.(state, card);
      for (const id of card.adaptations) abilities[id]?.onPhotosynthesis?.(state, card);
    }
  }
  const organisms = living(state).sort((a, b) => Number(a.flags.playOrder ?? 0) - Number(b.flags.playOrder ?? 0));
  for (const card of organisms) {
    const def = definition(state, card), player = card.owner!;
    const cost = (def.kind === 'producer' ? 0 : def.o2PerRound ?? 0) + modifiers(state, 'upkeep+1', player).length;
    if (state.players[player].pool.O2 < cost) die(state, card, `could not pay ${cost} O2 upkeep`);
    else if (cost) gain(state, player, { O2: -cost }, `${def.name} upkeep`);
  }
  for (const card of living(state)) {
    if (card.lifespanLeft !== undefined) {
      card.lifespanLeft--;
      note(state, `${definition(state, card).name}: ${card.lifespanLeft} lifespan remaining`);
      if (card.lifespanLeft <= 0) die(state, card, 'lifespan ended');
    }
  }
  for (const card of Object.values(state.cards)) {
    if (!card.processing) continue;
    const worker = state.cards[card.processing.by];
    if (!isAlive(worker) || !['field', 'center'].includes(card.zone) || card.status !== 'dead') {
      delete card.processing;
      continue;
    }
    card.processing.roundsLeft--;
    note(state, `${definition(state, card).name}: ${card.processing.roundsLeft} processing rounds remaining`);
    if (card.processing.roundsLeft <= 0) {
      card.status = 'processed';
      delete card.processing;
      gain(state, worker.owner!, { C: 1 }, `${definition(state, worker).name} finishes processing`);
      abilities[worker.defId]?.onProcessed?.(state, worker, card);
    }
  }
  state.round++;
  state.isDay = !state.isDay;
  state.modifiers = state.modifiers.filter(m => m.activeRound !== undefined ? m.activeRound >= state.round : m.appliesTo !== 'thisRound');
  for (const card of living(state)) {
    if (abilities[card.defId]?.droughtShield && !card.flags.droughtShieldUsed && modifiers(state, 'noAquaticPhotosynthesis', card.owner!).length) {
      card.flags.droughtShieldUsed = true;
      card.flags.droughtImmuneRound = state.round;
      note(state, `${definition(state, card).name} ignores its first Drought`);
    }
  }
  state.endedTurns = [];
  if (state.ruleset.params.firstPlayerAlternates) state.firstPlayer = state.firstPlayer === 0 ? 1 : 0;
  state.activePlayer = state.firstPlayer;
  for (const player of state.players) player.ap = state.ruleset.params.apPerTurn;
  for (const card of Object.values(state.cards)) card.eatsThisRound = 0;
  note(state, `${state.players[state.activePlayer].name} acts first; AP resets to ${state.ruleset.params.apPerTurn}; eating limits reset`);
  // Resetting the turn before exposing a draw choice keeps the resumed round ready to play.
  const draws: PlayerId[] = [];
  for (const player of state.players) for (let i = 0; i < state.ruleset.params.drawPerRound; i++) draws.push(player.id);
  draw(state, draws);
}

function referee(state: GameState, op: RefereeOp): void {
  note(state, `Referee: ${JSON.stringify(op)}`);
  switch (op.kind) {
    case 'setPool': Object.assign(state.players[op.player].pool, op.pool); break;
    case 'setAp': state.players[op.player].ap = op.ap; break;
    case 'setStatus': {
      const card = state.cards[op.uid];
      if (card) {
        if (op.status === 'dead' && isAlive(card)) die(state, card, 'referee');
        else card.status = op.status;
        if (op.status !== 'alive') releaseProcessing(state, card);
        if (op.status !== 'dead') delete card.processing;
      }
      break;
    }
    case 'moveCard': {
      const card = state.cards[op.uid];
      if (card) {
        move(state, card, op.zone, op.owner);
        if (!isAlive(card)) releaseProcessing(state, card);
      }
      break;
    }
    case 'setCardField': {
      const card = state.cards[op.uid];
      if (card) {
        if (op.field === 'stored' && typeof op.value !== 'number') card.stored = { ...op.value };
        else if (op.field !== 'stored' && typeof op.value === 'number') card[op.field] = op.value;
      }
      break;
    }
    case 'draw': draw(state, [op.player]); break;
    case 'setDayNight': state.isDay = op.isDay; break;
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
    state.winner = winner;
    state.phase = 'gameOver';
  } else if (state.phase === 'gameOver') {
    delete state.winner;
    state.phase = state.pendingChoice ? 'choice' : 'action';
  }
}
