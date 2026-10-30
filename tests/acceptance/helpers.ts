import { applyAction, type GameState, type Params, type PlayerId, type Ruleset, type RefereeOp, type Zone } from '../../src/engine';
import { cards } from '../../src/data/cards';
import { params } from '../../src/data/params';

/** Default data with events disabled, so random draws cannot change a scenario. */
export function testRuleset(overrides: { cards?: Ruleset['cards']; params?: Partial<Params>; name?: string } = {}): Ruleset {
  return {
    version: 5,
    name: overrides.name ?? 'Acceptance rules',
    cards: structuredClone(overrides.cards ?? cards.map(card => ({ ...card, copies: card.kind === 'event' ? 0 : card.copies }))),
    params: structuredClone({ ...params, ...overrides.params }),
  };
}

/** Locate an existing card without creating or modifying game state. */
export function uidOf(state: GameState, defId: string, zone?: Zone): string {
  const card = Object.values(state.cards).find(card => card.defId === defId && (!zone || card.zone === zone));
  if (!card) throw new Error(`Missing ${defId} in ${zone ?? 'any zone'}`);
  return card.uid;
}

/** Ensure a player's matching card is in hand, using only the referee seam. */
export function give(state: GameState, player: PlayerId, defId: string): GameState {
  const inHand = state.players[player].hand.find(uid => state.cards[uid].defId === defId);
  if (inHand) return state;
  const uid = state.players[player].deck.find(uid => state.cards[uid].defId === defId);
  if (!uid) throw new Error(`Player ${player} has no ${defId} in deck or hand`);
  return applyAction(state, { type: 'referee', op: { kind: 'moveCard', uid, zone: 'hand', owner: player } });
}

/** Play an owned card through normal validation, preparing resources via referee ops. */
export function play(state: GameState, player: PlayerId, defId: string, targetUid?: string): { state: GameState; uid: string } {
  state = give(state, player, defId);
  const uid = state.players[player].hand.find(uid => state.cards[uid].defId === defId)!;
  state = applyAction(state, { type: 'referee', op: { kind: 'setActivePlayer', player } });
  state = applyAction(state, { type: 'referee', op: { kind: 'setAp', player, ap: 20 } });
  state = applyAction(state, { type: 'referee', op: { kind: 'setPool', player, pool: { C: 30, N: 20, P: 2, O2: 50 } } });
  state = applyAction(state, { type: 'play', player, uid, targetUid });
  if (state.lastError) throw new Error(state.lastError);
  return { state, uid };
}


/** Finish a round through the normal two-turn seam. */
export function round(state: GameState): GameState {
  const first = state.activePlayer;
  state = applyAction(state, { type: 'endTurn', player: first });
  return applyAction(state, { type: 'endTurn', player: state.activePlayer });
}

/** Apply a referee operation without mutating a fixture. */
export function ref(state: GameState, op: RefereeOp): GameState {
  return applyAction(state, { type: 'referee', op });
}
