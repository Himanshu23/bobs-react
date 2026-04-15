// Firebase configuration - Initialize before using any Firebase services
import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';

/**
 * Firebase configuration
 * Get these values from Firebase Console:
 * 1. Go to https://console.firebase.google.com
 * 2. Create/select your project
 * 3. Click gear icon → Project Settings
 * 4. Scroll to "Your apps" section
 * 5. Copy config from "SDKs and setup and initialization"
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Validate Firebase config
const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (val) => val && val.length > 0
);

if (!isFirebaseConfigured) {
  console.warn(
    '[FIREBASE] Configuration incomplete. Push notifications disabled. Set environment variables.'
  );
}

// Initialize Firebase
let app;
let messaging;

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('[FIREBASE] Initialized successfully');
  }
} catch (error) {
  console.warn('[FIREBASE] Initialization failed:', error);
}

export { app, messaging, isFirebaseConfigured };
export { onMessage, getToken };
