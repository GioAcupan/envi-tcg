import type { Ruleset, GameState, Action } from './types';
export * from './types';

/** Build a fresh game. Shuffles each player's deck (every CardDef's `copies`, same list for both players) with
 *  the seeded RNG, places params.fallenLeaves.count Fallen Leaf tokens (status 'dead') in `center`, deals
 *  startingHand cards each (wild events drawn in the opening hand are shuffled back and replaced, [I]), sets
 *  pools to startingPool, round 1, Day, player 0 first and active, ap = apPerTurn. Never throws for a valid Ruleset. */
export function newGame(ruleset: Ruleset, seed: number, names?: [string, string]): GameState {
  throw new Error('not implemented');
}

/** Return null when `action` is legal in `state`, otherwise a short human-readable reason
 *  ("Not enough AP", "Caterpillar can't eat Riparian Tree"). Pure. The UI uses it to enable/disable controls. */
export function checkAction(state: GameState, action: Action): string | null {
  throw new Error('not implemented');
}

/** Apply one action and return the new state. Pure: never mutates `state` (structuredClone then mutate is fine).
 *  Illegal action → returns a copy of `state` with `lastError` set and nothing else changed; never throws.
 *  Legal action → applies it, appends log entries, clears `lastError`, runs the win check, and when both players
 *  have ended their turn runs the Environmental Phase (Appendix A §A2) and starts the next round.
 *  Referee actions are always legal (they bypass checks), are logged as "Referee: …", and still run the win check. */
export function applyAction(state: GameState, action: Action): GameState {
  throw new Error('not implemented');
}
