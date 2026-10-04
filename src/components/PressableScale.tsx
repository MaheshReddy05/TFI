import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '../engine/haptics';
import { motion } from '../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Scale while pressed. */
  scaleTo?: number;
  /** Haptic fired on commit (press-out). `false` for none. */
  haptic?: keyof typeof haptics | false;
}

/**
 * Pressable with physical press feedback: shrinks on press-in (feedback
 * before the tap completes), commits on press-out.
 */
export function PressableScale({
  style,
  children,
  scaleTo = 0.96,
  haptic = 'tap',
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.get(), [0, 1], [1, scaleTo]) }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      pressRetentionOffset={{ top: 24, left: 24, right: 24, bottom: 24 }}
      disabled={disabled}
      onPressIn={(e) => {
        pressed.set(withTiming(1, { duration: motion.press, easing: motion.easeOut }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withTiming(0, { duration: motion.quick, easing: motion.easeOut }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) haptics[haptic]();
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
