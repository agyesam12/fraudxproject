import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';

import SmsInbox, { type NativeSms } from '../../modules/sms-inbox';

export type DeviceSmsStatus =
  /** iOS, web or Expo Go: no way to read SMS. */
  | 'unsupported'
  /** Supported, but the user has not granted READ_SMS yet. */
  | 'needs_permission'
  | 'denied'
  | 'connected'
  | 'error';

const HISTORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const HISTORY_LIMIT = 60;

/**
 * Streams the Android SMS inbox into FraudX. `onMessages` receives the initial
 * history once (isLive=false), then each new message as it lands (isLive=true)
 * so real-time alerts only fire for genuinely new SMS.
 */
export function useDeviceSms(enabled: boolean, onMessages: (msgs: NativeSms[], isLive: boolean) => void) {
  const supported = Platform.OS === 'android' && SmsInbox != null;
  const [status, setStatus] = useState<DeviceSmsStatus>(() =>
    !supported ? 'unsupported' : SmsInbox!.hasPermission() ? 'connected' : 'needs_permission',
  );
  const lastSeen = useRef(0);
  const callback = useRef(onMessages);
  callback.current = onMessages;

  const requestAccess = useCallback(async () => {
    if (!supported) return false;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
      title: 'Let FraudX check your messages',
      message:
        'FraudX scans incoming SMS on your phone to warn you about MoMo scams. Messages are analysed on this device and never uploaded.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    });
    const granted = result === PermissionsAndroid.RESULTS.GRANTED;
    setStatus(granted ? 'connected' : 'denied');
    return granted;
  }, [supported]);

  const active = supported && enabled && status === 'connected';

  useEffect(() => {
    if (!active || !SmsInbox) return;
    const inbox = SmsInbox;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const pull = async (isLive: boolean) => {
      try {
        const since = lastSeen.current || Date.now() - HISTORY_WINDOW_MS;
        const msgs = await inbox.getMessages(isLive ? 20 : HISTORY_LIMIT, since);
        if (cancelled || msgs.length === 0) return;
        lastSeen.current = Math.max(lastSeen.current, ...msgs.map((m) => m.receivedAt));
        callback.current(msgs, isLive);
      } catch {
        if (!cancelled) setStatus(inbox.hasPermission() ? 'error' : 'denied');
      }
    };

    pull(false);
    // The provider fires several change events per SMS; coalesce them.
    const sub = inbox.addListener('onInboxChange', () => {
      clearTimeout(timer);
      timer = setTimeout(() => pull(true), 400);
    });
    // Catch anything that arrived while the app was in the background.
    const appSub = AppState.addEventListener('change', (s) => s === 'active' && pull(true));

    return () => {
      cancelled = true;
      clearTimeout(timer);
      sub.remove();
      appSub.remove();
    };
  }, [active]);

  return { status, supported, requestAccess } as const;
}
