import type { CardDef, Ruleset } from '../engine/types';
import { cards } from '../data/cards';
import { params } from '../data/params';

const STORAGE_KEY = 'envi-tcg.ruleset.v2';

type Obj = Record<string, unknown>;

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function storage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/** Keeps every key of `value`; a missing or wrongly-typed nested object falls back to the default's copy. */
function fillDefaults<T>(value: unknown, fallback: T): T {
  if (value === undefined) return structuredClone(fallback);
  if (!isObject(fallback)) return value as T;
  if (!isObject(value)) return structuredClone(fallback);
  const result: Obj = { ...value };
  for (const key of Object.keys(fallback)) result[key] = fillDefaults(value[key], fallback[key]);
  return result as T;
}

function number(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

function fillCard(card: Obj): CardDef {
  const cost = isObject(card.cost) ? card.cost : {};
  return {
    ...card,
    tags: Array.isArray(card.tags) ? card.tags : [],
    text: typeof card.text === 'string' ? card.text : '',
    cost: { ...cost, C: number(cost.C), N: number(cost.N) },
    copies: number(card.copies),
  } as unknown as CardDef;
}

/** Saved ruleset from localStorage, or the default ruleset when none is saved, storage is unavailable or the saved value is invalid. Never throws. */
export function loadRuleset(): Ruleset {
  try {
    const saved = storage()?.getItem(STORAGE_KEY);
    if (saved == null) return defaultRuleset();
    const result = importRuleset(saved);
    return result.ok ? result.ruleset : defaultRuleset();
  } catch {
    return defaultRuleset();
  }
}

/** Save to localStorage; silently does nothing when storage is unavailable. */
export function saveRuleset(r: Ruleset): void {
  try {
    storage()?.setItem(STORAGE_KEY, exportRuleset(r));
  } catch {
    // Storage is full or blocked: the ruleset simply is not persisted.
  }
}

/** Pretty-printed JSON of the ruleset (the share file). */
export function exportRuleset(r: Ruleset): string {
  return JSON.stringify(r, null, 2);
}

/** Parse a share file. Fills missing version 2 params/card fields from the defaults;
 *  returns { ok: false, error } for non-JSON, wrong version, or a card missing id/name/kind. */
export function importRuleset(json: string): { ok: true; ruleset: Ruleset } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Not valid JSON' };
  }
  if (!isObject(parsed)) return { ok: false, error: 'Not a ruleset object' };
  if (parsed.version !== 2) return { ok: false, error: 'This file was made for an earlier rules version; reset to defaults or import a version 2 file.' };
  if (!Array.isArray(parsed.cards)) return { ok: false, error: 'cards must be an array' };

  const importedCards: CardDef[] = [];
  for (const [index, card] of parsed.cards.entries()) {
    if (!isObject(card) || typeof card.id !== 'string' || typeof card.name !== 'string' || typeof card.kind !== 'string') {
      return { ok: false, error: `Card ${index} must have string id, name and kind` };
    }
    const fallback = cards.find(def => def.id === card.id);
    importedCards.push(fallback ? fillDefaults(card, fallback) : fillCard(card));
  }

  const ruleset = {
    ...parsed,
    version: 2,
    name: typeof parsed.name === 'string' ? parsed.name : 'Imported ruleset',
    cards: importedCards,
    params: fillDefaults(parsed.params, params),
  } as unknown as Ruleset;
  return { ok: true, ruleset };
}

/** The built-in default ruleset (from src/data). */
export function defaultRuleset(): Ruleset {
  const ruleset: Ruleset = { version: 2, name: 'PDF defaults', cards, params };
  return structuredClone(ruleset);
}
