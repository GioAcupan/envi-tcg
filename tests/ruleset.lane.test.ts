import { afterEach, describe, expect, it } from 'vitest';
import { defaultRuleset, importRuleset, loadRuleset, saveRuleset } from '../src/ruleset';

const KEY = 'envi-tcg.ruleset.v5';
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

describe('ruleset storage (lane T1)', () => {
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

  it('importRuleset rejects version 1 with ok:false', () => {
    const result = importRuleset(JSON.stringify({ ...defaultRuleset(), version: 1 }));
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
describe('lane: Appendix B default data', () => {
  it('has exactly the revised archetypes and card counts', () => {
    const r = defaultRuleset();
    expect(r.version).toBe(5); expect(r.cards).toHaveLength(23); expect(new Set(r.cards.map(c => c.id)).size).toBe(23);
    expect(Object.fromEntries(['producer', 'detritivore', 'microbe', 'event'].map(kind => [kind, r.cards.filter(c => c.kind === kind).reduce((n, c) => n + c.copies, 0)]))).toEqual({ producer: 14, detritivore: 12, microbe: 8, event: 5 });
    for (const c of r.cards) expect(c.art).toBe(`art/${c.id}.svg`);
    expect(r.params).toEqual({ startingPool: { C: 10, N: 3, P: 0, O2: 7 }, winThreshold: { C: 50, N: 15, P: 1 }, startingHand: 5, apPerTurn: 3, drawPerRound: 1, playApCost: 1, discardDrawApCost: 1, detritivoreAssignApCost: 1, algalBloomPThreshold: 2, firstPlayerAlternates: false, undoEnabled: true });
  });
  it.each([
    ['duck-lettuce', 2, 3, 8, 2, 2, 0], ['hydrilla', 2, 4, 8, 2, 2, 0], ['water-hyacinth', 2, 4, 8, 2, 2, 0],
    ['indian-lotus', 2, 3, 8, 2, 2, 0], ['pond-fern', 2, 3, 8, 2, 2, 0],
    ['green-algae', 1, 2, 2, 0, 3, 1], ['diatoms', 2, 1, 2, 0, 4, 1], ['cyanobacteria', 1, 2, 2, 0, 3, 1],
  ] as const)('%s has exact printed producer stats', (id, costC, life, biomassC, biomassN, oxygen, growthN) => {
    const c = defaultRuleset().cards.find(c => c.id === id)!;
    expect(c.cost).toEqual(['green-algae', 'cyanobacteria'].includes(id) ? { C: costC, N: 0.5, P: 1 } : { C: costC, N: 0.5 }); expect(c.lifespan).toBe(life); expect(c.biomass).toEqual({ C: biomassC, N: biomassN, P: 0, O2: 0 });
    expect(c.growth).toEqual(growthN ? { C: 1, N: growthN } : { C: 1 }); expect(c.yield).toEqual(id === 'cyanobacteria' ? { O2: oxygen, C: 1, N: 1 } : { O2: oxygen, C: 1 });
    expect(c.tags).toEqual(id === 'indian-lotus' ? ['plant'] : c.subtype === 'plant' ? ['plant', 'aquatic'] : ['algae', 'aquatic']);
  });
  it.each([
    ['freshwater-shrimp', 4, 'shredder', 3, ['plant'], false], ['aquatic-worm', 3, 'shredder', 2, ['plant'], false],
    ['tubifex-worm', 3, 'collector', 1, ['plant', 'algae', 'animal'], false], ['chironomid-larva', 3, 'collector', 1, ['plant', 'algae', 'animal'], false],
    ['caddisfly-larva', 3, 'collector', 1, ['plant', 'algae', 'animal'], false],
    ['freshwater-snail', 4, 'grazer', 1, ['algae'], true], ['aquatic-grazer', 3, 'grazer', 1, ['plant', 'algae'], false],
  ] as const)('%s has exact printed detritivore stats', (id, life, subtype, releaseC, tags, eatsAlive) => {
    const c = defaultRuleset().cards.find(c => c.id === id)!;
    expect(c).toMatchObject({ kind: 'detritivore', subtype, cost: { C: 0, N: 0.5 }, lifespan: life, biomass: { C: 3, N: 1, P: 0, O2: 0 }, o2PerRound: 1, release: { C: releaseC }, tags: ['detritivore', 'animal', 'aquatic'], canEat: [...tags] }); expect(!!c.eatsAlive).toBe(eatsAlive);
  });
  it('microbes cost 1 O2 a round, take 1 C and 0.5 N, and come 3/3/2', () => {
    const microbes = defaultRuleset().cards.filter(c => c.kind === 'microbe');
    expect(Object.fromEntries(microbes.map(c => [c.id, c.copies]))).toEqual({ 'carbon-bacteria': 3, 'nitrifying-bacteria': 3, 'phosphorus-bacteria': 2 });
    for (const c of microbes) expect(c).toMatchObject({ cost: { C: 0, N: 0 }, o2PerRound: 1, consumes: { C: 1, N: 0.5 } });
    expect(Object.fromEntries(microbes.map(c => [c.id, c.release]))).toEqual({ 'carbon-bacteria': { C: 1 }, 'nitrifying-bacteria': { N: 1 }, 'phosphorus-bacteria': undefined });
  });
  it('wild events last 1 or 2 rounds and include Introduced Non-native Species', () => {
    const events = defaultRuleset().cards.filter(c => c.kind === 'event');
    expect(Object.fromEntries(events.map(c => [c.name, c.lifespan]))).toEqual({ 'Strong Rainfall': 1, 'Drought': 2, 'Heat Wave': 2, 'Flash Flood': 1, 'Introduced Non-native Species': 1 });
  });
});
