import type { CardDef, CardInstance, GameState, Modifier, PlayerId, Pool, Zone } from './types';

/** Internal mutation helpers: callers own a fresh game or a cloned action state. */
export function definition(state: GameState, card: CardInstance): CardDef {
  return state.ruleset.cards.find(def => def.id === card.defId)!;
}

export function note(state: GameState, text: string): void {
  state.log.push({ round: state.round, text: `Round ${state.round} (${state.isDay ? 'Day' : 'Night'}): ${text}` });
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

/** Change zone/owner, rebuilding all indexed zone memberships for this card. */
export function move(state: GameState, card: CardInstance, zone: Zone, owner = card.owner): void {
  for (const player of state.players) {
    for (const key of ['deck', 'hand', 'discard'] as const) player[key] = player[key].filter(uid => uid !== card.uid);
  }
  state.center = state.center.filter(uid => uid !== card.uid);
  card.owner = owner;
  card.zone = zone;
  delete card.attachedTo;
  if (zone !== 'field' && zone !== 'center') delete card.processing;
  if (zone === 'center') state.center.push(card.uid);
  else if ((zone === 'deck' || zone === 'hand' || zone === 'discard') && owner !== null) state.players[owner][zone].push(card.uid);
}

export function createCard(state: GameState, defId: string, owner: PlayerId | null, zone: Zone): CardInstance {
  let n = Object.keys(state.cards).length;
  while (state.cards[`c${n}`]) n++;
  const card: CardInstance = {
    uid: `c${n}`, defId, owner, zone, stored: { C: 0, N: 0, P: 0, O2: 0 },
    adaptations: [], marks: 0, eatsThisRound: 0, flags: {},
  };
  state.cards[card.uid] = card;
  move(state, card, zone);
  return card;
}

export function living(state: GameState, player?: PlayerId): CardInstance[] {
  return Object.values(state.cards).filter(card => card.zone === 'field' && card.status === 'alive' &&
    (player === undefined || card.owner === player));
}

/** Schedule an event for a single future round, preserving its readable window label. */
export function queueModifier(state: GameState, source: string, appliesTo: Modifier['appliesTo'], effect: string, player?: PlayerId): void {
  const activeRound = appliesTo === 'thisRound' ? state.round : appliesTo === 'nextRound' ? state.round + 1
    : state.round + ((appliesTo === 'nextDay') === state.isDay ? 2 : 1);
  state.modifiers.push({ id: `m${state.round}-${state.log.length}-${state.modifiers.length}`, source, appliesTo, effect, player, activeRound });
  note(state, `${source} queues ${effect} for round ${activeRound}${player === undefined ? '' : ` (${state.players[player].name})`}`);
}

export function algalBloom(state: GameState, player: PlayerId): void {
  if (living(state, player).some(card => card.defId === 'freshwater-snail')) {
    note(state, `${state.players[player].name}'s Freshwater Snail prevents Algal Bloom`);
    return;
  }
  queueModifier(state, 'algal-bloom', 'nextRound', 'upkeep+1', player);
}

/** Expose the next Flood decision; options are computed when that player's choice starts. */
export function promptFlood(state: GameState): void {
  const player = state.pendingFloodPlayers?.shift();
  if (player === undefined) {
    delete state.pendingChoice;
    delete state.pendingFloodPlayers;
    state.phase = 'action';
    return;
  }
  state.pendingChoice = {
    kind: 'flood', player, options: living(state, player).map(card => card.uid),
    prompt: 'Flood: choose an organism to process (+1 C), or gain +1 P if none remain.',
  };
  state.phase = 'choice';
  note(state, `Flood awaits ${state.players[player].name}'s choice`);
}

type Hook = (state: GameState, card: CardInstance, target?: CardInstance) => void;
interface Ability {
  onPlay?: Hook;
  onPhotosynthesis?: Hook;
  onDeath?: Hook;
  onProcessed?: Hook;
  onDecompose?: Hook;
  onDecomposed?: Hook;
  onEat?: Hook;
  event?: Hook;
  processReduction?: number;
  fineDetritus?: boolean;
  rawDecomposition?: boolean;
  protectedFromPrimary?: boolean;
  droughtShield?: boolean;
  adaptationTarget?: 'producer' | 'consumer' | 'organism';
}

/** Card-specific rules only. Hooks run once at the named engine lifecycle point on the cloned state. */
export const abilities: Record<string, Ability> = {
  'leaf-litter-plant': {
    onDeath(state, card) {
      const leaf = createCard(state, 'fallen-leaf', card.owner, 'field');
      leaf.status = 'dead';
      leaf.stored.C = 1;
      note(state, 'Leaf Litter Plant leaves a Fallen Leaf storing 1 C');
    },
  },
  'river-grass': { onPhotosynthesis: (s, c) => gain(s, c.owner!, { C: 1 }, 'River Grass photosynthesis') },
  'green-algae': { onPhotosynthesis: (s, c) => gain(s, c.owner!, { C: 1 }, 'Green Algae photosynthesis') },
  'fast-growing-plant': { onPlay: (s, c) => gain(s, c.owner!, { C: 1 }, 'Fast-Growing Plant') },
  'aquatic-plant': { droughtShield: true },
  'riparian-tree': { protectedFromPrimary: true },
  'diatom': { onDecomposed: (s, _c, microbe) => gain(s, microbe!.owner!, { P: 1 }, 'Diatom decomposition') },
  'bloom-algae': {
    onPhotosynthesis(s, c) {
      if (s.players[c.owner!].pool.P >= s.ruleset.params.algalBloomPThreshold) algalBloom(s, c.owner!);
    },
  },
  'freshwater-shrimp': {
    onProcessed(s, _c, dead) {
      if (definition(s, dead!).tags.includes('plant')) {
        dead!.flags.shredded = true;
        note(s, 'Freshwater Shrimp shreds the processed plant (+1 C and +1 N on decomposition)');
      }
    },
  },
  'aquatic-worm': { processReduction: 1 },
  'tubifex-worm': { onProcessed: (s, c) => gain(s, c.owner!, { C: 1 }, 'Tubifex Worm Filter') },
  'chironomid-larva': { fineDetritus: true },
  'freshwater-snail': { onEat: (s, c) => gain(s, c.owner!, { C: 1 }, 'Freshwater Snail grazing') },
  'aquatic-grazer': { onEat: (s, _c, prey) => gain(s, prey!.owner!, { P: -1 }, 'Aquatic Grazer grazing') },
  'super-decomposer': { rawDecomposition: true },
  'nitrogen-bacteria': {
    onDecompose(s, c) {
      if (!c.flags.bacterialBonusUsed) {
        c.flags.bacterialBonusUsed = true;
        gain(s, c.owner!, { N: 1 }, 'Nitrogen Bacteria once-per-game bonus');
      }
    },
  },
  'phosphorus-bacteria': {
    onDecompose(s, c) {
      if (!c.flags.bacterialBonusUsed) {
        c.flags.bacterialBonusUsed = true;
        gain(s, c.owner!, { P: 1 }, 'Phosphorus Bacteria once-per-game bonus');
      }
    },
  },
  'nutrient-rich-adaptation': { adaptationTarget: 'producer' },
  'oxygen-rich-adaptation': { adaptationTarget: 'producer' },
  'p-accumulator-adaptation': {
    adaptationTarget: 'producer',
    onPhotosynthesis(s, c) {
      c.stored.P++;
      note(s, `${definition(s, c).name} stores +1 P (P-Accumulator)`);
    },
  },
  'consumer-specialization': {
    adaptationTarget: 'consumer',
    onPlay(s, _c, target) {
      target!.specialized = true;
      if (target!.lifespanLeft !== undefined) target!.lifespanLeft += 2;
      note(s, `${definition(s, target!).name} specializes (+2 lifespan, two eats, +1 C per eat)`);
    },
  },
  'protected-adaptation': { adaptationTarget: 'organism' },
  'strong-rainfall': {
    event(s) {
      for (const player of s.players) {
        gain(s, player.id, { P: 2 }, 'Strong Rainfall');
        if (player.pool.P >= s.ruleset.params.algalBloomPThreshold && living(s, player.id).some(c => definition(s, c).tags.includes('algae'))) algalBloom(s, player.id);
      }
      queueModifier(s, 'strong-rainfall', 'nextNight', 'upkeep+1');
    },
  },
  'drought': {
    event(s) {
      for (const effect of ['producerO2-1', 'noAquaticPlay', 'noAquaticPhotosynthesis']) queueModifier(s, 'drought', 'nextDay', effect);
    },
  },
  'heat-wave': { event: s => queueModifier(s, 'heat-wave', 'nextNight', 'upkeep+1') },
  'flood': {
    event(s, c) {
      const player = c.owner!;
      (s.pendingFloodPlayers ??= []).push(player, player === 0 ? 1 : 0);
      if (!s.pendingChoice) promptFlood(s);
    },
  },
};
