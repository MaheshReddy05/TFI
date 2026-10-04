import Ionicons from '@expo/vector-icons/Ionicons';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Keyframe, ZoomIn } from 'react-native-reanimated';

import { GameTopBar, RoundLabel } from '../../components/GameTopBar';
import { JudgeButtons } from '../../components/JudgeButtons';
import { Screen } from '../../components/Screen';
import { SwipeCard, type SwipeCardHandle, type SwipeDirection } from '../../components/SwipeCard';
import { Ticket } from '../../components/Ticket';
import { T } from '../../components/Typography';
import { beforeOrAfterMatchups } from '../../data/beforeOrAfter';
import { haptics } from '../../engine/haptics';
import { choiceParam } from '../../engine/params';
import { flip, pickSession } from '../../engine/random';
import { setLastResult } from '../../engine/resultStore';
import { useLeaveGuard } from '../../engine/useLeaveGuard';
import { useRoundSession } from '../../engine/useRoundSession';
import { fonts, gameThemes, motion, palette, radius, space } from '../../theme/tokens';
import type { BeforeOrAfterMatchup, MovieRelease, RoundRecord } from '../../types/game';

const theme = gameThemes['before-or-after'];
const REVEAL_MS = 1800;

/** A matchup prepared for display: order randomised so the answer isn't always on top. */
interface Matchup extends BeforeOrAfterMatchup {
  top: MovieRelease;
  bottom: MovieRelease;
  first: MovieRelease;
  later: MovieRelease;
}

function prepare(m: BeforeOrAfterMatchup): Matchup {
  const first = m.correct === 'a' ? m.a : m.b;
  const later = m.correct === 'a' ? m.b : m.a;
  const swap = flip();
  return { ...m, first, later, top: swap ? m.b : m.a, bottom: swap ? m.a : m.b };
}

const cardIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 40 }, { scale: 0.96 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: motion.easeOut },
}).duration(300);

const revealIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.92 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: motion.easeOut },
}).duration(220);

export default function BeforeOrAfterPlay() {
  useKeepAwake();
  const params = useLocalSearchParams<{ rounds?: string }>();
  const rounds = choiceParam(params.rounds, [5, 10, 15], 10);
  const { width, height } = useWindowDimensions();
  const titleSize = Math.min(width * 0.105, height * 0.058, 50);
  // Fixed height keeps both halves equal so the VS disc sits on the perforation.
  const cardHeight = Math.max(250, Math.min(height * 0.42, 380));

  const session = useRoundSession(() => pickSession(beforeOrAfterMatchups, rounds).map(prepare));
  const { record, next } = session;
  const [peeking, setPeeking] = useState(false);
  const [reveal, setReveal] = useState<{ outcome: 'correct' | 'wrong'; matchup: Matchup } | null>(null);
  const [finished, setFinished] = useState(false);
  const cardRef = useRef<SwipeCardHandle>(null);
  // True while a reveal is waiting to advance — guards tap-to-continue racing the auto-advance timer.
  const revealPendingRef = useRef(false);

  const { requestExit, allowLeave } = useLeaveGuard(true);

  const recordsRef = useRef(session.records);
  useEffect(() => {
    recordsRef.current = session.records;
  }, [session.records]);

  const finish = useCallback(
    (records: RoundRecord<Matchup>[]) => {
      setFinished(true);
      setLastResult({
        gameId: 'before-or-after',
        score: records.filter((r) => r.outcome === 'correct').length,
        total: records.length,
        lines: records.map((r) => ({
          id: r.item.id,
          outcome: r.outcome,
          title: `${r.item.top.title} vs ${r.item.bottom.title}`,
          detail: `First: ${r.item.first.title} (${r.item.first.year}) · ${r.item.later.title} (${r.item.later.year})`,
        })),
        replayParams: { rounds: String(rounds) },
      });
      allowLeave();
      router.replace('/results');
    },
    [rounds, allowLeave],
  );

  const onSwipe = (direction: SwipeDirection) => {
    const matchup = session.current;
    const outcome = direction === 'right' ? 'correct' : 'wrong';
    if (!matchup || !record(outcome)) return;
    if (outcome === 'correct') haptics.correct();
    else haptics.soft();
    setPeeking(false);
    revealPendingRef.current = true;
    setReveal({ outcome, matchup });
  };

  const advance = useCallback(() => {
    if (!revealPendingRef.current) return;
    revealPendingRef.current = false;
    setReveal(null);
    if (!next()) finish(recordsRef.current);
  }, [next, finish]);

  useEffect(() => {
    if (!reveal) return;
    const t = setTimeout(advance, REVEAL_MS);
    return () => clearTimeout(t);
  }, [reveal, advance]);

  const matchup = session.current;

  return (
    <Screen bg={theme.bg}>
      <GameTopBar
        onExit={requestExit}
        center={<RoundLabel index={Math.min(session.index + 1, session.total)} total={session.total} color={theme.fg} />}
        score={session.score}
        fg={theme.fg}
        chipBg={palette.turmeric}
        chipFg={palette.ink}
        plusColor={palette.turmeric}
      />

      <T variant="display" color={theme.fg} size={Math.min(width * 0.11, 46)} align="center" style={styles.prompt}>
        Which came first?
      </T>

      <View style={styles.stage}>
        {matchup && !finished && !reveal && (
          <Animated.View key={matchup.id} entering={cardIn} exiting={FadeOut.duration(120)}>
            <SwipeCard ref={cardRef} enabled onSwipe={onSwipe}>
              <View>
                <Ticket
                  color={palette.paper}
                  cutout={theme.bg}
                  perforation={palette.electric}
                  style={{ height: cardHeight }}
                  contentStyle={[styles.half, styles.topHalf]}
                  stubStyle={[styles.half, styles.bottomHalf]}
                  stub={<MovieSide movie={matchup.bottom} isFirst={matchup.bottom === matchup.first} peek={peeking} size={titleSize} />}
                >
                  <MovieSide movie={matchup.top} isFirst={matchup.top === matchup.first} peek={peeking} size={titleSize} />
                </Ticket>
                <View style={styles.vsWrap} pointerEvents="none">
                  <View style={styles.vs}>
                    <T variant="display" color={palette.ink} size={22}>
                      VS
                    </T>
                  </View>
                </View>
              </View>
            </SwipeCard>
          </Animated.View>
        )}

        {reveal && <Reveal key={reveal.matchup.id} {...reveal} width={width} onContinue={advance} />}
      </View>

      <View style={styles.controls}>
        <Pressable
          onPressIn={() => {
            haptics.tick();
            setPeeking(true);
          }}
          onPressOut={() => setPeeking(false)}
          disabled={!!reveal}
          accessibilityRole="button"
          accessibilityLabel="Hold to peek at the answer"
          accessibilityHint="Only the Reader should look"
          style={({ pressed }) => [styles.peek, pressed && styles.peekPressed, !!reveal && styles.dimmed]}
        >
          <Ionicons name={peeking ? 'eye' : 'eye-outline'} size={20} color={palette.paper} />
          <T variant="black" color={palette.paper} size={14} style={styles.peekText}>
            {peeking ? 'Peeking…' : 'Hold to peek'}
          </T>
        </Pressable>
        <JudgeButtons
          onWrong={() => cardRef.current?.fling('left')}
          onCorrect={() => cardRef.current?.fling('right')}
          disabled={!!reveal || !matchup}
          base={palette.electricDeep}
        />
        <T variant="label" color={theme.fg} size={11} align="center" style={styles.faint}>
          Swipe right if they got it · left if not
        </T>
      </View>
    </Screen>
  );
}

