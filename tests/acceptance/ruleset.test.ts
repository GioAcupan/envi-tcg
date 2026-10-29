import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultRuleset, exportRuleset, importRuleset, loadRuleset } from '../../src/ruleset';

afterEach(() => vi.unstubAllGlobals());

describe('U10 ruleset version 4', () => {
  it.each([1, 2, 3, 0, 5, undefined])('rejects version %s with the exact migration message', version => {
    expect(importRuleset(JSON.stringify({ ...defaultRuleset(), version }))).toEqual({ ok: false, error: 'This file was made for an earlier rules version; reset to defaults or import a version 4 file.' });
  });
  it('discards a saved version 3 and ignores the old storage key', () => {
    const old = JSON.stringify({ ...defaultRuleset(), version: 3, name: 'Old' });
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'envi-tcg.ruleset.v4' ? old : null });
    expect(loadRuleset()).toEqual(defaultRuleset());
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'envi-tcg.ruleset.v3' ? old : null });
    expect(loadRuleset()).toEqual(defaultRuleset());
  });
  it('roundtrips fractions exactly', () => {
    const r = defaultRuleset(); r.cards[0].cost.N = 0.25;
    expect(importRuleset(exportRuleset(r))).toEqual({ ok: true, ruleset: r });
  });
  it('fills missing version 4 card and parameter fields from defaults', () => {
    const r = defaultRuleset();
    const result = importRuleset(JSON.stringify({ version: 4, cards: [{ id: r.cards[0].id, kind: r.cards[0].kind, name: 'Edited', cost: { N: 0.25 } }], params: { startingPool: { N: 2.5 } } }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ruleset.cards[0]).toEqual({ ...r.cards[0], name: 'Edited', cost: { ...r.cards[0].cost, N: 0.25 } });
    expect(result.ruleset.params).toEqual({ ...r.params, startingPool: { ...r.params.startingPool, N: 2.5 } });
  });
  it('rejects malformed JSON and card identity', () => {
    expect(importRuleset('{oops').ok).toBe(false); expect(importRuleset('[]').ok).toBe(false);
    expect(importRuleset(JSON.stringify({ version: 4, cards: [{}] })).ok).toBe(false);
  });
});
