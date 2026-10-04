import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { BigButton } from '../components/BigButton';
import { Confetti } from '../components/Confetti';
import { Screen } from '../components/Screen';
import { T } from '../components/Typography';
import { getGame } from '../data/games';
import { haptics } from '../engine/haptics';
import { getLastResult } from '../engine/resultStore';
import { countOf, shouldCelebrate, verdictFor } from '../engine/scoring';
import { fonts, gameThemes, motion, palette, radius, space } from '../theme/tokens';
import type { Outcome, ResultLine, SessionResult } from '../types/game';

export default function Results() {
  const [result] = useState(getLastResult);
  if (!result) return <Redirect href="/" />;
  return <ResultsView result={result} />;
}

/** Counts 0 → target with an ease-out, once. */
function useCountUp(target: number, durationMs: number, delayMs: number) {
  const reduced = useReducedMotion();
  const instant = reduced || target === 0;
  const [value, setValue] = useState(instant ? target : 0);
  useEffect(() => {
    if (instant) return;
    let raf = 0;
    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    const timeout = setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, delayMs);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs, delayMs, instant]);
  return value;
}

function ResultsView({ result }: { result: SessionResult }) {
  const game = getGame(result.gameId)!;
  const theme = gameThemes[result.gameId];
  const { width } = useWindowDimensions();
  const celebrate = shouldCelebrate(result.score, result.total);
  const verdict = verdictFor(result.score, result.total);
  const shown = useCountUp(result.score, 650, 250);
  const scoreSize = Math.min(width * 0.3, 132);

  // Verdict stamp slams down once (shared value, so it never affects layout).
  const stamp = useSharedValue(0);
  useEffect(() => {
    stamp.set(withDelay(120, withTiming(1, { duration: 320, easing: motion.easeOut })));
  }, [stamp]);
  const stampStyle = useAnimatedStyle(() => ({
    opacity: stamp.get(),
    transform: [{ scale: interpolate(stamp.get(), [0, 1], [1.5, 1]) }],
  }));

  useEffect(() => {
    const t = setTimeout(() => (celebrate ? haptics.correct() : haptics.thud()), 260);
    return () => clearTimeout(t);
  }, [celebrate]);

  const missOutcome: Outcome = result.gameId === 'movie-on-my-head' ? 'skipped' : 'wrong';
  const misses = countOf(result.lines, missOutcome);

  return (
    <Screen bg={theme.bg} statusBar={result.gameId === 'whats-common' ? 'dark' : 'light'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <T variant="label" color={theme.fg} size={13} align="center">
            {game.emoji} {game.title}
          </T>
          <T variant="display" color={theme.fg} size={34} align="center" accessibilityRole="header">
            Round complete
          </T>

          <View style={styles.verdictTilt}>
            <Animated.View style={[styles.verdict, { backgroundColor: theme.accent }, stampStyle]}>
              <T variant="display" color={theme.onAccent} size={Math.min(width * 0.1, 40)}>
                {verdict}
              </T>
            </Animated.View>
          </View>

          <View
            style={styles.scoreRow}
            accessible
            accessibilityLabel={`Score: ${result.score} out of ${result.total}`}
          >
            <T
              maxFontSizeMultiplier={1}
              color={theme.fg}
              style={{ fontFamily: fonts.display, fontSize: scoreSize, lineHeight: scoreSize * 1.12 }}
            >
              {shown}
            </T>
            <T
              maxFontSizeMultiplier={1}
              color={theme.fg}
              style={[styles.outOf, { fontFamily: fonts.display, fontSize: scoreSize * 0.5, lineHeight: scoreSize * 0.6 }]}
            >
              {' '}/ {result.total}
            </T>
          </View>
          <T variant="label" color={theme.fg} size={12} align="center" style={styles.dim}>
            Score
          </T>
        </View>

        <Animated.View
          entering={FadeInDown.delay(220).duration(380).easing(motion.easeOut)}
          style={styles.breakdown}
        >
          <View style={styles.tally}>
            <Tally icon="checkmark" color={palette.leaf} label={`${result.score} correct`} />
            <Tally
              icon={missOutcome === 'skipped' ? 'arrow-forward' : 'close'}
              color={missOutcome === 'skipped' ? palette.marigold : palette.rose}
              label={`${misses} ${missOutcome}`}
            />
          </View>
          {result.lines.length === 0 ? (
            <T variant="bold" color={palette.ink} size={16} align="center" style={styles.empty}>
              No cards played this round.
            </T>
          ) : (
            result.lines.map((line, i) => <Row key={`${line.id}-${i}`} line={line} last={i === result.lines.length - 1} />)
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <BigButton
          label="Play again"
          iconLeft="refresh"
          onPress={() => router.replace({ pathname: game.playPath, params: result.replayParams })}
          bg={theme.accent}
          fg={theme.onAccent}
          base={theme.deep}
          haptic="thud"
        />
        <BigButton
          label="Home"
          iconLeft="home"
          onPress={() => router.dismissTo('/')}
          variant="outline"
          fg={theme.fg}
          size="md"
        />
      </View>

      {celebrate && <Confetti />}
    </Screen>
  );
}

const outcomeStyle: Record<Outcome, { icon: 'checkmark' | 'arrow-forward' | 'close'; color: string; label: string }> = {
  correct: { icon: 'checkmark', color: palette.leaf, label: 'Correct' },
  skipped: { icon: 'arrow-forward', color: palette.marigold, label: 'Skipped' },
  wrong: { icon: 'close', color: palette.rose, label: 'Wrong' },
};

function Row({ line, last }: { line: ResultLine; last: boolean }) {
  const o = outcomeStyle[line.outcome];
  return (
    <View
      style={[styles.row, !last && styles.rowDivider]}
      accessible
      accessibilityLabel={`${o.label}: ${line.title}${line.detail ? `. ${line.detail}` : ''}`}
    >
      <View style={[styles.rowIcon, { backgroundColor: o.color }]}>
        <Ionicons name={o.icon} size={18} color={palette.white} />
      </View>
      <View style={styles.rowText}>
        <T variant="black" color={palette.ink} size={17} numberOfLines={2}>
          {line.title}
        </T>
        {line.detail ? (
          <T variant="body" color={palette.ink} size={13} style={styles.dim} numberOfLines={2}>
            {line.detail}
          </T>
        ) : null}
      </View>
    </View>
  );
}

function Tally({ icon, color, label }: { icon: 'checkmark' | 'arrow-forward' | 'close'; color: string; label: string }) {
  return (
    <View style={styles.tallyItem}>
      <View style={[styles.tallyDot, { backgroundColor: color }]}>
        <Ionicons name={icon} size={14} color={palette.white} />
      </View>
      <T variant="label" color={palette.ink} size={12}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg + 2,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    gap: space.xl,
  },
  header: {
    alignItems: 'center',
    gap: space.xs,
  },
  verdictTilt: {
    marginTop: space.md,
    transform: [{ rotate: '-3deg' }],
  },
  verdict: {
    paddingHorizontal: space.lg,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: space.sm,
  },
  outOf: {
    opacity: 0.7,
    paddingBottom: 14,
  },
  dim: {
    opacity: 0.65,
  },
  breakdown: {
    backgroundColor: palette.paper,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  tally: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.xl,
    paddingVertical: space.md,
    borderBottomWidth: 2,
    borderBottomColor: palette.paperShade,
  },
  tallyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tallyDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: palette.paperShade,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  empty: {
    paddingVertical: space.xl,
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: space.lg + 2,
    paddingTop: space.sm,
    paddingBottom: space.md,
    gap: space.md,
  },
});
