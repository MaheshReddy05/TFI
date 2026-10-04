import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { DEFAULT_TILT_CONFIG } from '../engine/tilt';
import { palette, radius, space } from '../theme/tokens';
import { T } from './Typography';

/** Degrees mapped across the full width of the track. */
const RANGE = 70;
const TRIGGER = DEFAULT_TILT_CONFIG.triggerDeg;
const DOT = 22;

/**
 * Live readout of how the phone is tilted right now, shown before the round
 * starts. It doubles as a sensor check: if the dot never moves, motion data
 * isn't arriving and the screen falls back to buttons.
 *
 * Tilting the screen toward the floor reads negative, so Correct sits on the
 * left and Skip on the right.
 */
export function TiltMeter({ pitch, width }: { pitch: SharedValue<number>; width: number }) {
  const travel = (width - DOT) / 2;

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(pitch.get(), [-RANGE, RANGE], [-travel, travel], 'clamp') }],
  }));
  const correctStyle = useAnimatedStyle(() => ({ opacity: pitch.get() <= -TRIGGER ? 1 : 0.35 }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: pitch.get() >= TRIGGER ? 1 : 0.35 }));

  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.row}>
        <Animated.View style={[styles.chip, { backgroundColor: palette.leaf }, correctStyle]}>
          <T variant="black" color={palette.white} size={13} style={styles.chipText}>
            ↓ Correct
          </T>
        </Animated.View>

        <View style={[styles.track, { width }]}>
          {/* Trigger marks: past these, a tilt registers. */}
          <View style={[styles.mark, { left: markOffset(width, -TRIGGER) }]} />
          <View style={[styles.mark, { left: markOffset(width, TRIGGER) }]} />
          <Animated.View style={[styles.dot, dotStyle]} />
        </View>

        <Animated.View style={[styles.chip, { backgroundColor: palette.marigold }, skipStyle]}>
          <T variant="black" color={palette.ink} size={13} style={styles.chipText}>
            ↑ Skip
          </T>
        </Animated.View>
      </View>
      <T variant="label" color={palette.paper} size={10} align="center" style={styles.caption}>
        Tilt to test · the dot follows your phone
      </T>
    </View>
  );
}

function markOffset(width: number, deg: number): number {
  return (width / 2) * (1 + deg / RANGE) - 1;
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  chipText: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  track: {
    height: DOT + 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,243,222,0.45)',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: palette.paper,
  },
  caption: {
    opacity: 0.6,
  },
});
