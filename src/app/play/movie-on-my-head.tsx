import Ionicons from '@expo/vector-icons/Ionicons';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BigButton } from '../../components/BigButton';
import { Countdown } from '../../components/Countdown';
import { FeedbackFlash } from '../../components/FeedbackFlash';
import { ExitButton } from '../../components/GameTopBar';
import { ScoreChip } from '../../components/ScoreChip';
import { Screen } from '../../components/Screen';
import { T } from '../../components/Typography';
import { movieOnMyHeadCards } from '../../data/movieOnMyHead';
import { haptics } from '../../engine/haptics';
import { choiceParam } from '../../engine/params';
import { shuffle } from '../../engine/random';
import { setLastResult } from '../../engine/resultStore';
import { useAppActive } from '../../engine/useAppActive';
import { formatClock, useCountdown } from '../../engine/useCountdown';
import { useLeaveGuard } from '../../engine/useLeaveGuard';
import { useRoundSession } from '../../engine/useRoundSession';
import { useTiltControls } from '../../engine/useTiltControls';
import { fonts, gameThemes, motion, palette, radius, space } from '../../theme/tokens';

type Phase = 'prepare' | 'countdown' | 'playing' | 'timeup';

const theme = gameThemes['movie-on-my-head'];
const FLASH_MS: Record<'correct' | 'skipped', number> = { correct: 650, skipped: 480 };
const TIME_UP_MS = 1600;
/** Phone must read as upright this long before the countdown starts on its own. */
const UPRIGHT_HOLD_MS = 800;
const UPRIGHT_DEG = 28;
/** Give people a moment to read the instruction before auto-starting. */
const MIN_PREPARE_MS = 1600;

const cardIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.9 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: motion.easeOut },
}).duration(220);

const tickPop = new Keyframe({
  0: { transform: [{ scale: 1.25 }] },
  100: { transform: [{ scale: 1 }], easing: motion.easeOut },
}).duration(240);

