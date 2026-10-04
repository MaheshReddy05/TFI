import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { haptics } from '../engine/haptics';
import { motion, palette, radius } from '../theme/tokens';
import { T } from './Typography';

type IconName = ComponentProps<typeof Ionicons>['name'];

const DEPTH = 5;

export interface BigButtonProps {
  label: string;
  onPress: () => void;
  /** Face colour. */
  bg?: string;
  /** Label colour. */
  fg?: string;
  /** The hard "poster" shadow block under the face. */
  base?: string;
  variant?: 'solid' | 'outline';
  size?: 'lg' | 'md';
  iconLeft?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  haptic?: keyof typeof haptics | false;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Chunky poster button: the face sits on a solid offset block and physically
 * presses down onto it.
 */
export function BigButton({
  label,
  onPress,
  bg = palette.paper,
  fg = palette.ink,
  base = palette.ink,
  variant = 'solid',
  size = 'lg',
  iconLeft,
  iconRight,
  disabled,
  haptic = 'tap',
  style,
  accessibilityLabel,
  accessibilityHint,
}: BigButtonProps) {
  const pressed = useSharedValue(0);
  const solid = variant === 'solid';
  const depth = solid ? DEPTH : 0;

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.get() * depth }],
  }));

  const height = size === 'lg' ? 64 : 54;
  const fontSize = size === 'lg' ? 20 : 17;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={6}
      pressRetentionOffset={{ top: 24, left: 24, right: 24, bottom: 24 }}
      onPressIn={() => pressed.set(withTiming(1, { duration: 80, easing: motion.easeOut }))}
      onPressOut={() => pressed.set(withTiming(0, { duration: motion.quick, easing: motion.easeOut }))}
      onPress={() => {
        if (haptic) haptics[haptic]();
        onPress();
      }}
      style={[{ paddingBottom: depth, opacity: disabled ? 0.45 : 1 }, style]}
    >
      {solid && (
        <View
          style={[StyleSheet.absoluteFill, { top: depth, backgroundColor: base, borderRadius: radius.md }]}
        />
      )}
      <Animated.View
        style={[
          styles.face,
          { height, backgroundColor: solid ? bg : 'transparent' },
          !solid && { borderWidth: 2.5, borderColor: fg },
          faceStyle,
        ]}
      >
        {iconLeft && <Ionicons name={iconLeft} size={fontSize + 4} color={fg} />}
        <T
          variant="black"
          color={fg}
          size={fontSize}
          style={styles.label}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {label}
        </T>
        {iconRight && <Ionicons name={iconRight} size={fontSize + 4} color={fg} />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  label: {
    flexShrink: 1,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
