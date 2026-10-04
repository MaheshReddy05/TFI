import { useCallback, useMemo, useRef, useState } from 'react';

import type { ContentItem, Outcome, RoundRecord } from '../types/game';
import { scoreOf } from './scoring';

/**
 * Round state shared by every game: walks a pre-picked list of items, records
 * exactly one outcome per item and exposes the running score.
 *
 * `record` is guarded synchronously (via refs) so a double-tap, a swipe racing
 * a button press, or two tilt events in one frame can never score a card twice.
 */
export function useRoundSession<T extends ContentItem>(createItems: () => T[]) {
  const [items] = useState(createItems);
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<RoundRecord<T>[]>([]);

  const indexRef = useRef(0);
  const answeredIndexRef = useRef(-1);

  const record = useCallback(
    (outcome: Outcome): boolean => {
      const i = indexRef.current;
      if (i >= items.length || answeredIndexRef.current === i) return false;
      answeredIndexRef.current = i;
      const item = items[i];
      setRecords((prev) => [...prev, { item, outcome }]);
      return true;
    },
    [items],
  );

  /** Moves to the next item. Only allowed once the current one is answered. */
  const next = useCallback((): boolean => {
    if (answeredIndexRef.current !== indexRef.current) return false;
    indexRef.current += 1;
    setIndex(indexRef.current);
    return indexRef.current < items.length;
  }, [items.length]);

  const score = useMemo(() => scoreOf(records), [records]);

  return {
    items,
    index,
    total: items.length,
    current: items[index] as T | undefined,
    /** True once the current item has an outcome. */
    answered: records.length > index,
    /** True when every item has been played. */
    exhausted: index >= items.length,
    /** True when the next `next()` call would run out of items. */
    isLast: index >= items.length - 1,
    records,
    score,
    record,
    next,
  };
}
