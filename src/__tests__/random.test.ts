import { describe, expect, it } from '@jest/globals';
import { pickSession, shuffle } from '../engine/random';

/** Deterministic generator so shuffles are reproducible in tests. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const items = Array.from({ length: 30 }, (_, i) => ({ id: `id-${i}` }));

describe('shuffle', () => {
  it('keeps every item exactly once and does not mutate the input', () => {
    const input = items.slice();
    const out = shuffle(input, seeded(42));
    expect(out).toHaveLength(input.length);
    expect(new Set(out.map((x) => x.id)).size).toBe(input.length);
    expect(input).toEqual(items);
  });

  it('produces different orders for different seeds', () => {
    const a = shuffle(items, seeded(1)).map((x) => x.id).join();
    const b = shuffle(items, seeded(2)).map((x) => x.id).join();
    expect(a).not.toEqual(b);
  });
});

describe('pickSession', () => {
  it('returns the requested number of unique items', () => {
    for (let seed = 1; seed < 50; seed++) {
      const session = pickSession(items, 10, seeded(seed));
      expect(session).toHaveLength(10);
      expect(new Set(session.map((x) => x.id)).size).toBe(10);
    }
  });

  it('never repeats an id even if the source contains duplicates', () => {
    const withDupes = [...items, { id: 'id-0' }, { id: 'id-1' }];
    const session = pickSession(withDupes, 40, seeded(3));
    expect(session).toHaveLength(30);
    expect(new Set(session.map((x) => x.id)).size).toBe(30);
  });

  it('handles counts larger than the pool and zero', () => {
    expect(pickSession(items, 100)).toHaveLength(30);
    expect(pickSession(items, 0)).toHaveLength(0);
  });
});
