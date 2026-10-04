import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '../theme/tokens';

const NOTCH = 13;
const DASHES = 9;

/**
 * Cinema-ticket shape: a main panel and a stub separated by a perforated line
 * with half-circle notches punched out of each edge. The notches are discs in
 * the colour of whatever sits behind the ticket (`cutout`).
 */
export function Ticket({
  color,
  cutout,
  perforation,
  direction = 'column',
  stub,
  stubStyle,
  children,
  style,
  contentStyle,
}: {
  color: string;
  cutout: string;
  perforation: string;
  direction?: 'row' | 'column';
  stub?: ReactNode;
  stubStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const row = direction === 'row';
  return (
    <View style={[styles.ticket, { backgroundColor: color, flexDirection: direction }, style]}>
      <View style={[styles.main, contentStyle]}>{children}</View>
      {stub !== undefined && (
        <>
          <View style={row ? styles.dividerV : styles.dividerH}>
            <View style={row ? styles.dashesV : styles.dashesH}>
              {Array.from({ length: DASHES }, (_, i) => (
                <View
                  key={i}
                  style={[row ? styles.dashV : styles.dashH, { backgroundColor: perforation }]}
                />
              ))}
            </View>
            <View
              style={[styles.notch, { backgroundColor: cutout }, row ? styles.notchTop : styles.notchLeft]}
            />
            <View
              style={[styles.notch, { backgroundColor: cutout }, row ? styles.notchBottom : styles.notchRight]}
            />
          </View>
          <View style={stubStyle}>{stub}</View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  main: {
    flexGrow: 1,
    flexShrink: 1,
  },
  dividerV: {
    width: 2,
    alignSelf: 'stretch',
  },
  dividerH: {
    height: 2,
    alignSelf: 'stretch',
  },
  dashesV: {
    flex: 1,
    paddingVertical: NOTCH + 6,
    justifyContent: 'space-between',
  },
  dashesH: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: NOTCH + 6,
    justifyContent: 'space-between',
  },
  dashV: { width: 2, height: 6, borderRadius: 1 },
  dashH: { height: 2, width: 10, borderRadius: 1 },
  notch: {
    position: 'absolute',
    width: NOTCH * 2,
    height: NOTCH * 2,
    borderRadius: NOTCH,
  },
  notchTop: { top: -NOTCH, left: 1 - NOTCH },
  notchBottom: { bottom: -NOTCH, left: 1 - NOTCH },
  notchLeft: { left: -NOTCH, top: 1 - NOTCH },
  notchRight: { right: -NOTCH, top: 1 - NOTCH },
});
