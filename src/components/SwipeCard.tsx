import { useImperativeHandle, useMemo, type ReactNode, type Ref } from 'react';
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '../engine/haptics';
import { fonts, motion, palette, radius } from '../theme/tokens';
import { T } from './Typography';

export type SwipeDirection = 'left' | 'right';

export interface SwipeCardHandle {
  /** Animate the card off-screen as if swiped (used by the tap buttons). */
  fling: (direction: SwipeDirection) => void;
}

const EASE_OUT = motion.easeOut;
const SNAP_BACK = motion.snapBack;
const FLICK_VELOCITY = 900;

/**
 * A card the Reader swipes right (correct) or left (wrong).
 *
 * Accidental-swipe protection: the pan only activates after a clear
 * horizontal movement, and a release short of the threshold (unless it was a
 * deliberate flick) springs the card home with the finger's velocity.
 */
export function SwipeCard({
  ref,
  enabled,
  onSwipe,
  children,
  style,
  rightLabel = 'CORRECT',
  leftLabel = 'WRONG',
}: {
  ref?: Ref<SwipeCardHandle>;
  enabled: boolean;
  onSwipe: (direction: SwipeDirection) => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  rightLabel?: string;
  leftLabel?: string;
}) {
  const { width } = useWindowDimensions();
  const threshold = Math.min(130, width * 0.28);
  const offscreen = width * 1.4;

  const tx = useSharedValue(0);
  const committed = useSharedValue(false);

  useImperativeHandle(
    ref,
    () => ({
      fling: (direction) => {
        if (committed.get()) return;
        committed.set(true);
        const sign = direction === 'right' ? 1 : -1;
        tx.set(withTiming(sign * offscreen, { duration: 240, easing: EASE_OUT }));
        onSwipe(direction);
      },
    }),
    [committed, tx, offscreen, onSwipe],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX([-14, 14])
        .failOffsetY([-28, 28])
        .onUpdate((e) => {
          if (committed.get()) return;
          tx.set(e.translationX);
        })
        .onEnd((e) => {
          if (committed.get()) return;
          const dx = e.translationX;
          const vx = e.velocityX;
          const flick = Math.abs(vx) > FLICK_VELOCITY && Math.sign(vx) === Math.sign(dx) && Math.abs(dx) > 24;
          if (Math.abs(dx) > threshold || flick) {
            const sign = dx > 0 ? 1 : -1;
            committed.set(true);
            tx.set(withTiming(sign * offscreen, { duration: 220, easing: EASE_OUT }));
            scheduleOnRN(onSwipe, sign > 0 ? 'right' : 'left');
          } else {
            tx.set(withSpring(0, { ...SNAP_BACK, velocity: vx }));
          }
        }),
    [enabled, threshold, offscreen, onSwipe, committed, tx],
  );

  // One tick as the drag crosses the commit line, so the Reader can feel it.
  useAnimatedReaction(
    () => Math.abs(tx.get()) > threshold,
    (past, wasPast) => {
      if (past && wasPast === false && !committed.get()) scheduleOnRN(haptics.tick);
    },
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.get() },
      { rotate: `${interpolate(tx.get(), [-width, 0, width], [-14, 0, 14])}deg` },
    ],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.get(), [0, threshold], [0, 0.92], Extrapolation.CLAMP),
  }));
  const leftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.get(), [-threshold, 0], [0.92, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[style, cardStyle]}>
        {children}
        <Animated.View pointerEvents="none" style={[styles.tint, { backgroundColor: palette.leaf }, rightStyle]}>
          <View style={[styles.stamp, styles.stampLeft]}>
            <T style={styles.stampText} color={palette.white}>
              {rightLabel} ✓
            </T>
          </View>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.tint, { backgroundColor: palette.rose }, leftStyle]}>
          <View style={[styles.stamp, styles.stampRight]}>
            <T style={styles.stampText} color={palette.white}>
              ✕ {leftLabel}
            </T>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  tint: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    borderWidth: 4,
    borderColor: palette.white,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  stampLeft: { transform: [{ rotate: '-10deg' }] },
  stampRight: { transform: [{ rotate: '10deg' }] },
  stampText: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: 1,
  },
});
