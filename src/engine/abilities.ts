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

/** Events last through the current round's Environmental Phase. */
export function queueModifier(state: GameState, source: string, effect: Modifier['effect']): void {
  state.modifiers.push({ id: `m${state.round}-${state.log.length}-${state.modifiers.length}`, source, effect, activeRound: state.round });
  note(state, `${source}: ${effect} this round`);
}

/** Each check doubles C/N/P of every living algae above the owner's P threshold, unless a snail lives there. */
export function algalBloom(state: GameState, player: PlayerId): void {
  const algae = living(state, player).filter(c => definition(state, c).tags.includes('algae'));
  if (state.players[player].pool.P <= state.ruleset.params.algalBloomPThreshold || !algae.length) return;
  if (living(state, player).some(c => c.defId === 'freshwater-snail')) {
    note(state, `${state.players[player].name}'s Freshwater Snail prevents Algal Bloom`);
    return;
  }
  for (const card of algae) {
    for (const key of ['C', 'N', 'P'] as const) card.stored[key] *= 2;
    note(state, `${definition(state, card).name} doubles its C, N and P biomass (Algal Bloom)`);
  }
}

/** Add to a pool and to `released`, the per-player tally of what one dead card gave this round. */
export function credit(state: GameState, released: [Pool, Pool], player: PlayerId, delta: Partial<Pool>, reason: string): void {
  gain(state, player, delta, reason);
  for (const key of Object.keys(delta) as (keyof Pool)[]) released[player][key] += delta[key]!;
}

type Hook = (state: GameState, card: CardInstance, target?: CardInstance) => void;
interface Ability {
  onWork?: Hook;
  /** `carbon` is the C each player's detritivores released from `target` this round; `released` is everything each player got from it. */
  onAssist?: (state: GameState, microbe: CardInstance, target: CardInstance, carbon: [number, number], released: [Pool, Pool]) => void;
  event?: Hook;
}

/** Card-specific hooks run once at their named lifecycle point on the engine's cloned state. */
export const abilities: Record<string, Ability> = {
  'aquatic-grazer': { onWork: (s, c) => gain(s, c.owner, { P: -1 }, 'Aquatic Grazer removes excess P') },
  'carbon-bacteria': {
    onAssist(s, _c, _target, carbon, released) {
      for (const p of s.players) if (carbon[p.id]) credit(s, released, p.id, { C: carbon[p.id] }, 'Carbon Bacteria doubles released C');
    },
  },
  'nitrifying-bacteria': {
    onAssist(s, c, target, _carbon, released) {
      credit(s, released, c.owner, { N: 2 * target.stored.N }, 'Nitrifying Bacteria doubles and releases all remaining N');
      target.stored.N = 0;
    },
  },
  'phosphorus-bacteria': { onAssist: (s, c, _target, _carbon, released) => credit(s, released, c.owner, { P: 1 }, 'Phosphorus Bacteria') },
  'strong-rainfall': { event(s) { for (const p of s.players) gain(s, p.id, { P: 1 }, 'Strong Rainfall'); for (const p of s.players) algalBloom(s, p.id); } },
  'drought': { event(s) { for (const effect of ['producerO2-1', 'noAquaticPlay', 'noAquaticPhotosynthesis'] as const) queueModifier(s, 'drought', effect); } },
  'heat-wave': { event: s => queueModifier(s, 'heat-wave', 'upkeep+1') },
  'flood': {
    event(s) {
      for (const p of s.players) {
        const organisms = living(s, p.id);
        if (organisms.length) {
          die(s, organisms[Math.floor(random(s) * organisms.length)], 'Flood');
          gain(s, p.id, { C: 1 }, 'Flood');
        } else gain(s, p.id, { P: 1 }, 'Flood: no living organism');
      }
    },
  },
};
