import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { TOUCH, radius, space } from '../theme/tokens';
import { PressableScale } from './PressableScale';
import { ScoreChip } from './ScoreChip';
import { T } from './Typography';

/** Exit · progress · score — the same bar on every portrait game screen. */
export function GameTopBar({
  onExit,
  center,
  score,
  fg,
  chipBg,
  chipFg,
  plusColor,
}: {
  onExit: () => void;
  center: ReactNode;
  score: number;
  fg: string;
  chipBg: string;
  chipFg: string;
  plusColor: string;
}) {
  return (
    <View style={styles.bar}>
      <ExitButton onPress={onExit} color={fg} />
      <View style={styles.center}>{center}</View>
      <ScoreChip score={score} bg={chipBg} fg={chipFg} plusColor={plusColor} />
    </View>
  );
}

export function ExitButton({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel="Leave round"
      style={[styles.exit, { borderColor: color }]}
      haptic={false}
    >
      <Ionicons name="close" size={26} color={color} />
    </PressableScale>
  );
}

export function RoundLabel({ index, total, color }: { index: number; total: number; color: string }) {
  return (
    <View style={styles.roundLabel} accessible accessibilityLabel={`Round ${index} of ${total}`}>
      <T variant="label" color={color} size={11}>
        Round
      </T>
      <T variant="display" color={color} size={24}>
        {index}
        <T variant="display" color={color} size={16} style={{ opacity: 0.6 }}>
          {' '}/ {total}
        </T>
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    minHeight: TOUCH + space.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  exit: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundLabel: {
    alignItems: 'center',
  },
});
