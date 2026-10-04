import { StyleSheet, View } from 'react-native';

import { palette, space } from '../theme/tokens';
import { BigButton } from './BigButton';

/** ← WRONG · CORRECT → — tappable twins of the swipe gesture. */
export function JudgeButtons({
  onWrong,
  onCorrect,
  disabled,
  base = palette.ink,
}: {
  onWrong: () => void;
  onCorrect: () => void;
  disabled?: boolean;
  base?: string;
}) {
  return (
    <View style={styles.row}>
      <BigButton
        label="Wrong"
        iconLeft="arrow-back"
        onPress={onWrong}
        bg={palette.rose}
        fg={palette.white}
        base={base}
        size="md"
        haptic={false}
        disabled={disabled}
        style={styles.button}
        accessibilityHint="Marks the guess wrong. You can also swipe the card left."
      />
      <BigButton
        label="Correct"
        iconRight="arrow-forward"
        onPress={onCorrect}
        bg={palette.leaf}
        fg={palette.white}
        base={base}
        size="md"
        haptic={false}
        disabled={disabled}
        style={styles.button}
        accessibilityHint="Marks the guess correct. You can also swipe the card right."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.md,
  },
  button: {
    flex: 1,
  },
});
