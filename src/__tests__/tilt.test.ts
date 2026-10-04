import { describe, expect, it } from '@jest/globals';
import {
  DEFAULT_TILT_CONFIG,
  initialTiltState,
  pitchFromGravity,
  stepTilt,
  type TiltEvent,
  type TiltState,
} from '../engine/tilt';

const STEP_MS = 40;

/** Feeds a list of pitch samples (degrees) and collects emitted events. */
function run(pitches: number[], start: TiltState = initialTiltState(), t0 = 0) {
  let state = start;
  const events: TiltEvent[] = [];
  pitches.forEach((p, i) => {
    const r = stepTilt(state, p, t0 + i * STEP_MS);
    state = r.state;
    if (r.event) events.push(r.event);
  });
  return { state, events };
}

const neutral = (n: number) => Array(n).fill(0);
const hold = (deg: number, n: number) => Array(n).fill(deg);

describe('pitchFromGravity', () => {
  it('maps face-up, upright and face-down', () => {
    expect(pitchFromGravity(0, 0, -9.81)).toBeCloseTo(90);
    expect(pitchFromGravity(9.81, 0, 0)).toBeCloseTo(0);
    expect(pitchFromGravity(0, 0, 9.81)).toBeCloseTo(-90);
  });

  it('rejects empty readings', () => {
    expect(pitchFromGravity(0, 0, 0)).toBeNull();
    expect(pitchFromGravity(NaN, 0, 0)).toBeNull();
  });
});

describe('stepTilt', () => {
  it('tilting down scores correct, tilting up skips', () => {
    expect(run([...neutral(4), ...hold(-60, 3)]).events).toEqual(['correct']);
    expect(run([...neutral(4), ...hold(60, 3)]).events).toEqual(['skip']);
  });

  it('ignores single-sample spikes (debounce)', () => {
    expect(run([...neutral(4), -70, 0, 70, 0, -70, ...neutral(4)]).events).toEqual([]);
  });

  it('does not fire before the phone has been neutral first', () => {
    // Round starts with the phone already tilted: calibrates, but never arms.
    expect(run([0, ...hold(-60, 10)]).events).toEqual([]);
  });

  it('rapid repeated tilts without returning to neutral fire only once', () => {
    const wobble = [...hold(-60, 3), ...hold(-35, 2), ...hold(-60, 3), ...hold(-30, 2), ...hold(-60, 3)];
    expect(run([...neutral(4), ...wobble]).events).toEqual(['correct']);
  });

  it('down then straight up without a neutral pause fires only the first', () => {
    expect(run([...neutral(4), ...hold(-60, 3), ...hold(60, 5)]).events).toEqual(['correct']);
  });

  it('re-arms after a neutral reset and the cooldown', () => {
    const cooldownSamples = Math.ceil(DEFAULT_TILT_CONFIG.cooldownMs / STEP_MS) + 2;
    const { events } = run([...neutral(4), ...hold(-60, 3), ...neutral(cooldownSamples), ...hold(60, 3)]);
    expect(events).toEqual(['correct', 'skip']);
  });

  it('a quick neutral blip inside the cooldown does not re-arm', () => {
    const { events } = run([...neutral(4), ...hold(-60, 3), ...neutral(2), ...hold(-60, 3)]);
    expect(events).toEqual(['correct']);
  });

  it('measures tilt from a calibrated baseline (clamped)', () => {
    // Held 15° back: a 30° absolute nod is only 45° from baseline -> correct.
    expect(run([15, ...hold(15, 3), ...hold(-30, 3)]).events).toEqual(['correct']);
    // Absurd starting angle is clamped to the max baseline.
    const { state } = run([80]);
    expect(state.baseline).toBe(DEFAULT_TILT_CONFIG.maxBaselineDeg);
  });

  it('small natural head movement never triggers', () => {
    const jitter = [5, -8, 12, -15, 18, -20, 10, -5, 25, -25, 0];
    expect(run([...neutral(4), ...jitter, ...jitter]).events).toEqual([]);
  });
});
