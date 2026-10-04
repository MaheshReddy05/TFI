import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useTiltControls } from '../engine/useTiltControls';

type Listener = (event: { accelerationIncludingGravity?: { x: number; y: number; z: number } }) => void;

// `mock`-prefixed so jest's hoisting of the factory below allows the reference.
const mockListeners: Listener[] = [];
const mockIsAvailable = jest.fn<() => Promise<boolean>>();
const mockAddListener = jest.fn<(fn: Listener) => { remove: () => void }>();
const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();

jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    isAvailableAsync: () => mockIsAvailable(),
    setUpdateInterval: () => {},
    addListener: (fn: Listener) => mockAddListener(fn),
    getPermissionsAsync: () => mockGetPermissions(),
    requestPermissionsAsync: () => mockRequestPermissions(),
  },
}));

/** Gravity readings, in m/s². Face-up reads z ≈ -9.81 on both platforms. */
const upright = { x: 9.81, y: 0, z: 0 };
const screenToFloor = { x: 0, y: 0, z: 9.81 };

function emit(g: { x: number; y: number; z: number }, times = 1) {
  for (let i = 0; i < times; i++) {
    for (const fn of mockListeners) fn({ accelerationIncludingGravity: g });
  }
}

const render = (over: Partial<Parameters<typeof useTiltControls>[0]> = {}) =>
  renderHook(() =>
    useTiltControls({ enabled: true, listening: true, accepting: true, onTilt: () => {}, ...over }),
  );

describe('useTiltControls', () => {
  beforeEach(() => {
    mockListeners.length = 0;
    jest.clearAllMocks();
    mockIsAvailable.mockResolvedValue(true);
    mockAddListener.mockImplementation((fn) => {
      mockListeners.push(fn);
      return { remove: () => {} };
    });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Regression: expo-sensors' permission calls check the pedometer /
   * activity-recognition permission, which accelerometer data does not
   * require. Gating on them switched tilt off on devices whose sensors work.
   */
  it('never asks for the motion permission', async () => {
    const { result } = await render();
    await act(async () => {});

    expect(mockGetPermissions).not.toHaveBeenCalled();
    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(result.current.status).toBe('ready');
    expect(mockAddListener).toHaveBeenCalled();
  });

  it('delivers a tilt once the phone is neutral and then tips toward the floor', async () => {
    const onTilt = jest.fn();
    await render({ onTilt });
    await act(async () => {});

    await act(async () => {
      emit(upright, 4); // calibrate, then arm
      emit(screenToFloor, 3); // past the threshold, held
    });
    expect(onTilt).toHaveBeenCalledWith('correct');
  });

  it('swallows tilts while not accepting', async () => {
    const onTilt = jest.fn();
    await render({ accepting: false, onTilt });
    await act(async () => {});

    await act(async () => {
      emit(upright, 4);
      emit(screenToFloor, 3);
    });
    expect(onTilt).not.toHaveBeenCalled();
  });

  it('falls back to buttons when the sensor sends no data', async () => {
    jest.useFakeTimers();
    const { result } = await render();
    await act(async () => {});
    expect(result.current.status).toBe('ready');

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.status).toBe('unavailable');
  });

  it('falls back to buttons when subscribing throws', async () => {
    jest.useFakeTimers();
    mockAddListener.mockImplementation(() => {
      throw new Error('no native module');
    });
    const { result } = await render();
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(result.current.status).toBe('unavailable');
  });

  it('reports unavailable when the device has no sensor', async () => {
    mockIsAvailable.mockResolvedValue(false);
    const { result } = await render();
    await act(async () => {});

    expect(result.current.status).toBe('unavailable');
    expect(mockAddListener).not.toHaveBeenCalled();
  });
});
