import { DeviceMotion } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import {
  DEFAULT_TILT_CONFIG,
  initialTiltState,
  pitchFromGravity,
  stepTilt,
  tiltProgress,
  type TiltEvent,
} from './tilt';

export type MotionStatus = 'checking' | 'ready' | 'unavailable' | 'denied';

const SAMPLE_INTERVAL_MS = 40;
/** If no usable gravity sample arrives within this window, fall back to buttons. */
const NO_DATA_TIMEOUT_MS = 1500;

/**
 * Device-motion tilt controls.
 *
 * - `status` resolves availability + permission once on mount.
 * - While `listening`, every sample steps the pure tilt state machine.
 * - `progress` (-1 … 1) is a shared value so tilt feedback renders on the UI
 *   thread without re-rendering React.
 * - Events are only delivered while `accepting` is true; tilts during a
 *   feedback flash are swallowed (and still require a neutral reset).
 */
export function useTiltControls({
  enabled,
  listening,
  accepting,
  onTilt,
  onPitch,
}: {
  enabled: boolean;
  listening: boolean;
  accepting: boolean;
  onTilt: (event: TiltEvent) => void;
  /** Raw pitch stream, e.g. for "is the phone on the forehead yet?" checks. */
  onPitch?: (pitch: number) => void;
}) {
  const [probedStatus, setStatus] = useState<MotionStatus>('checking');
  const status: MotionStatus = enabled ? probedStatus : 'unavailable';
  const progress = useSharedValue(0);

  const stateRef = useRef(initialTiltState());
  const acceptingRef = useRef(accepting);
  const onTiltRef = useRef(onTilt);
  const onPitchRef = useRef(onPitch);

  useEffect(() => {
    acceptingRef.current = accepting;
    onTiltRef.current = onTilt;
    onPitchRef.current = onPitch;
  });

  // Availability + permission.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const available = await DeviceMotion.isAvailableAsync();
        if (!available) {
          if (!cancelled) setStatus('unavailable');
          return;
        }
        let permission = await DeviceMotion.getPermissionsAsync();
        if (!permission.granted && permission.canAskAgain) {
          permission = await DeviceMotion.requestPermissionsAsync();
        }
        if (!cancelled) setStatus(permission.granted ? 'ready' : 'denied');
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  /** Re-calibrates the neutral position from the next sample. */
  const calibrate = useCallback(() => {
    stateRef.current = initialTiltState();
    progress.set(0);
  }, [progress]);

  useEffect(() => {
    if (status !== 'ready' || !listening) return;

    let gotData = false;
    DeviceMotion.setUpdateInterval(SAMPLE_INTERVAL_MS);
    const subscription = DeviceMotion.addListener((m) => {
      const g = m.accelerationIncludingGravity;
      if (!g) return;
      const pitch = pitchFromGravity(g.x, g.y, g.z);
      if (pitch === null) return;
      gotData = true;

      onPitchRef.current?.(pitch);
      const { state, event } = stepTilt(stateRef.current, pitch, Date.now(), DEFAULT_TILT_CONFIG);
      stateRef.current = state;
      progress.set(state.armed ? tiltProgress(state, pitch) : 0);
      if (event && acceptingRef.current) onTiltRef.current(event);
    });

    const watchdog = setTimeout(() => {
      if (!gotData) setStatus('unavailable');
    }, NO_DATA_TIMEOUT_MS);

    return () => {
      clearTimeout(watchdog);
      subscription.remove();
      progress.set(0);
    };
  }, [status, listening, progress]);

  return { status, progress, calibrate };
}
