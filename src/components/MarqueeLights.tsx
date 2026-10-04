import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { palette } from '../theme/tokens';

const GROUPS = 3;

/**
 * Theatre-marquee bulb strip with a slow three-phase chase. Purely
 * decorative; static (all lit) under Reduce Motion.
 */
export function MarqueeLights({ count = 13, color = palette.turmeric }: { count?: number; color?: string }) {
  const reduced = useReducedMotion();
  const phase = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    phase.set(withRepeat(withTiming(GROUPS, { duration: 1500, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(phase);
  }, [reduced, phase]);

  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => (
        <Bulb key={i} group={i % GROUPS} phase={phase} color={color} still={reduced} />
      ))}
    </View>
  );
}

function Bulb({
  group,
  phase,
  color,
  still,
}: {
  group: number;
  phase: SharedValue<number>;
  color: string;
  still: boolean;
}) {
  const style = useAnimatedStyle(() => {
    if (still) return { opacity: 1 };
    // Distance (around the loop) between this bulb's group and the chase head.
    const d = Math.abs(((phase.get() - group + GROUPS) % GROUPS) - 0.5);
    return { opacity: interpolate(d, [0, 1], [1, 0.28], 'clamp') };
  });
  return <Animated.View style={[styles.bulb, { backgroundColor: color, shadowColor: color }, style]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulb: {
    width: 9,
    height: 9,
    borderRadius: 5,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
