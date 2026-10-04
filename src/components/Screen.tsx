import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

/**
 * Full-bleed colour field that respects notches / home indicators on the
 * requested edges. Every screen in TFI is one of these.
 */
export function Screen({
  bg,
  statusBar = 'light',
  hideStatusBar = false,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  children,
}: {
  bg: string;
  statusBar?: 'light' | 'dark';
  hideStatusBar?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: bg,
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: edges.includes('left') ? insets.left : 0,
          paddingRight: edges.includes('right') ? insets.right : 0,
        },
        style,
      ]}
    >
      <StatusBar style={statusBar} hidden={hideStatusBar} animated />
      {children}
    </View>
  );
}
