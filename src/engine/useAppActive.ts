import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** False while the app is backgrounded — used to pause round timers. */
export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}
