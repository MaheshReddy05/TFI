import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Keyframe } from 'react-native-reanimated';

import type { Outcome } from '../types/game';
import { fonts, motion, palette } from '../theme/tokens';
import { T } from './Typography';

const flashColors: Record<Outcome, { bg: string; fg: string }> = {
  correct: { bg: palette.leaf, fg: palette.white },
  skipped: { bg: palette.marigold, fg: palette.ink },
  wrong: { bg: palette.rose, fg: palette.white },
};

const pop = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.88 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: motion.easeOut },
}).duration(200);

/** Full-screen verdict flash used between cards. Kept short so play never stalls. */
export function FeedbackFlash({
  outcome,
  label,
  sub,
  size,
}: {
  outcome: Outcome;
  label: string;
  sub?: string;
  size: number;
}) {
  const c = flashColors[outcome];
  return (
    <Animated.View
      entering={FadeIn.duration(80)}
      exiting={FadeOut.duration(160)}
      style={[StyleSheet.absoluteFill, styles.wrap, { backgroundColor: c.bg }]}
      pointerEvents="none"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={label}
    >
      <Animated.View entering={pop} style={styles.center}>
        <T
          maxFontSizeMultiplier={1}
          numberOfLines={1}
          adjustsFontSizeToFit
          color={c.fg}
          style={{ fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.15, textAlign: 'center' }}
        >
          {label}
        </T>
        {sub ? (
          <View style={styles.sub}>
            <T variant="black" color={c.fg} size={18} align="center" numberOfLines={2}>
              {sub}
            </T>
          </View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  sub: {
    marginTop: 8,
  },
});
