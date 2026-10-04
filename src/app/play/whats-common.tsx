import Ionicons from '@expo/vector-icons/Ionicons';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, Keyframe } from 'react-native-reanimated';

import { BigButton } from '../../components/BigButton';
import { FeedbackFlash } from '../../components/FeedbackFlash';
import { GameTopBar, RoundLabel } from '../../components/GameTopBar';
import { JudgeButtons } from '../../components/JudgeButtons';
import { Screen } from '../../components/Screen';
import { SwipeCard, type SwipeCardHandle, type SwipeDirection } from '../../components/SwipeCard';
import { Ticket } from '../../components/Ticket';
import { T } from '../../components/Typography';
import { whatsCommonRounds } from '../../data/whatsCommon';
import { haptics } from '../../engine/haptics';
import { choiceParam } from '../../engine/params';
import { pickSession } from '../../engine/random';
import { setLastResult } from '../../engine/resultStore';
import { useLeaveGuard } from '../../engine/useLeaveGuard';
import { useRoundSession } from '../../engine/useRoundSession';
import { gameThemes, motion, palette, radius, space } from '../../theme/tokens';
import type { RoundRecord, WhatsCommonRound } from '../../types/game';

const theme = gameThemes['whats-common'];
const FEEDBACK_MS = { correct: 700, wrong: 560 } as const;

const cardIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 40 }, { scale: 0.96 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: motion.easeOut },
}).duration(300);

