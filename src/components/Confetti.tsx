import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '../theme/tokens';

const COLORS = [palette.turmeric, palette.chilli, palette.electric, palette.leaf, palette.paper, palette.marigold];
const PIECES = 34;

/** Small deterministic PRNG (mulberry32) — keeps render pure. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Piece {
  x: number;
  drift: number;
  delay: number;
  duration: number;
  spin: number;
  w: number;
  h: number;
  color: string;
}

/**
 * One-shot paper-ticket confetti for a good round. Rare moment → this is
 * where the delight budget goes. Skipped entirely under Reduce Motion.
 */
export function Confetti() {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();

  const pieces = useMemo<Piece[]>(() => {
    const rand = seeded(7);
    return Array.from({ length: PIECES }, (_, i) => ({
      x: rand() * width,
      drift: (rand() - 0.5) * 120,
      delay: rand() * 350,
      duration: 1600 + rand() * 1100,
      spin: (rand() - 0.5) * 900,
      w: 8 + rand() * 8,
      h: 12 + rand() * 10,
      color: COLORS[i % COLORS.length],
    }));
  }, [width]);

  if (reduced) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} fall={height + 80} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, fall }: { piece: Piece; fall: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withDelay(
        piece.delay,
        withTiming(1, { duration: piece.duration, easing: Easing.bezier(0.3, 0.1, 0.6, 1) }),
      ),
    );
  }, [piece, t]);

  const style = useAnimatedStyle(() => {
    const p = t.get();
    return {
      opacity: p === 0 || p === 1 ? 0 : 1,
      transform: [
        { translateX: piece.x + piece.drift * p },
        { translateY: -40 + fall * p },
        { rotate: `${piece.spin * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.piece, { width: piece.w, height: piece.h, backgroundColor: piece.color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 2,
  },
});
