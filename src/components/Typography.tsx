import { Text, type TextProps, type TextStyle } from 'react-native';

import { fonts, palette } from '../theme/tokens';

type Variant = 'display' | 'label' | 'body' | 'bold' | 'black';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, letterSpacing: 0.5, textTransform: 'uppercase' },
  label: { fontFamily: fonts.black, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },
  bold: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  black: { fontFamily: fonts.black, fontSize: 16 },
};

export interface TProps extends TextProps {
  variant?: Variant;
  color?: string;
  size?: number;
  align?: TextStyle['textAlign'];
}

/**
 * The only text primitive in the app. Display text is capped at 1.3× system
 * font scaling so oversized poster type can't overflow its container.
 */
export function T({ variant = 'body', color = palette.paper, size, align, style, ...rest }: TProps) {
  const isDisplay = variant === 'display';
  return (
    <Text
      maxFontSizeMultiplier={isDisplay ? 1.3 : 1.6}
      {...rest}
      style={[
        variantStyle[variant],
        { color },
        size !== undefined && {
          fontSize: size,
          lineHeight: isDisplay ? Math.round(size * 1.12) : Math.round(size * 1.3),
        },
        align && { textAlign: align },
        style,
      ]}
    />
  );
}
