import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { fonts, motion, radius } from '../theme/tokens';
import { T } from './Typography';

const PLUS_MS = 700;

/** Running score with a pop + floating "+1" whenever it goes up. */
export function ScoreChip({
  score,
  bg,
  fg,
  plusColor,
  size = 'md',
}: {
  score: number;
  bg: string;
  fg: string;
  plusColor: string;
  size?: 'md' | 'lg';
}) {
  const scale = useSharedValue(1);
  /** 0 → 1 once per point. Drives the "+1" float entirely on the UI thread. */
  const plus = useSharedValue(0);
  const prev = useRef(score);

  useEffect(() => {
    if (score > prev.current) {
      scale.set(
        withSequence(
          withTiming(1.28, { duration: 90, easing: motion.easeOut }),
          withSpring(1, { duration: 350, dampingRatio: 0.5 }),
        ),
      );
      plus.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: PLUS_MS })));
    }
    prev.current = score;
  }, [score, scale, plus]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  // Rises and fades out; rests at opacity 0, so it never needs to mount or unmount.
  const plusStyle = useAnimatedStyle(() => {
    const p = plus.get();
    return {
      opacity: interpolate(p, [0, 0.2, 1], [0, 1, 0], 'clamp'),
      transform: [{ translateY: interpolate(p, [0, 0.2, 1], [4, -4, -26], 'clamp') }],
    };
  });

  const big = size === 'lg';

  return (
    <View accessible accessibilityLabel={`Score ${score}`}>
      <Animated.View
        style={[styles.chip, { backgroundColor: bg, minWidth: big ? 72 : 58, height: big ? 56 : 48 }, popStyle]}
      >
        <T variant="label" color={fg} size={big ? 10 : 9} style={styles.caption}>
          Score
        </T>
        <T color={fg} style={{ fontFamily: fonts.display, fontSize: big ? 26 : 22, lineHeight: big ? 30 : 26 }}>
          {score}
        </T>
      </Animated.View>
      {/* Always mounted, so it stays hidden from screen readers on both platforms. */}
      <Animated.View
        style={[styles.plus, plusStyle]}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <T variant="black" color={plusColor} size={18}>
          +1
        </T>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  caption: {
    letterSpacing: 1.5,
    marginBottom: -2,
  },
  plus: {
    position: 'absolute',
    bottom: -26,
    alignSelf: 'center',
  },
});
