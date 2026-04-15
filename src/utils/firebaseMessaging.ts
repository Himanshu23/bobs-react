/**
 * Firebase Cloud Messaging (FCM) push notification utilities
 * Handles device token registration and FCM setup
 */

import { messaging, getToken, isFirebaseConfigured } from '../config/firebase';
import { API_BASE_URL } from '../config/api';
import { getHeaders } from './authHelpers';

const FCM_TOKEN_STORAGE_KEY = 'fcm_device_token';
const FCM_PERMISSION_STORAGE_KEY = 'fcm_permission_status';

/**
 * Request permission for push notifications
 */
export const requestFCMPermission = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator) || !isFirebaseConfigured) {
    console.warn('[FCM] Service Worker or Firebase not supported');
    return false;
  }

  try {
    // Check if already denied
    const cachedPermission = localStorage.getItem(FCM_PERMISSION_STORAGE_KEY);
    if (cachedPermission === 'denied') {
      console.log('[FCM] Permission previously denied by user');
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('[FCM] Notification permission granted');
      localStorage.setItem(FCM_PERMISSION_STORAGE_KEY, 'granted');
      return true;
    } else if (permission === 'denied') {
      console.log('[FCM] Notification permission denied');
      localStorage.setItem(FCM_PERMISSION_STORAGE_KEY, 'denied');
      return false;
    }

    return false;
  } catch (error) {
    console.error('[FCM] Error requesting permission:', error);
    return false;
  }
};

/**
 * Register Service Worker and get FCM token
 */
export const registerServiceWorkerAndGetToken = async (): Promise<
  string | null
> => {
  if (!isFirebaseConfigured) {
    console.warn('[FCM] Firebase not configured');
    return null;
  }

  // Check for cached token
  const cachedToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  if (cachedToken) {
    console.log('[FCM] Using cached device token');
    return cachedToken;
  }

  try {
    // Register service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' }
      );
      console.log('[FCM] Service Worker registered:', registration);

      // Get FCM token
      if (messaging) {
        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
        });

        if (token) {
          console.log(
            '[FCM] Device token obtained:',
            token.substring(0, 20) + '...'
          );
          localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
          return token;
        }
      }
    }
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
  }

  return null;
};

/**
 * Get stored FCM token
 */
export const getFCMToken = (): string | null => {
  return localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
};

/**
 * Send FCM token to backend for storage
 * Backend will use this to send notifications to this device
 */
export const sendFCMTokenToBackend = async (
  token: string
): Promise<boolean> => {
  try {
    // Use auth headers if user is logged in, otherwise send without auth
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const authHeaders = getHeaders();
    if (authHeaders.Authorization) {
      headers.Authorization = authHeaders.Authorization;
    }
    const response = await fetch(`${API_BASE_URL}/fcm/register-device`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fcmToken: token,
        deviceName: navigator.userAgent,
        platform:
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
            ? 'mobile'
            : 'web',
      }),
    });

    if (response.ok) {
      console.log('[FCM] Token sent to backend successfully');
      return true;
    } else if (response.status === 404) {
      console.warn('[FCM] Endpoint not found on backend - FCM registration skipped');
      return false;
    } else if (response.status === 403) {
      console.warn('[FCM] Permission denied - try logging in first');
      return false;
    } else {
      console.warn('[FCM] Failed to send token to backend:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[FCM] Error sending token to backend:', error);
    return false;
  }
};

/**
 * Clear FCM token and permissions
 */
export const clearFCMToken = (): void => {
  localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
  localStorage.removeItem(FCM_PERMISSION_STORAGE_KEY);
  console.log('[FCM] Tokens cleared');
};

/**
 * Initialize FCM push notifications
 * Call this on app startup for admin/mobile
 */
export const initializeFCM = async (): Promise<void> => {
  if (!isFirebaseConfigured) {
    console.log('[FCM] Firebase not configured, push notifications disabled');
    return;
  }

  try {
    console.log('[FCM] Initializing push notifications...');

    // Request permission
    const permissionGranted = await requestFCMPermission();

    if (!permissionGranted) {
      console.log('[FCM] Push notification permission not granted');
      return;
    }

    // Register service worker and get token
    const token = await registerServiceWorkerAndGetToken();

    if (!token) {
      console.warn('[FCM] Failed to get FCM token');
      return;
    }

    // Send token to backend
    const sent = await sendFCMTokenToBackend(token);

    if (sent) {
      console.log('[FCM] FCM initialization complete');
    }
  } catch (error) {
    console.error('[FCM] Initialization error:', error);
  }
};
