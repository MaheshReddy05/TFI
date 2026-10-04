import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BigButton } from '../../components/BigButton';
import { OptionPicker } from '../../components/OptionPicker';
import { PressableScale } from '../../components/PressableScale';
import { Screen } from '../../components/Screen';
import { T } from '../../components/Typography';
import { getGame, type GameInfo } from '../../data/games';
import { gameThemes, motion, radius, space } from '../../theme/tokens';

export default function GameIntro() {
  const { game: gameId } = useLocalSearchParams<{ game: string }>();
  const game = getGame(gameId);
  if (!game) return <Redirect href="/" />;
  return <Intro game={game} />;
}

function Intro({ game }: { game: GameInfo }) {
  const theme = gameThemes[game.id];
  const { width, height } = useWindowDimensions();
  const titleSize = Math.min(width * 0.19, height * 0.095, 88);
  const statusBar = game.id === 'whats-common' ? 'dark' : 'light';

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(game.options.map((o) => [o.param, o.defaultValue])),
  );

  const start = () => {
    router.push({ pathname: game.playPath, params: values });
  };

  return (
    <Screen bg={theme.bg} statusBar={statusBar}>
      <View style={styles.topRow}>
        <PressableScale
          onPress={() => router.back()}
          accessibilityLabel="Back to games"
          style={[styles.back, { borderColor: theme.fg }]}
        >
          <Ionicons name="chevron-back" size={26} color={theme.fg} />
        </PressableScale>
        <T variant="label" color={theme.fg} size={12}>
          How to play
        </T>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(380).easing(motion.easeOut)}>
          <T size={44} style={styles.emoji}>
            {game.emoji}
          </T>
          <View accessible accessibilityRole="header" accessibilityLabel={game.title}>
            {game.titleLines.map((line) => (
              <T
                key={line}
                variant="display"
                color={theme.fg}
                size={titleSize}
                style={{ lineHeight: titleSize * 1.02 }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {line}
              </T>
            ))}
          </View>
          <T variant="bold" color={theme.fg} size={19} style={styles.tagline}>
            {game.tagline}
          </T>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(380).easing(motion.easeOut)}
          style={[styles.steps, { backgroundColor: theme.deep }]}
        >
          {game.steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: theme.fg }]}>
                <T variant="display" size={18} color={theme.bg}>
                  {i + 1}
                </T>
              </View>
              <T variant="bold" color={theme.fg} size={16} style={styles.stepText}>
                {step}
              </T>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(380).easing(motion.easeOut)} style={styles.options}>
          {game.options.map((option) => (
            <OptionPicker
              key={option.param}
              option={option}
              value={values[option.param]}
              onChange={(v) => setValues((prev) => ({ ...prev, [option.param]: v }))}
              fg={theme.fg}
              selectedBg={theme.fg}
              selectedFg={theme.bg}
            />
          ))}
          {game.id === 'movie-on-my-head' && values.controls === 'tilt' && (
            <T variant="body" color={theme.fg} size={14} style={styles.note}>
              {"Tilt uses your phone's motion sensors. If they're unavailable, on-screen buttons appear automatically."}
            </T>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <BigButton
          label="Start game"
          iconRight="play"
          onPress={start}
          bg={theme.accent}
          fg={theme.onAccent}
          base={theme.deep}
          haptic="thud"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xl,
    gap: space.xl,
  },
  emoji: {
    lineHeight: 56,
    marginBottom: space.xs,
  },
  tagline: {
    marginTop: space.sm,
  },
  steps: {
    borderRadius: radius.lg,
    padding: space.lg + 2,
    gap: space.lg,
  },
  step: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  stepText: {
    flex: 1,
  },
  options: {
    gap: space.lg,
  },
  note: {
    opacity: 0.85,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
});
