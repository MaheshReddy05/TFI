import type { SessionResult } from '../types/game';

/**
 * In-memory hand-off from a finished game to the results screen.
 * Nothing is persisted — TFI stores no personal data.
 */
let lastResult: SessionResult | null = null;

export function setLastResult(result: SessionResult) {
  lastResult = result;
}

export function getLastResult(): SessionResult | null {
  return lastResult;
}
