import { describe, expect, it } from 'vitest';
import { interpretations } from '../../src/data/interpretations';

describe('U13 in-app Interpretations', () => {
  it('lists exactly R1-R5 and I1-I11 with nonempty text and major flags', () => {
    const ids = [...Array.from({ length: 5 }, (_, i) => `R${i + 1}`), ...Array.from({ length: 11 }, (_, i) => `I${i + 1}`)];
    expect(interpretations.map(i => i.id)).toEqual(ids); expect(new Set(interpretations.map(i => i.id)).size).toBe(16);
    for (const item of interpretations) { expect(item.topic.trim().length).toBeGreaterThan(0); expect(item.text.trim().length).toBeGreaterThan(10); expect(item.major).toBe(item.id.startsWith('R')); }
  });
});
