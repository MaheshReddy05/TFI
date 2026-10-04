/**
 * Pure tilt-gesture state machine for Movie on My Head.
 *
 * The phone sits on a forehead in landscape, screen facing the room. We only
 * care about the screen's pitch: how far it faces the floor or the ceiling.
 *
 *   tilt DOWN (screen to floor, a nod)       → correct
 *   tilt UP   (screen to ceiling, head back) → skip
 *
 * Safeguards against accidental or repeated triggers:
 *   - threshold:  must pass `triggerDeg` away from the calibrated baseline
 *   - debounce:   must stay there for `holdSamples` consecutive samples
 *   - neutral reset: after any trigger, nothing fires until the phone is back
 *                 near the baseline for `holdSamples` samples
 *   - cooldown:   and at least `cooldownMs` has passed since the last trigger
 */

export type TiltEvent = 'correct' | 'skip';
type Zone = 'neutral' | 'between' | 'down' | 'up';

export interface TiltConfig {
  triggerDeg: number;
  neutralDeg: number;
  holdSamples: number;
  cooldownMs: number;
  /** Baseline is clamped so a badly-held start can't move the goalposts too far. */
  maxBaselineDeg: number;
}

export const DEFAULT_TILT_CONFIG: TiltConfig = {
  triggerDeg: 40,
  neutralDeg: 20,
  holdSamples: 2,
  cooldownMs: 700,
  maxBaselineDeg: 25,
};

export interface TiltState {
  baseline: number | null;
  armed: boolean;
  zone: Zone;
  streak: number;
  lastTriggerAt: number;
}

export function initialTiltState(): TiltState {
  return { baseline: null, armed: false, zone: 'neutral', streak: 0, lastTriggerAt: -Infinity };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Converts a gravity reading (device axes, m/s²) into screen pitch in degrees:
 * +90 = screen facing the ceiling, 0 = upright, -90 = screen facing the floor.
 *
 * expo-sensors reports `accelerationIncludingGravity` with the same sign on
 * iOS and Android: a phone lying face-up reads z ≈ -9.8.
 */
export function pitchFromGravity(x: number, y: number, z: number): number | null {
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  if (!Number.isFinite(magnitude) || magnitude < 1) return null;
  return (Math.asin(clamp(-z / magnitude, -1, 1)) * 180) / Math.PI;
}

/** Tilt relative to baseline as -1 (full correct) … +1 (full skip). */
export function tiltProgress(state: TiltState, pitch: number, config = DEFAULT_TILT_CONFIG): number {
  if (state.baseline === null) return 0;
  return clamp((pitch - state.baseline) / config.triggerDeg, -1, 1);
}

export function stepTilt(
  state: TiltState,
  pitch: number,
  now: number,
  config: TiltConfig = DEFAULT_TILT_CONFIG,
): { state: TiltState; event: TiltEvent | null } {
  if (state.baseline === null) {
    return {
      state: {
        ...state,
        baseline: clamp(pitch, -config.maxBaselineDeg, config.maxBaselineDeg),
        zone: 'neutral',
        streak: 1,
      },
      event: null,
    };
  }

  const delta = pitch - state.baseline;
  const zone: Zone =
    delta <= -config.triggerDeg
      ? 'down'
      : delta >= config.triggerDeg
        ? 'up'
        : Math.abs(delta) <= config.neutralDeg
          ? 'neutral'
          : 'between';
  const streak = zone === state.zone ? state.streak + 1 : 1;
  const next: TiltState = { ...state, zone, streak };

  if (!state.armed) {
    const cooled = now - state.lastTriggerAt >= config.cooldownMs;
    if (zone === 'neutral' && streak >= config.holdSamples && cooled) {
      next.armed = true;
    }
    return { state: next, event: null };
  }

  if ((zone === 'down' || zone === 'up') && streak >= config.holdSamples) {
    return {
      state: { ...next, armed: false, lastTriggerAt: now },
      event: zone === 'down' ? 'correct' : 'skip',
    };
  }

  return { state: next, event: null };
}
