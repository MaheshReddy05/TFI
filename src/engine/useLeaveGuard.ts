import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { haptics } from './haptics';

/**
 * Blocks every way out of an active round — the exit button, Android back,
 * iOS swipe-back — behind a "Leave this round?" confirmation.
 *
 * `confirming` is true while the dialog is open so screens can pause timers.
 * Call `allowLeave()` right before navigating away on purpose (round over).
 */
export function useLeaveGuard(active: boolean) {
  const navigation = useNavigation();
  const [confirming, setConfirming] = useState(false);
  const allowedRef = useRef(false);

  usePreventRemove(active, ({ data }) => {
    if (allowedRef.current) {
      navigation.dispatch(data.action);
      return;
    }
    haptics.tap();
    setConfirming(true);
    Alert.alert(
      'Leave this round?',
      'Your score for this round will be lost.',
      [
        { text: 'Keep playing', style: 'cancel', onPress: () => setConfirming(false) },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            setConfirming(false);
            navigation.dispatch(data.action);
          },
        },
      ],
      { cancelable: true, onDismiss: () => setConfirming(false) },
    );
  });

  const requestExit = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  const allowLeave = useCallback(() => {
    allowedRef.current = true;
  }, []);

  return { confirming, requestExit, allowLeave };
}
