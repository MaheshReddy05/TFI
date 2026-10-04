import { describe, expect, it } from '@jest/globals';
import { choiceParam } from '../engine/params';
import { scoreOf, shouldCelebrate, verdictFor } from '../engine/scoring';
import { formatClock } from '../engine/useCountdown';

describe('scoring', () => {
  it('counts only correct outcomes', () => {
    expect(scoreOf([{ outcome: 'correct' }, { outcome: 'skipped' }, { outcome: 'wrong' }, { outcome: 'correct' }])).toBe(2);
  });

  it('awards box-office verdicts', () => {
    expect(verdictFor(0, 0)).toBe('NO SHOW');
    expect(verdictFor(9, 10)).toBe('BLOCKBUSTER!');
    expect(verdictFor(7, 10)).toBe('SUPER HIT!');
    expect(verdictFor(4, 10)).toBe('HIT!');
    expect(verdictFor(2, 10)).toBe('AVERAGE');
    expect(verdictFor(1, 10)).toBe('FLOP');
    expect(shouldCelebrate(5, 10)).toBe(true);
    expect(shouldCelebrate(4, 10)).toBe(false);
    expect(shouldCelebrate(0, 0)).toBe(false);
  });
});

describe('helpers', () => {
  it('formats the round clock', () => {
    expect(formatClock(60)).toBe('1:00');
    expect(formatClock(9)).toBe('0:09');
    expect(formatClock(-3)).toBe('0:00');
  });

  it('only accepts known option values', () => {
    expect(choiceParam('90', [30, 60, 90], 60)).toBe(90);
    expect(choiceParam('45', [30, 60, 90], 60)).toBe(60);
    expect(choiceParam(undefined, [30, 60, 90], 60)).toBe(60);
    expect(choiceParam(['5'], [5, 10, 15], 10)).toBe(5);
  });
});
