import type { ContentItem, Outcome, RoundRecord } from '../types/game';

export function scoreOf(records: readonly { outcome: Outcome }[]): number {
  return records.reduce((sum, r) => sum + (r.outcome === 'correct' ? 1 : 0), 0);
}

export function countOf(records: readonly { outcome: Outcome }[], outcome: Outcome): number {
  return records.filter((r) => r.outcome === outcome).length;
}

export function recordsFor<T extends ContentItem>(
  records: readonly RoundRecord<T>[],
  outcome: Outcome,
): RoundRecord<T>[] {
  return records.filter((r) => r.outcome === outcome);
}

/** Box-office verdict for the end-of-round celebration. */
export function verdictFor(score: number, total: number): string {
  if (total === 0) return 'NO SHOW';
  const ratio = score / total;
  if (ratio >= 0.8) return 'BLOCKBUSTER!';
  if (ratio >= 0.6) return 'SUPER HIT!';
  if (ratio >= 0.4) return 'HIT!';
  if (ratio >= 0.2) return 'AVERAGE';
  return 'FLOP';
}

export function shouldCelebrate(score: number, total: number): boolean {
  return total > 0 && score / total >= 0.5;
}
