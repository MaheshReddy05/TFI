import { StyleSheet, View } from 'react-native';

import type { GameOption } from '../data/games';
import { radius, space } from '../theme/tokens';
import { PressableScale } from './PressableScale';
import { T } from './Typography';

/** Segmented chooser for round length / number of rounds / controls. */
export function OptionPicker({
  option,
  value,
  onChange,
  fg,
  selectedBg,
  selectedFg,
}: {
  option: GameOption;
  value: string;
  onChange: (value: string) => void;
  fg: string;
  selectedBg: string;
  selectedFg: string;
}) {
  return (
    <View style={styles.wrap}>
      <T variant="label" color={fg} style={styles.label}>
        {option.label}
      </T>
      <View style={[styles.track, { borderColor: fg }]} accessibilityRole="radiogroup">
        {option.choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <PressableScale
              key={choice.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label}: ${choice.label}`}
              haptic={selected ? false : 'tick'}
              onPress={() => onChange(choice.value)}
              style={[styles.chip, selected && { backgroundColor: selectedBg }]}
            >
              <T variant="black" size={17} color={selected ? selectedFg : fg}>
                {choice.label}
              </T>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
  },
  label: {
    opacity: 0.85,
  },
  track: {
    flexDirection: 'row',
    borderWidth: 2.5,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  chip: {
    flex: 1,
    height: 46,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