export default function MovieOnMyHeadPlay() {
  useKeepAwake();
  const params = useLocalSearchParams<{ seconds?: string; controls?: string }>();
  const seconds = choiceParam(params.seconds, [30, 60, 90], 60);
  const wantsTilt = params.controls !== 'tap';

  const { width, height } = useWindowDimensions();
  const appActive = useAppActive();

  const [phase, setPhaseState] = useState<Phase>('prepare');
  const [flash, setFlash] = useState<{ outcome: 'correct' | 'skipped'; key: number } | null>(null);
  const [deckDone, setDeckDone] = useState(false);
  // Mirrors `phase` synchronously so sensor callbacks never act on a stale phase.
  const phaseRef = useRef<Phase>('prepare');
  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const session = useRoundSession(() => shuffle(movieOnMyHeadCards));
  const { record, next } = session;
  const recordsRef = useRef(session.records);
  useEffect(() => {
    recordsRef.current = session.records;
  }, [session.records]);

  const { confirming, requestExit, allowLeave } = useLeaveGuard(true);

  // Landscape for the round; back to portrait however we leave.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  // ── Scoring ────────────────────────────────────────────────────────────
  const resolve = useCallback(
    (outcome: 'correct' | 'skipped') => {
      if (phaseRef.current !== 'playing') return;
      if (!record(outcome)) return;
      if (outcome === 'correct') haptics.correct();
      else haptics.soft();
      setFlash({ outcome, key: Date.now() });
    },
    [record],
  );

  // After the flash, deal the next card (or end early if the deck runs out).
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => {
      setFlash(null);
      if (phaseRef.current !== 'playing') return;
      const more = next();
      if (!more) {
        setDeckDone(true);
        haptics.alarm();
        setPhase('timeup');
      }
    }, FLASH_MS[flash.outcome]);
    return () => clearTimeout(t);
  }, [flash, next, setPhase]);

  // ── Timer ──────────────────────────────────────────────────────────────
  const paused = confirming || !appActive;
  const timer = useCountdown({
    durationMs: seconds * 1000,
    running: phase === 'playing' && !paused,
    onExpire: () => {
      haptics.alarm();
      setPhase('timeup');
    },
  });

  useEffect(() => {
    if (phase === 'playing' && timer.secondsLeft > 0 && timer.secondsLeft <= 5) haptics.tick();
  }, [phase, timer.secondsLeft]);

  const timeFraction = useSharedValue(1);
  useEffect(() => {
    timeFraction.set(withTiming(timer.remainingMs / (seconds * 1000), { duration: 110, easing: Easing.linear }));
  }, [timer.remainingMs, seconds, timeFraction]);
  const timeBarStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: timeFraction.get() }] }));

  // ── Tilt ───────────────────────────────────────────────────────────────
  const uprightSince = useRef<number | null>(null);
  const prepareStartedAt = useRef(0);
  useEffect(() => {
    prepareStartedAt.current = Date.now();
  }, []);

  const tilt = useTiltControls({
    enabled: wantsTilt,
    listening: phase !== 'timeup',
    accepting: phase === 'playing' && !flash && !paused,
    onTilt: (event) => resolve(event === 'correct' ? 'correct' : 'skipped'),
    onPitch: (pitch) => {
      if (phaseRef.current !== 'prepare') return;
      const now = Date.now();
      if (Math.abs(pitch) > UPRIGHT_DEG) {
        uprightSince.current = null;
        return;
      }
      uprightSince.current ??= now;
      if (now - uprightSince.current >= UPRIGHT_HOLD_MS && now - prepareStartedAt.current >= MIN_PREPARE_MS) {
        setPhase('countdown');
      }
    },
  });
  const tiltReady = wantsTilt && tilt.status === 'ready';
  const showButtons = !wantsTilt || tilt.status === 'unavailable' || tilt.status === 'denied';

  const tintCorrect = useAnimatedStyle(() => ({ opacity: Math.max(0, -tilt.progress.get()) * 0.55 }));
  const tintSkip = useAnimatedStyle(() => ({ opacity: Math.max(0, tilt.progress.get()) * 0.55 }));

  const { calibrate } = tilt;
  const startCountdown = () => setPhase('countdown');
  const onCountdownDone = useCallback(() => {
    calibrate();
    setPhase('playing');
  }, [calibrate, setPhase]);

  // ── Finish ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'timeup') return;
    const t = setTimeout(async () => {
      const records = recordsRef.current;
      setLastResult({
        gameId: 'movie-on-my-head',
        score: records.filter((r) => r.outcome === 'correct').length,
        total: records.length,
        lines: records.map((r) => ({ id: r.item.id, outcome: r.outcome, title: r.item.title })),
        replayParams: { seconds: String(seconds), controls: wantsTilt ? 'tilt' : 'tap' },
      });
      allowLeave();
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      router.replace('/results');
    }, TIME_UP_MS);
    return () => clearTimeout(t);
  }, [phase, seconds, wantsTilt, allowLeave]);

  // ── Layout ─────────────────────────────────────────────────────────────
  const landscape = width > height;
  const short = Math.min(width, height);
  const titleSize = Math.min(short * (landscape ? 0.34 : 0.2), width * 0.17, 170);
  const urgent = phase === 'playing' && timer.secondsLeft <= 10;

  return (
    <Screen bg={theme.bg} hideStatusBar edges={['left', 'right']} style={styles.root}>
      {/* Tilt feedback: the whole field leans green (correct) or orange (skip). */}
      {phase === 'playing' && (
        <>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: palette.leaf }, tintCorrect]} />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: palette.marigold }, tintSkip]} />
        </>
      )}

      {/* Time remaining bar */}
      {phase === 'playing' && (
        <View style={styles.timeTrack} pointerEvents="none">
          <Animated.View
            style={[styles.timeFill, { backgroundColor: urgent ? palette.turmeric : palette.paper }, timeBarStyle]}
          />
        </View>
      )}

      <View style={styles.hud}>
        <ExitButton onPress={requestExit} color={theme.fg} />
        <View style={styles.hudCenter}>
          {phase === 'playing' && (
            <Animated.View key={urgent ? timer.secondsLeft : 'calm'} entering={urgent ? tickPop : undefined}>
              <T
                variant="display"
                color={urgent ? palette.turmeric : theme.fg}
                size={urgent ? 44 : 36}
                accessibilityLabel={`${timer.secondsLeft} seconds left`}
              >
                {formatClock(timer.secondsLeft)}
              </T>
            </Animated.View>
          )}
        </View>
        <ScoreChip score={session.score} bg={palette.ink} fg={palette.paper} plusColor={palette.turmeric} size="lg" />
      </View>

      <View style={styles.stage}>
        {phase === 'prepare' && (
          <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} style={styles.prepare}>
            <T
              variant="display"
              color={theme.fg}
              size={Math.min(short * 0.13, 64)}
              align="center"
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              Place the phone on your forehead
            </T>
            {showButtons ? (
              <>
                <T variant="bold" color={theme.fg} size={16} align="center" style={styles.dim}>
                  {wantsTilt
                    ? "Motion sensors aren't available — friends can tap the on-screen buttons."
                    : 'Friends tap CORRECT or SKIP on screen.'}
                </T>
                <BigButton
                  label="I'm ready"
                  iconRight="play"
                  onPress={startCountdown}
                  bg={palette.turmeric}
                  fg={palette.ink}
                  base={palette.chilliDeep}
                  size="md"
                  style={styles.ready}
                />
              </>
            ) : (
              <>
                <View style={styles.legend}>
                  <LegendChip icon="arrow-down" label="Tilt down · Correct" bg={palette.leaf} />
                  <LegendChip icon="arrow-up" label="Tilt up · Skip" bg={palette.marigold} fg={palette.ink} />
                </View>
                <T variant="bold" color={theme.fg} size={15} align="center" style={styles.dim}>
                  {tiltReady ? 'Starts automatically when the phone is upright' : 'Checking motion sensors…'}
                </T>
                <BigButton
                  label="Start now"
                  onPress={startCountdown}
                  variant="outline"
                  fg={theme.fg}
                  size="md"
                  style={styles.ready}
                />
              </>
            )}
          </Animated.View>
        )}

        {phase === 'countdown' && (
          <Countdown color={theme.fg} goColor={palette.turmeric} size={Math.min(short * 0.55, 220)} onDone={onCountdownDone} />
        )}

        {phase === 'playing' && session.current && (
          <Animated.View key={session.current.id} entering={cardIn} style={styles.card}>
            <T
              color={theme.fg}
              maxFontSizeMultiplier={1}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.4}
              accessibilityRole="header"
              style={{
                fontFamily: fonts.display,
                fontSize: titleSize,
                lineHeight: titleSize * 1.1,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              {session.current.title}
            </T>
          </Animated.View>
        )}
      </View>

      {phase === 'playing' && showButtons && (
        <View style={styles.buttons}>
          <BigButton
            label="Skip"
            iconRight="arrow-forward"
            onPress={() => resolve('skipped')}
            bg={palette.marigold}
            fg={palette.ink}
            base={palette.chilliDeep}
            haptic={false}
            disabled={!!flash || paused}
            style={styles.flexButton}
          />
          <BigButton
            label="Correct"
            iconRight="checkmark"
            onPress={() => resolve('correct')}
            bg={palette.leaf}
            fg={palette.white}
            base={palette.leafDeep}
            haptic={false}
            disabled={!!flash || paused}
            style={styles.flexButton}
          />
        </View>
      )}

      {flash && (
        <FeedbackFlash
          key={flash.key}
          outcome={flash.outcome}
          label={flash.outcome === 'correct' ? 'CORRECT ✓' : 'SKIPPED →'}
          size={Math.min(short * 0.32, 150)}
        />
      )}

      {phase === 'timeup' && (
        <Animated.View entering={FadeIn.duration(120)} style={[StyleSheet.absoluteFill, styles.timeUp]}>
          <Animated.View entering={cardIn}>
            <T
              color={palette.turmeric}
              maxFontSizeMultiplier={1}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ fontFamily: fonts.display, fontSize: Math.min(short * 0.5, 240), lineHeight: Math.min(short * 0.5, 240) * 1.15 }}
            >
              {deckDone ? 'DECK DONE!' : 'TIME!'}
            </T>
          </Animated.View>
        </Animated.View>
      )}
    </Screen>
  );
}

function LegendChip({
  icon,
  label,
  bg,
  fg = palette.white,
}: {
  icon: 'arrow-down' | 'arrow-up';
  label: string;
  bg: string;
  fg?: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={fg} />
      <T variant="black" color={fg} size={15} style={styles.chipText}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  timeTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  timeFill: {
    flex: 1,
    transformOrigin: 'left',
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    zIndex: 5,
  },
  hudCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  prepare: {
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  chipText: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dim: {
    opacity: 0.85,
  },
  ready: {
    minWidth: 220,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: space.lg,
    paddingHorizontal: space.xl,
  },
  flexButton: {
    flex: 1,
  },
  timeUp: {
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
});
