import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import apiClient from '../api/client';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token;
  } catch {
    return null;
  }
}

/**
 * Register the device's FCM token with the backend so push notifications can be sent.
 * Call this after the user logs in (and on token refresh).
 */
export async function registerPushTokenWithBackend(): Promise<void> {
  try {
    const token = await getFCMToken();
    if (!token) return;
    await apiClient.post('/user/devices', {
      platform: Platform.OS,
      token,
      appVersion: '1.0.0',
    });
  } catch {
    // Best-effort: silent fail
  }
}

/** Re-register on token refresh. */
export function setupTokenRefreshHandler() {
  return messaging().onTokenRefresh(async (newToken) => {
    try {
      await apiClient.post('/user/devices', {
        platform: Platform.OS,
        token: newToken,
        appVersion: '1.0.0',
      });
    } catch {}
  });
}

export function onMessageReceived(callback: (message: any) => void) {
  return messaging().onMessage(callback);
}

export function onNotificationOpenedApp(callback: (message: any) => void) {
  return messaging().onNotificationOpenedApp(callback);
}

/**
 * Bootstrap: permission + token + backend register.
 * Returns true on full success.
 */
export async function initializePushNotifications(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  await registerPushTokenWithBackend();
  return true;
}
