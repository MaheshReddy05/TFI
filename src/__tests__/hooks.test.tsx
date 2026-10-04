import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useCountdown } from '../engine/useCountdown';
import { useRoundSession } from '../engine/useRoundSession';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('useRoundSession', () => {
  it('records one outcome per item and blocks double scoring', async () => {
    const { result } = await renderHook(() => useRoundSession(() => items));
    await act(() => {
      expect(result.current.record('correct')).toBe(true);
      // Second input on the same card (double tap / swipe + button) is ignored.
      expect(result.current.record('correct')).toBe(false);
      expect(result.current.record('wrong')).toBe(false);
    });
    expect(result.current.score).toBe(1);
    expect(result.current.records).toHaveLength(1);
  });

  it('cannot advance past an unanswered card and reports the end', async () => {
    const { result } = await renderHook(() => useRoundSession(() => items));
    await act(() => {
      expect(result.current.next()).toBe(false);
    });
    expect(result.current.index).toBe(0);

    const advanced: boolean[] = [];
    for (const outcome of ['correct', 'skipped', 'correct'] as const) {
      await act(() => {
        result.current.record(outcome);
      });
      await act(() => {
        advanced.push(result.current.next());
      });
    }
    expect(advanced).toEqual([true, true, false]);
    expect(result.current.exhausted).toBe(true);
    expect(result.current.score).toBe(2);
    expect(result.current.records.map((r) => r.item.id)).toEqual(['a', 'b', 'c']);
    await act(() => {
      expect(result.current.record('correct')).toBe(false);
    });
  });

  it('keeps the same items across re-renders', async () => {
    const create = jest.fn(() => items.slice());
    const { result, rerender } = await renderHook(() => useRoundSession(create));
    const first = result.current.items;
    await rerender({});
    expect(result.current.items).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down, pauses, resumes and expires exactly once', async () => {
    const onExpire = jest.fn();
    const { result, rerender } = await renderHook(
      ({ running }: { running: boolean }) => useCountdown({ durationMs: 3000, running, onExpire }),
      { initialProps: { running: true } },
    );
    expect(result.current.secondsLeft).toBe(3);

    await act(() => jest.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(2);

    // Paused (e.g. "Leave this round?" dialog): no time passes.
    await rerender({ running: false });
    await act(() => jest.advanceTimersByTime(5000));
    expect(result.current.secondsLeft).toBe(2);
    expect(onExpire).not.toHaveBeenCalled();

    await rerender({ running: true });
    await act(() => jest.advanceTimersByTime(2100));
    expect(result.current.expired).toBe(true);
    await act(() => jest.advanceTimersByTime(2000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
