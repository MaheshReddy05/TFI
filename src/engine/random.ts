export type RandomFn = () => number;

/** Fisher–Yates shuffle. Returns a new array; the input is never mutated. */
export function shuffle<T>(items: readonly T[], random: RandomFn = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks `count` distinct items for one session. Items sharing an id are
 * treated as the same item, so a session can never repeat a card.
 */
export function pickSession<T extends { id: string }>(
  items: readonly T[],
  count: number,
  random: RandomFn = Math.random,
): T[] {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return shuffle(unique, random).slice(0, Math.max(0, count));
}

/** Coin flip helper used to randomise display order. */
export function flip(random: RandomFn = Math.random): boolean {
  return random() < 0.5;
}