export default function WhatsCommonPlay() {
  useKeepAwake();
  const params = useLocalSearchParams<{ rounds?: string }>();
  const rounds = choiceParam(params.rounds, [5, 10, 15], 10);

  const { width, height } = useWindowDimensions();
  const clueSize = Math.min(width * 0.1, height * 0.05, 46);

  const session = useRoundSession(() => pickSession(whatsCommonRounds, rounds));
  const { record, next } = session;
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<{ outcome: 'correct' | 'wrong'; key: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const cardRef = useRef<SwipeCardHandle>(null);

  const { requestExit, allowLeave } = useLeaveGuard(true);

  const finish = useCallback(
    (records: RoundRecord<WhatsCommonRound>[]) => {
      setFinished(true);
      setLastResult({
        gameId: 'whats-common',
        score: records.filter((r) => r.outcome === 'correct').length,
        total: records.length,
        lines: records.map((r) => ({
          id: r.item.id,
          outcome: r.outcome,
          title: r.item.answer,
          detail: r.item.clues.join(' · '),
        })),
        replayParams: { rounds: String(rounds) },
      });
      allowLeave();
      router.replace('/results');
    },
    [rounds, allowLeave],
  );

  const onSwipe = useCallback(
    (direction: SwipeDirection) => {
      const outcome = direction === 'right' ? 'correct' : 'wrong';
      if (!record(outcome)) return;
      if (outcome === 'correct') haptics.correct();
      else haptics.soft();
      setFeedback({ outcome, key: Date.now() });
    },
    [record],
  );

  // After the verdict flash: next round, or wrap up.
  const recordsRef = useRef(session.records);
  useEffect(() => {
    recordsRef.current = session.records;
  }, [session.records]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => {
      setFeedback(null);
      setRevealed(false);
      if (!next()) finish(recordsRef.current);
    }, FEEDBACK_MS[feedback.outcome]);
    return () => clearTimeout(t);
  }, [feedback, next, finish]);

  const round = session.current;

  return (
    <Screen bg={theme.bg} statusBar="dark">
      <GameTopBar
        onExit={requestExit}
        center={<RoundLabel index={Math.min(session.index + 1, session.total)} total={session.total} color={theme.fg} />}
        score={session.score}
        fg={theme.fg}
        chipBg={palette.ink}
        chipFg={palette.turmeric}
        plusColor={palette.chilli}
      />

      <View style={styles.roleRow}>
        <Ionicons name="megaphone" size={16} color={theme.fg} />
        <T variant="label" color={theme.fg} size={12}>
          Reader · read the clues aloud
        </T>
      </View>

      <View style={styles.stage}>
        {round && !finished && (
          <Animated.View key={round.id} entering={cardIn} style={styles.cardWrap}>
            <SwipeCard ref={cardRef} enabled={revealed && !feedback} onSwipe={onSwipe}>
              <Ticket
                color={palette.paper}
                cutout={theme.bg}
                perforation={palette.ink}
                contentStyle={styles.cardMain}
                stubStyle={styles.cardStub}
                stub={
                  revealed ? (
                    <Animated.View entering={FadeInDown.duration(220).easing(motion.easeOut)} style={styles.answer}>
                      <T variant="label" color={palette.chilli} size={12}>
                        Answer
                      </T>
                      <T
                        variant="black"
                        color={palette.ink}
                        size={26}
                        align="center"
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        accessibilityLiveRegion="polite"
                      >
                        {round.answer}
                      </T>
                    </Animated.View>
                  ) : (
                    <View style={styles.hidden} accessible accessibilityLabel="Answer hidden">
                      <Ionicons name="eye-off" size={18} color={palette.ink} style={styles.faint} />
                      <T variant="label" color={palette.ink} size={12} style={styles.faint}>
                        Answer hidden
                      </T>
                    </View>
                  )
                }
              >
                <T variant="label" color={palette.chilli} size={12} style={styles.cardLabel}>
                  What connects these?
                </T>
                {round.clues.map((clue, i) => (
                  <View key={i} style={styles.clueRow}>
                    <T variant="display" color={palette.chilli} size={18} style={styles.clueNum}>
                      {i + 1}
                    </T>
                    <T
                      variant="display"
                      color={palette.ink}
                      size={clueSize}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      style={styles.clue}
                    >
                      {clue}
                    </T>
                  </View>
                ))}
              </Ticket>
            </SwipeCard>
          </Animated.View>
        )}
      </View>

      <View style={styles.controls}>
        {!revealed ? (
          <Animated.View key="show" entering={FadeIn.duration(160)} exiting={FadeOut.duration(100)}>
            <BigButton
              label="Show answer"
              iconLeft="eye"
              onPress={() => setRevealed(true)}
              bg={palette.ink}
              fg={palette.turmeric}
              base={theme.deep}
              disabled={!round || !!feedback}
            />
          </Animated.View>
        ) : (
          <Animated.View key="judge" entering={FadeIn.duration(160)} style={styles.judge}>
            <JudgeButtons
              onWrong={() => cardRef.current?.fling('left')}
              onCorrect={() => cardRef.current?.fling('right')}
              disabled={!!feedback}
            />
            <T variant="label" color={theme.fg} size={11} align="center" style={styles.faint}>
              or swipe the card
            </T>
          </Animated.View>
        )}
      </View>

      {feedback && (
        <FeedbackFlash
          key={feedback.key}
          outcome={feedback.outcome}
          label={feedback.outcome === 'correct' ? 'CORRECT ✓' : 'WRONG ✕'}
          sub={feedback.outcome === 'correct' ? '+1 point' : undefined}
          size={Math.min(width * 0.2, 96)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: space.sm,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg + 2,
    paddingVertical: space.md,
  },
  cardWrap: {
    width: '100%',
  },
  cardMain: {
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.lg,
    gap: space.sm,
  },
  cardLabel: {
    marginBottom: space.xs,
  },
  clueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.sm,
  },
  clueNum: {
    width: 18,
  },
  clue: {
    flex: 1,
  },
  cardStub: {
    minHeight: 104,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    justifyContent: 'center',
  },
  answer: {
    alignItems: 'center',
    gap: 4,
  },
  hidden: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  faint: {
    opacity: 0.45,
  },
  controls: {
    paddingHorizontal: space.lg + 2,
    paddingBottom: space.md,
    minHeight: 100,
    justifyContent: 'flex-end',
  },
  judge: {
    gap: space.sm,
  },
});
