import * as Haptics from 'expo-haptics';

/**
 * One place for every haptic in the app, so each moment has a consistent
 * feel. Always paired with a visual — haptics are off for many users.
 * Failures (simulators, unsupported hardware) are swallowed.
 */
const safe = (p: Promise<void>) => {
  p.catch(() => {});
};

export const haptics = {
  /** Button press, option chip. */
  tap: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Countdown tick, value stepping. */
  tick: () => safe(Haptics.selectionAsync()),
  /** Countdown GO, card lands. */
  thud: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Correct answer. */
  correct: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Skip / wrong — deliberately subtle. */
  soft: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  /** Time's up. */
  alarm: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
