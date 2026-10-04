/** Reads a numeric search param, accepting only known choices. */
export function choiceParam(
  value: string | string[] | undefined,
  allowed: readonly number[],
  fallback: number,
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return allowed.includes(n) ? n : fallback;
}
