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

export type MotionStatus = 'checking' | 'ready' | 'unavailable';

const SAMPLE_INTERVAL_MS = 40;
/** If no usable gravity sample arrives within this window, fall back to buttons. */
const NO_DATA_TIMEOUT_MS = 1500;
/** A native call that never settles must not freeze the screen. */
const PROBE_TIMEOUT_MS = 1000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Device-motion tilt controls.
 *
 * Deliberately does NOT call `DeviceMotion.getPermissionsAsync()` /
 * `requestPermissionsAsync()`. Despite the name, those check the pedometer /
 * activity-recognition permission (iOS `CMPedometer`, Android
 * `ACTIVITY_RECOGNITION`) — which accelerometer and gyroscope data does not
 * require on either platform. Gating on it turned tilt off on devices whose
 * sensors work perfectly.
 *
 * Instead we subscribe optimistically and let real data decide: if no usable
 * sample arrives within `NO_DATA_TIMEOUT_MS`, the screen falls back to
 * on-screen buttons. That is the only signal that actually reflects whether
 * tilt can work.
 *
 * - `progress` (-1 … 1) drives tilt feedback on the UI thread.
 * - `pitch` is the raw live angle, for the calibration meter.
 * - Events are only delivered while `accepting` is true; tilts during a
 *   feedback flash are swallowed and still require a neutral reset.
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
  const pitch = useSharedValue(0);

  const stateRef = useRef(initialTiltState());
  const acceptingRef = useRef(accepting);
  const onTiltRef = useRef(onTilt);
  const onPitchRef = useRef(onPitch);

  useEffect(() => {
    acceptingRef.current = accepting;
    onTiltRef.current = onTilt;
    onPitchRef.current = onPitch;
  });

  // Hardware availability only — see the note above about permissions.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      let available = true;
      try {
        available = await withTimeout(DeviceMotion.isAvailableAsync(), PROBE_TIMEOUT_MS, true);
      } catch {
        // Assume it works; the data watchdog below is the real check.
        available = true;
      }
      if (!cancelled) setStatus(available ? 'ready' : 'unavailable');
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
    let subscription: { remove: () => void } | null = null;
    try {
      DeviceMotion.setUpdateInterval(SAMPLE_INTERVAL_MS);
      subscription = DeviceMotion.addListener((m) => {
        const g = m.accelerationIncludingGravity;
        if (!g) return;
        const next = pitchFromGravity(g.x, g.y, g.z);
        if (next === null) return;
        gotData = true;
        pitch.set(next);

        onPitchRef.current?.(next);
        const { state, event } = stepTilt(stateRef.current, next, Date.now(), DEFAULT_TILT_CONFIG);
        stateRef.current = state;
        progress.set(state.armed ? tiltProgress(state, next) : 0);
        if (event && acceptingRef.current) onTiltRef.current(event);
      });
    } catch {
      // Subscribing threw outright. Leave `subscription` null and let the
      // watchdog below fall back immediately, so a round is never left with
      // no working controls.
    }

    const watchdog = setTimeout(
      () => {
        if (!gotData) setStatus('unavailable');
      },
      subscription ? NO_DATA_TIMEOUT_MS : 0,
    );

    return () => {
      clearTimeout(watchdog);
      subscription?.remove();
      progress.set(0);
    };
  }, [status, listening, progress, pitch]);

  return { status, progress, pitch, calibrate };
}
