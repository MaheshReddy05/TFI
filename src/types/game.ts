/**
 * Shared content + engine types for every TFI game.
 *
 * Content files in `src/data` only ever describe *data* using these shapes;
 * screens and the engine never hard-code individual questions.
 */

export type GameId = 'movie-on-my-head' | 'whats-common' | 'before-or-after';

/** Every piece of content carries a stable id so sessions can de-duplicate. */
export interface ContentItem {
  id: string;
}

/** Game 1 — a single title shown on the forehead card. */
export interface MovieCard extends ContentItem {
  title: string;
}

/** Game 2 — three clues that share one connection. */
export interface WhatsCommonRound extends ContentItem {
  clues: readonly [string, string, string];
  answer: string;
}

/** A movie with its release year — answer metadata for Before or After. */
export interface MovieRelease {
  title: string;
  year: number;
}

/** Game 3 — two movies; `correct` points at the one released first. */
export interface BeforeOrAfterMatchup extends ContentItem {
  a: MovieRelease;
  b: MovieRelease;
  correct: 'a' | 'b';
}

/** How a single card / round was resolved. */
export type Outcome = 'correct' | 'wrong' | 'skipped';

export interface RoundRecord<T extends ContentItem> {
  item: T;
  outcome: Outcome;
}

/** A game-agnostic line on the results screen. */
export interface ResultLine {
  id: string;
  outcome: Outcome;
  title: string;
  detail?: string;
}

/** Everything the results screen needs — produced by each game when it ends. */
export interface SessionResult {
  gameId: GameId;
  score: number;
  total: number;
  lines: ResultLine[];
  /** Search params needed to replay with identical settings. */
  replayParams: Record<string, string>;
}
