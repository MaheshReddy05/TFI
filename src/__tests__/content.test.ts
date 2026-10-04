import { describe, expect, it } from '@jest/globals';
import { beforeOrAfterMatchups } from '../data/beforeOrAfter';
import { games } from '../data/games';
import { movieOnMyHeadCards } from '../data/movieOnMyHead';
import { validateContent } from '../data/validate';
import { whatsCommonRounds } from '../data/whatsCommon';

describe('local content', () => {
  it('passes structural validation', () => {
    expect(
      validateContent({
        movieOnMyHead: movieOnMyHeadCards,
        whatsCommon: whatsCommonRounds,
        beforeOrAfter: beforeOrAfterMatchups,
      }),
    ).toEqual([]);
  });

  it('ships the full V1 datasets', () => {
    expect(movieOnMyHeadCards).toHaveLength(30);
    expect(whatsCommonRounds).toHaveLength(30);
    expect(beforeOrAfterMatchups).toHaveLength(30);
  });

  it('keeps supplied answers intact', () => {
    expect(whatsCommonRounds[0]).toEqual({
      id: 'wc-001',
      clues: ['Athadu', 'Khaleja', 'Guntur Kaaram'],
      answer: 'Mahesh Babu + Trivikram',
    });
    expect(beforeOrAfterMatchups[0]).toMatchObject({
      a: { title: 'Athadu', year: 2005 },
      b: { title: 'Pokiri', year: 2006 },
      correct: 'a',
    });
  });

  it('validation catches broken entries', () => {
    const problems = validateContent({
      movieOnMyHead: [{ id: 'x', title: 'A' }, { id: 'x', title: '' }],
      whatsCommon: [{ id: 'w', clues: ['a', 'b', ''], answer: '' }],
      beforeOrAfter: [{ id: 'b', a: { title: 'A', year: 2010 }, b: { title: 'B', year: 2005 }, correct: 'a' }],
    });
    expect(problems.length).toBeGreaterThanOrEqual(4);
  });

  it('defines exactly the three V1 games', () => {
    expect(games.map((g) => g.id)).toEqual(['movie-on-my-head', 'whats-common', 'before-or-after']);
    for (const g of games) {
      for (const o of g.options) expect(o.choices.map((c) => c.value)).toContain(o.defaultValue);
    }
  });
});
