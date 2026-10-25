import type { Ruleset } from '../engine/types';
import { cards } from '../data/cards';
import { params } from '../data/params';

/** Saved ruleset from localStorage, or the default ruleset when none is saved, storage is unavailable or the saved value is invalid. Never throws. */
export function loadRuleset(): Ruleset { throw new Error('not implemented'); }
/** Save to localStorage; silently does nothing when storage is unavailable. */
export function saveRuleset(r: Ruleset): void { throw new Error('not implemented'); }
/** Pretty-printed JSON of the ruleset (the share file). */
export function exportRuleset(r: Ruleset): string { throw new Error('not implemented'); }
/** Parse a share file. Fills missing params/card fields from the defaults (so older files keep working);
 *  returns { ok: false, error } for non-JSON, wrong version, or a card missing id/name/kind. */
export function importRuleset(json: string): { ok: true; ruleset: Ruleset } | { ok: false; error: string } { throw new Error('not implemented'); }
/** The built-in default ruleset (from src/data). */
export function defaultRuleset(): Ruleset {
  return { version: 1, name: 'PDF defaults', cards, params };
}
