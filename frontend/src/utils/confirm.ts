import { Alert, Platform } from 'react-native';

/**
 * Ask the user to confirm a destructive action.
 * Alert.alert ignores buttons on web, so fall back to the browser's confirm dialog there.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? true);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** Show a short message. Alert.alert is a no-op on web, so use the browser's alert there. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    globalThis.alert?.(message ? `${title}\n\n${message}` : title);
    return;
  }
  if (message === undefined) Alert.alert(title);
  else Alert.alert(title, message);
}