function MovieSide({
  movie,
  isFirst,
  peek,
  size,
}: {
  movie: MovieRelease;
  isFirst: boolean;
  peek: boolean;
  size: number;
}) {
  return (
    <View style={styles.side}>
      <T
        variant="display"
        color={palette.ink}
        size={size}
        align="center"
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {movie.title}
      </T>
      {peek && isFirst && (
        <Animated.View entering={ZoomIn.duration(140)} style={styles.firstTag}>
          <T variant="label" color={palette.ink} size={11}>
            First ✓
          </T>
        </Animated.View>
      )}
    </View>
  );
}

function Reveal({
  outcome,
  matchup,
  width,
  onContinue,
}: {
  outcome: 'correct' | 'wrong';
  matchup: Matchup;
  width: number;
  onContinue: () => void;
}) {
  const correct = outcome === 'correct';
  const bg = correct ? palette.leaf : palette.rose;
  const big = Math.min(width * 0.14, 60);
  return (
    <Animated.View entering={revealIn} exiting={FadeOut.duration(120)}>
      <Pressable
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel={`${correct ? 'Correct' : 'Wrong'}. ${matchup.first.title}, ${matchup.first.year}, came first. ${matchup.later.title}, ${matchup.later.year}. Tap to continue.`}
        style={[styles.reveal, { backgroundColor: bg }]}
      >
        <View style={styles.verdict}>
          <T variant="label" color={palette.white} size={13}>
            {correct ? 'Correct · +1' : 'Wrong'}
          </T>
        </View>
        <T
          color={palette.white}
          numberOfLines={2}
          adjustsFontSizeToFit
          align="center"
          style={{ fontFamily: fonts.display, fontSize: big, lineHeight: big * 1.1, textTransform: 'uppercase' }}
        >
          {matchup.first.title} ✓
        </T>
        <Animated.View entering={FadeIn.delay(90).duration(200)}>
          <T variant="display" color={palette.turmeric} size={big * 1.15} align="center">
            {matchup.first.year}
          </T>
        </Animated.View>
        <T variant="bold" color={palette.white} size={18} align="center" style={styles.later}>
          {matchup.later.title} — {matchup.later.year}
        </T>
        <T variant="label" color={palette.white} size={10} align="center" style={styles.faint}>
          Tap to continue
        </T>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  prompt: {
    marginTop: space.sm,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg + 2,
    paddingVertical: space.md,
  },
  half: {
    flex: 1,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
  },
  // Keep titles clear of the VS disc on the perforation.
  topHalf: {
    paddingTop: space.lg,
    paddingBottom: 36,
  },
  bottomHalf: {
    paddingTop: 36,
    paddingBottom: space.lg,
  },
  side: {
    alignItems: 'center',
    gap: space.sm,
  },
  firstTag: {
    backgroundColor: palette.turmeric,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  vsWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vs: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: palette.turmeric,
    borderWidth: 4,
    borderColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reveal: {
    borderRadius: radius.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.xxl,
    alignItems: 'center',
    gap: space.xs,
  },
  verdict: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: space.sm,
  },
  later: {
    marginTop: space.xs,
    opacity: 0.95,
  },
  controls: {
    paddingHorizontal: space.lg + 2,
    paddingBottom: space.md,
    gap: space.md,
  },
  peek: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'rgba(255,243,222,0.5)',
  },
  peekPressed: {
    backgroundColor: palette.electricDeep,
    borderColor: palette.paper,
  },
  peekText: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dimmed: {
    opacity: 0.4,
  },
  faint: {
    opacity: 0.6,
  },
});
