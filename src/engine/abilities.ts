import type { CardDef, CardInstance, GameState, Modifier, PlayerId, Pool, Zone } from './types';

/** Internal mutation helpers: callers own a fresh game or a cloned action state. */
export function definition(state: GameState, card: CardInstance): CardDef {
  return state.ruleset.cards.find(def => def.id === card.defId)!;
}

export function note(state: GameState, text: string): void {
  state.log.push({ round: state.round, text: `Round ${state.round}: ${text}` });
}

/** Change a pool and log the actual delta; resources never fall below zero. */
export function gain(state: GameState, player: PlayerId, delta: Partial<Pool>, reason: string): void {
  const changes: string[] = [];
  for (const key of Object.keys(delta) as (keyof Pool)[]) {
    const before = state.players[player].pool[key];
    const after = Math.max(0, before + delta[key]!);
    state.players[player].pool[key] = after;
    const amount = after - before;
    changes.push(`${amount >= 0 ? '+' : ''}${amount} ${key}`);
  }
  note(state, `${state.players[player].name}: ${changes.join(', ')} (${reason})`);
}

/** Change zone/owner and rebuild zone indexes. Leaving the field frees this worker and its workers. */
export function move(state: GameState, card: CardInstance, zone: Zone, owner = card.owner): void {
  for (const player of state.players) {
    for (const key of ['deck', 'hand', 'discard'] as const) player[key] = player[key].filter(uid => uid !== card.uid);
  }
  if (zone !== 'field') {
    delete card.working;
    for (const worker of Object.values(state.cards)) {
      if (worker.working === card.uid) {
        delete worker.working;
        note(state, `${definition(state, worker).name} is free to work again`);
      }
    }
  }
  card.owner = owner;
  card.zone = zone;
  delete card.attachedTo;
  if (zone === 'deck' || zone === 'hand' || zone === 'discard') state.players[owner][zone].push(card.uid);
}

export function createCard(state: GameState, defId: string, owner: PlayerId, zone: Zone): CardInstance {
  let n = Object.keys(state.cards).length;
  while (state.cards[`c${n}`]) n++;
  const card: CardInstance = {
    uid: `c${n}`, defId, owner, zone, stored: { C: 0, N: 0, P: 0, O2: 0 }, flags: {},
  };
  state.cards[card.uid] = card;
  move(state, card, zone);
  return card;
}

export function living(state: GameState, player?: PlayerId): CardInstance[] {
  return Object.values(state.cards).filter(card => card.zone === 'field' && card.status === 'alive' &&
    (player === undefined || card.owner === player));
}

/** Seeded random value in [0,1); all randomness advances GameState for reproducible replays. */
export function random(state: GameState): number {
  state.rngState = (state.rngState + 0x6D2B79F5) >>> 0;
  let value = state.rngState;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
}

/** Seeded Fisher-Yates on a deck owned by the mutable state. */
export function shuffle(state: GameState, uids: string[]): void {
  for (let i = uids.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [uids[i], uids[j]] = [uids[j], uids[i]];
  }
}

/** Death leaves biomass and attached cards in place, and stops this organism's work. */
export function die(state: GameState, card: CardInstance, reason: string): void {
  if (card.status !== 'alive' || card.zone !== 'field') return;
  card.status = 'dead';
  delete card.working;
  note(state, `${state.players[card.owner].name}'s ${definition(state, card).name} died: ${reason}`);
}

/** An event's effect on the drawer for `rounds` rounds starting now, each through its Environmental Phase.
 *  Rounds already covered by the same effect are not doubled: wild events do not stack. */
export function queueModifier(state: GameState, source: string, effect: Modifier['effect'], player: PlayerId, rounds: number): void {
  for (let activeRound = state.round; activeRound < state.round + rounds; activeRound++) {
    if (state.modifiers.some(m => m.source === source && m.effect === effect && m.player === player && m.activeRound === activeRound)) continue;
    state.modifiers.push({ id: `m${activeRound}-${state.log.length}-${state.modifiers.length}`, source, effect, player, activeRound });
  }
  note(state, `${source}: ${effect} for ${state.players[player].name}, ${rounds === 1 ? 'this round' : `${rounds} rounds`}`);
}

