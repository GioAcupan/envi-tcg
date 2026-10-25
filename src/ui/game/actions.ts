import { checkAction } from '../../engine';
import type { Action, CardInstance, GameState, PlayerId } from '../../engine';
import { defOf } from '../common/Card';

/** Actions that need a second card chosen on the board. */
export type TargetKind = 'playOn' | 'eat' | 'assign' | 'decompose';

export const TARGET_VERB: Record<TargetKind, string> = {
  playOn: 'Play on a target', eat: 'Eat', assign: 'Assign to dead matter', decompose: 'Decompose',
};
const PROMPT: Record<TargetKind | 'adaptation' | 'microbe' | 'detritivore', string> = {
  playOn: 'tap a card to play it on', eat: 'tap its prey', assign: 'tap dead matter to process', decompose: 'tap detritus to decompose',
  adaptation: 'tap your organism to adapt', microbe: 'tap detritus to decompose', detritivore: 'tap dead matter to process',
};

/** What the board is waiting for, e.g. "tap its prey". Play-on-target wording follows the played card's kind. */
export function targetPrompt(state: GameState, kind: TargetKind, source: string): string {
  const cardKind = defOf(state, state.cards[source]).kind;
  return kind === 'playOn' && (cardKind === 'adaptation' || cardKind === 'microbe' || cardKind === 'detritivore') ? PROMPT[cardKind] : PROMPT[kind];
}

export function targetedAction(kind: TargetKind, player: PlayerId, source: string, target: string): Action {
  if (kind === 'playOn') return { type: 'play', player, uid: source, targetUid: target };
  if (kind === 'eat') return { type: 'eat', player, eaterUid: source, preyUid: target };
  if (kind === 'assign') return { type: 'assign', player, detritivoreUid: source, deadUid: target };
  return { type: 'decompose', player, microbeUid: source, detritusUid: target };
}

const boardCards = (state: GameState) => Object.values(state.cards).filter(c => c.zone === 'field' || c.zone === 'center');

/** Board cards the engine accepts as the target of this action. */
export function validTargets(state: GameState, kind: TargetKind, player: PlayerId, source: string): string[] {
  return boardCards(state).filter(c => !checkAction(state, targetedAction(kind, player, source, c.uid))).map(c => c.uid);
}

/** Why no target works: the engine's reasons across all board cards, deduplicated. */
export function noTargetReason(state: GameState, kind: TargetKind, player: PlayerId, source: string): string {
  const reasons = [...new Set(boardCards(state).map(c => checkAction(state, targetedAction(kind, player, source, c.uid))))]
    .filter((r): r is string => !!r);
  if (!reasons.length) return checkAction(state, targetedAction(kind, player, source, '')) ?? 'No valid target';
  return reasons.length === 1 ? reasons[0] : `No valid target (${reasons.slice(0, 2).join('; ')})`;
}

export type CardActions = { direct: { label: string; action: Action }[]; targeted: TargetKind[]; hint?: string };

/** The actions the closeup offers for `card` to `player`; legality is still checkAction's job. */
export function cardActions(state: GameState, card: CardInstance, player: PlayerId): CardActions {
  const none: CardActions = { direct: [], targeted: [] };
  if (card.owner !== player) return none;
  const def = defOf(state, card);
  if (card.zone === 'hand') {
    const direct = def.kind === 'adaptation' ? [] : [{ label: def.kind === 'event' ? 'Play event' : 'Play card', action: { type: 'play', player, uid: card.uid } as Action }];
    direct.push({ label: 'Discard & draw', action: { type: 'discardDraw', player, uid: card.uid } });
    return { direct, targeted: ['adaptation', 'microbe', 'detritivore'].includes(def.kind) ? ['playOn'] : [] };
  }
  if (card.zone !== 'field' || card.status !== 'alive') return none;
  const targeted: TargetKind[] = [];
  if (def.kind === 'consumer' || !!def.canEat?.some(t => t && t !== '–')) targeted.push('eat');
  if (def.kind === 'detritivore') targeted.push('assign');
  if (def.kind === 'microbe') targeted.push('decompose');
  return { direct: [], targeted, hint: def.kind === 'producer' ? 'Photosynthesis and aging happen automatically between rounds.' : undefined };
}
