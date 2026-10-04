import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, Keyframe } from 'react-native-reanimated';

import { haptics } from '../engine/haptics';
import { fonts, motion } from '../theme/tokens';

const STEPS = ['3', '2', '1', 'GO!'] as const;
const STEP_MS = 800;

const punchIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 1.7 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: motion.easeOut },
}).duration(260);

/** 3 · 2 · 1 · GO! — each beat punches in with a haptic tick. */
export function Countdown({
  color,
  goColor,
  size,
  onDone,
}: {
  color: string;
  goColor: string;
  size: number;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const isGo = step === STEPS.length - 1;
    if (isGo) haptics.thud();
    else haptics.tick();
    const t = setTimeout(
      () => (isGo ? onDoneRef.current() : setStep((s) => s + 1)),
      isGo ? 550 : STEP_MS,
    );
    return () => clearTimeout(t);
  }, [step]);

  const isGo = step === STEPS.length - 1;
  return (
    <View style={styles.wrap} accessibilityLiveRegion="assertive">
      <Animated.Text
        key={step}
        entering={punchIn}
        exiting={FadeOut.duration(120)}
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: fonts.display,
          fontSize: size,
          lineHeight: size * 1.15,
          color: isGo ? goColor : color,
          textAlign: 'center',
        }}
      >
        {STEPS[step]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
