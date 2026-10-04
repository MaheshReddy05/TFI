import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { fonts, motion, radius } from '../theme/tokens';
import { T } from './Typography';

const plusOne = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 4 }] },
  20: { opacity: 1, transform: [{ translateY: -4 }] },
  100: { opacity: 0, transform: [{ translateY: -26 }] },
}).duration(700);

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
  const prev = useRef(score);
  const [bumps, setBumps] = useState(0);

  useEffect(() => {
    if (score > prev.current) {
      scale.set(
        withSequence(
          withTiming(1.28, { duration: 90, easing: motion.easeOut }),
          withSpring(1, { duration: 350, dampingRatio: 0.5 }),
        ),
      );
      setBumps((b) => b + 1);
    }
    prev.current = score;
  }, [score, scale]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
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
      {bumps > 0 && (
        <Animated.View key={bumps} entering={plusOne} style={styles.plus} pointerEvents="none">
          <T variant="black" color={plusColor} size={18}>
            +1
          </T>
        </Animated.View>
      )}
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
    opacity: 0,
  },
});
