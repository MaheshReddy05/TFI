import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { MarqueeLights } from '../components/MarqueeLights';
import { PressableScale } from '../components/PressableScale';
import { Screen } from '../components/Screen';
import { Ticket } from '../components/Ticket';
import { T } from '../components/Typography';
import { games, type GameInfo } from '../data/games';
import { fonts, gameThemes, motion, palette, radius, space } from '../theme/tokens';

export default function Home() {
  const { width, height } = useWindowDimensions();
  const compact = width < 400 || height < 740;
  const wordmark = Math.min(width * 0.4, height * 0.19, 168);

  return (
    <Screen bg={palette.ink} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <MarqueeLights />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(420).easing(motion.easeOut)} style={styles.header}>
          <View style={styles.brandRow} accessible accessibilityRole="header" accessibilityLabel="TFI">
            <View>
              <T
                maxFontSizeMultiplier={1}
                style={[styles.wordmark, styles.wordmarkShadow, { fontSize: wordmark, lineHeight: wordmark * 1.08 }]}
              >
                TFI
              </T>
              <T
                maxFontSizeMultiplier={1}
                style={[styles.wordmark, styles.wordmarkFront, { fontSize: wordmark, lineHeight: wordmark * 1.08 }]}
              >
                TFI
              </T>
            </View>
            <View style={styles.brandSide}>
              <T variant="label" color={palette.paper} size={12}>
                Telugu Film
              </T>
              <T variant="label" color={palette.paper} size={12}>
                Industry
              </T>
              <View style={styles.badge}>
                <T variant="label" color={palette.ink} size={11}>
                  Party Game
                </T>
              </View>
            </View>
          </View>

          <T variant="bold" size={compact ? 19 : 22} color={palette.paper} style={styles.tagline}>
            How well do you really know Telugu cinema?
          </T>
        </Animated.View>

        <View style={styles.cards}>
          {games.map((game, i) => (
            <Animated.View
              key={game.id}
              entering={FadeInDown.delay(140 + i * 80).duration(420).easing(motion.easeOut)}
            >
              <GameTicket game={game} index={i} compact={compact} />
            </Animated.View>
          ))}
        </View>

        <T variant="label" color={palette.paper} size={11} align="center" style={styles.footer}>
          Pass the phone · No sign-in · Plays offline
        </T>
      </ScrollView>
    </Screen>
  );
}

function GameTicket({ game, index, compact }: { game: GameInfo; index: number; compact: boolean }) {
  const theme = gameThemes[game.id];
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/intro/[game]', params: { game: game.id } })}
      accessibilityLabel={`${game.title}. ${game.tagline}`}
      accessibilityHint="Opens how to play"
      scaleTo={0.97}
    >
      <Ticket
        color={theme.bg}
        cutout={palette.ink}
        perforation={theme.fg}
        direction="row"
        contentStyle={[styles.ticketMain, compact && styles.ticketMainCompact]}
        stubStyle={styles.stub}
        stub={
          <>
            <T variant="display" color={theme.fg} size={26} style={{ opacity: 0.9 }}>
              {String(index + 1).padStart(2, '0')}
            </T>
            <View style={[styles.go, { backgroundColor: theme.fg }]}>
              <Ionicons name="arrow-forward" size={22} color={theme.bg} />
            </View>
          </>
        }
      >
        <View style={styles.ticketTop}>
          <View style={[styles.emoji, { backgroundColor: theme.deep }]}>
            <T size={24} style={styles.emojiText}>
              {game.emoji}
            </T>
          </View>
          <T variant="label" color={theme.fg} size={11} style={{ opacity: 0.8 }}>
            {game.players}
          </T>
        </View>
        <T
          variant="display"
          color={theme.fg}
          size={compact ? 27 : 32}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.ticketTitle}
        >
          {game.title}
        </T>
        <T variant="bold" color={theme.fg} size={15} style={{ opacity: 0.9 }}>
          {game.tagline}
        </T>
      </Ticket>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.xl - 4,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    gap: space.xl,
  },
  header: {
    gap: space.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  wordmark: {
    fontFamily: fonts.display,
    letterSpacing: 2,
  },
  wordmarkShadow: {
    position: 'absolute',
    color: palette.chilli,
    left: 6,
    top: 6,
  },
  wordmarkFront: {
    color: palette.turmeric,
  },
  brandSide: {
    gap: 2,
    paddingTop: space.sm,
  },
  badge: {
    marginTop: space.sm,
    alignSelf: 'flex-start',
    backgroundColor: palette.turmeric,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    transform: [{ rotate: '-4deg' }],
  },
  tagline: {
    maxWidth: 340,
  },
  cards: {
    gap: space.lg,
  },
  ticketMain: {
    paddingVertical: space.lg + 2,
    paddingLeft: space.lg + 2,
    paddingRight: space.md,
    gap: 4,
  },
  ticketMainCompact: {
    paddingVertical: space.md + 2,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  emoji: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    lineHeight: 30,
  },
  ticketTitle: {
    marginTop: 2,
  },
  stub: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.lg,
  },
  go: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    opacity: 0.5,
    marginTop: space.sm,
  },
});
