import { describe, expect, it } from 'vitest';
import { interpretations } from '../../src/data/interpretations';

describe('D7 — interpretations', () => {
  it('lists every major and minor inference from Appendix A', () => {
    const required = [
      ...Array.from({ length: 5 }, (_, index) => `R${index + 1}`),
      ...Array.from({ length: 17 }, (_, index) => `I${index + 1}`),
    ];
    expect(interpretations.map(item => item.id)).toEqual(expect.arrayContaining(required));
  });
});
