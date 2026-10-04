import { Easing } from 'react-native-reanimated';

/**
 * TFI design tokens.
 *
 * Identity: a movie-night marquee — warm theatre-black, ticket-paper cream and
 * three loud poster colours (chilli, turmeric, electric) that each own a game.
 */
export const palette = {
  ink: '#150E0C',
  inkRaised: '#241915',
  inkLine: '#3A2B25',
  paper: '#FFF3DE',
  paperShade: '#F1DFC0',
  chilli: '#F23A1D',
  chilliDeep: '#B9230F',
  turmeric: '#FFC414',
  turmericDeep: '#D99A00',
  electric: '#2B4BFF',
  electricDeep: '#1A2FB8',
  leaf: '#14C172',
  leafDeep: '#0A8A50',
  rose: '#FF3D5A',
  marigold: '#FF8A1F',
  white: '#FFFFFF',
} as const;

export const fonts = {
  /** Condensed poster type — titles, scores, movie names. */
  display: 'Anton_400Regular',
  body: 'Archivo_600SemiBold',
  bold: 'Archivo_800ExtraBold',
  black: 'Archivo_900Black',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/** Minimum comfortable touch target (pt / dp). */
export const TOUCH = 52;

export const motion = {
  /** Strong ease-out for anything entering or leaving. */
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  /** On-screen movement. */
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  press: 120,
  quick: 180,
  card: 260,
  /** Spring after a drag — carries the finger's velocity. */
  snapBack: { duration: 400, dampingRatio: 0.8 },
  settle: { duration: 400, dampingRatio: 1 },
} as const;

export interface GameTheme {
  /** Full-screen colour field. */
  bg: string;
  /** Text on the colour field. */
  fg: string;
  /** Secondary punch colour used for buttons/highlights on the field. */
  accent: string;
  /** Text on the accent. */
  onAccent: string;
  /** Darker shade for depth (ticket stubs, pressed states). */
  deep: string;
}

export const gameThemes = {
  'movie-on-my-head': {
    bg: palette.chilli,
    fg: palette.paper,
    accent: palette.turmeric,
    onAccent: palette.ink,
    deep: palette.chilliDeep,
  },
  'whats-common': {
    bg: palette.turmeric,
    fg: palette.ink,
    accent: palette.ink,
    onAccent: palette.turmeric,
    deep: palette.turmericDeep,
  },
  'before-or-after': {
    bg: palette.electric,
    fg: palette.paper,
    accent: palette.turmeric,
    onAccent: palette.ink,
    deep: palette.electricDeep,
  },
} as const satisfies Record<string, GameTheme>;