/** Each check doubles C/N/P of every living algae above the owner's P threshold, unless a snail (Susong Pilipit) lives there. */
export function algalBloom(state: GameState, player: PlayerId): void {
  const algae = living(state, player).filter(c => definition(state, c).tags.includes('algae'));
  if (state.players[player].pool.P <= state.ruleset.params.algalBloomPThreshold || !algae.length) return;
  const snail = living(state, player).find(c => c.defId === 'freshwater-snail');
  if (snail) {
    note(state, `${state.players[player].name}'s ${definition(state, snail).name} prevents Algal Bloom`);
    return;
  }
  for (const card of algae) {
    for (const key of ['C', 'N', 'P'] as const) card.stored[key] *= 2;
    note(state, `${definition(state, card).name} doubles its C, N and P biomass (Algal Bloom)`);
  }
}

type Hook = (state: GameState, card: CardInstance, target?: CardInstance) => void;
interface Ability {
  onWork?: Hook;
  /** A microbe in a round a detritivore released from `target`; `carbon` is the C each player's detritivores released. */
  onAssist?: (state: GameState, microbe: CardInstance, target: CardInstance, carbon: [number, number]) => void;
  /** A microbe in a round no detritivore released from `target`; without it, the microbe releases its `release` from the card. */
  onAlone?: Hook;
  /** A wild event; `card.owner` drew it and is the only player it affects. */
  event?: Hook;
}

const rounds = (state: GameState, card: CardInstance) => definition(state, card).lifespan ?? 1;

/** Card-specific hooks run once at their named lifecycle point on the engine's cloned state. */
export const abilities: Record<string, Ability> = {
  'aquatic-grazer': { onWork: (s, c) => gain(s, c.owner, { P: -1 }, `${definition(s, c).name} removes excess P`) },
  'carbon-bacteria': {
    onAssist(s, _c, _target, carbon) {
      for (const p of s.players) if (carbon[p.id]) gain(s, p.id, { C: carbon[p.id] }, 'Carbon Bacteria doubles released C');
    },
  },
  'nitrifying-bacteria': {
    onAssist(s, c, target) {
      gain(s, c.owner, { N: 2 * target.stored.N }, 'Nitrifying Bacteria doubles and releases all remaining N');
      target.stored.N = 0;
    },
  },
  // The only card that makes P (UPDATE-2.1), so its P is created rather than taken from the card.
  'phosphorus-bacteria': {
    onAssist: (s, c) => gain(s, c.owner, { P: 1 }, 'Phosphorus Bacteria'),
    onAlone: (s, c) => gain(s, c.owner, { P: 1 }, 'Phosphorus Bacteria'),
  },
  'strong-rainfall': { event(s, c) { gain(s, c.owner, { P: 1 }, 'Strong Rainfall'); algalBloom(s, c.owner); } },
  'drought': { event(s, c) { for (const effect of ['producerO2-1', 'noAquaticPlay', 'noAquaticPhotosynthesis'] as const) queueModifier(s, 'drought', effect, c.owner, rounds(s, c)); } },
  'heat-wave': { event: (s, c) => queueModifier(s, 'heat-wave', 'upkeep+1', c.owner, rounds(s, c)) },
  'flood': {
    event(s, c) {
      const organisms = living(s, c.owner);
      if (organisms.length) {
        die(s, organisms[Math.floor(random(s) * organisms.length)], 'Flash Flood');
        gain(s, c.owner, { C: 1 }, 'Flash Flood');
      } else gain(s, c.owner, { P: 1 }, 'Flash Flood: no living organism');
    },
  },
  'introduced-species': {
    event(s, c) {
      const organisms = living(s, c.owner), none = !organisms.length;
      for (let i = 0; i < 2 && organisms.length; i++) die(s, organisms.splice(Math.floor(random(s) * organisms.length), 1)[0], 'Introduced Non-native Species');
      gain(s, c.owner, none ? { C: -10, N: -4 } : { C: -5, N: -2 }, `Introduced Non-native Species${none ? ': no living organism, doubled' : ''}`);
    },
  },
};
