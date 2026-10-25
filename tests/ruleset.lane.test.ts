import { afterEach, describe, expect, it } from 'vitest';
import { defaultRuleset, importRuleset, loadRuleset, saveRuleset } from '../src/ruleset';

const KEY = 'envi-tcg.ruleset.v1';
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

/** Installs a minimal localStorage on globalThis and returns its backing map. */
function stubStorage(initial: Record<string, string> = {}): Map<string, string> {
  const data = new Map(Object.entries(initial));
  const stub = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, String(value)); },
    removeItem: (key: string) => { data.delete(key); },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: stub, configurable: true, writable: true });
  return data;
}

afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe('ruleset storage (lane T3)', () => {
  it('loadRuleset returns defaults when storage holds corrupt JSON', () => {
    stubStorage({ [KEY]: '{corrupt' });
    expect(loadRuleset()).toEqual(defaultRuleset());
  });

  it('without a localStorage global, loadRuleset returns defaults and saveRuleset does not throw', () => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
    expect(typeof localStorage).toBe('undefined');
    expect(loadRuleset()).toEqual(defaultRuleset());
    expect(() => saveRuleset(defaultRuleset())).not.toThrow();
  });

  it('importRuleset rejects version 2 with ok:false', () => {
    const result = importRuleset(JSON.stringify({ ...defaultRuleset(), version: 2 }));
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('version') });
  });

  it('saveRuleset then loadRuleset returns the saved ruleset', () => {
    const data = stubStorage();
    const edited = { ...defaultRuleset(), name: 'Class run 1' };
    saveRuleset(edited);
    expect(data.has(KEY)).toBe(true);
    expect(loadRuleset()).toEqual(edited);
  });
});
