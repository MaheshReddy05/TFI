import type { GameId } from '../types/game';

/**
 * Game catalogue — the copy and settings each game exposes on Home and on its
 * How to Play screen. Adding a game means adding an entry here plus a play
 * route; nothing on Home is hard-coded per game.
 */

export interface GameOption {
  /** Search param name passed to the play route. */
  param: 'seconds' | 'rounds' | 'controls';
  label: string;
  choices: readonly { value: string; label: string }[];
  defaultValue: string;
}

export interface GameInfo {
  id: GameId;
  emoji: string;
  title: string;
  /** Title broken for the oversized intro layout. */
  titleLines: readonly string[];
  tagline: string;
  players: string;
  steps: readonly string[];
  options: readonly GameOption[];
  /** Expo Router path for gameplay. */
  playPath: `/play/${GameId}`;
}

export const games: readonly GameInfo[] = [
  {
    id: 'movie-on-my-head',
    emoji: '🎬',
    title: 'Movie on My Head',
    titleLines: ['MOVIE', 'ON MY', 'HEAD'],
    tagline: 'Hold it. Guess it. Tilt it.',
    players: '3+ players',
    steps: [
      'One person holds the phone against their forehead with the screen facing the other players.',
      'The other players give clues until the person guesses the movie.',
      'Do not say the movie title itself.',
      'Tilt the phone DOWN when you get it right. Tilt UP to skip.',
    ],
    options: [
      {
        param: 'seconds',
        label: 'Round length',
        choices: [
          { value: '30', label: '30s' },
          { value: '60', label: '60s' },
          { value: '90', label: '90s' },
        ],
        defaultValue: '60',
      },
      {
        param: 'controls',
        label: 'Controls',
        choices: [
          { value: 'tilt', label: 'Tilt' },
          { value: 'tap', label: 'Buttons' },
        ],
        defaultValue: 'tilt',
      },
    ],
    playPath: '/play/movie-on-my-head',
  },
  {
    id: 'whats-common',
    emoji: '🔗',
    title: "What's Common?",
    titleLines: ["WHAT'S", 'COMMON?'],
    tagline: 'Three clues. One connection.',
    players: '2+ players',
    steps: [
      'One person holds the phone and becomes the Reader. Everyone else is a Guesser.',
      'The Reader reads the three clues aloud.',
      'The Guesser names what connects all three.',
      'Tap SHOW ANSWER, then swipe right if they got it, left if they missed.',
    ],
    options: [
      {
        param: 'rounds',
        label: 'Rounds',
        choices: [
          { value: '5', label: '5' },
          { value: '10', label: '10' },
          { value: '15', label: '15' },
        ],
        defaultValue: '10',
      },
    ],
    playPath: '/play/whats-common',
  },
  {
    id: 'before-or-after',
    emoji: '⏳',
    title: 'Before or After?',
    titleLines: ['BEFORE', 'OR AFTER?'],
    tagline: 'Which one came first?',
    players: '2+ players',
    steps: [
      'One person holds the phone and becomes the Reader. Everyone else is a Guesser.',
      'The Reader reads both movies aloud.',
      'The Guesser says which one was released first.',
      'Hold PEEK to check privately, then swipe right if correct, left if wrong.',
    ],
    options: [
      {
        param: 'rounds',
        label: 'Matchups',
        choices: [
          { value: '5', label: '5' },
          { value: '10', label: '10' },
          { value: '15', label: '15' },
        ],
        defaultValue: '10',
      },
    ],
    playPath: '/play/before-or-after',
  },
];

export function getGame(id: string | undefined): GameInfo | undefined {
  return games.find((g) => g.id === id);
}
