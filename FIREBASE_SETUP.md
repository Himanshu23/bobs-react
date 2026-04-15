# Firebase Push Notifications Setup Guide

## Overview
This application uses Firebase Cloud Messaging (FCM) to send push notifications to admin devices, even when the browser is closed or the app is backgrounded.

## Why Firebase?
- ✅ Works when browser is closed
- ✅ Works even when app is backgrounded
- ✅ Reliable (Google's infrastructure)
- ✅ Free tier: up to 500K messages/month
- ✅ Works on web, iOS, and Android

## Architecture
```
User creates order
    ↓
Backend sends FCM notification to registered admin devices
    ↓
Admin receives notification (even if app closed)
    ↓
If admin opens notification → navigates to /admin
    ↓
WebSocket + Audio alerts if still available
```

## Step-by-Step Setup

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Create Project"
3. Name it "Bobs Restaurant" (or similar)
4. Disable Analytics (optional)
5. Click "Create Project" and wait for setup

### 2. Get Web Configuration

1. In Firebase Console, click gear icon ⚙️ → Project Settings
2. Scroll down to "Your apps" section
3. Click fire icon 🔥 "Web" (or click "Add app")
4. Register web app with name "Bob's Restaurant Admin"
5. Copy the config object that looks like:
```javascript
{
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

### 3. Create Web Push VAPID Key

1. In Firebase Console: Messaging (left menu)
2. Go to "Cloud Messaging" tab
3. Scroll to "Web push certificates"
4. If no key exists, click "Generate Key Pair"
5. Copy the public key

### 4. Set Environment Variables

Create `.env.local` file (or update existing):
```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key
```

### 5. Backend: Enable Firebase Admin SDK

1. Firebase Console → Project Settings (gear icon)
2. Go to "Service Accounts" tab
3. Click "Generate New Private Key"
4. This downloads a JSON file
5. Save as: `android/app/src/main/resources/firebase-adminsdk.json`

### 6. Backend: Add Firebase Admin SDK Dependency

Add to `android/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.firebase:firebase-admin:9.1.0'
}
```

### 7. Backend: Initialize Firebase Admin

Add to your Spring Boot application main class or configuration:
```java
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import java.io.FileInputStream;

@Configuration
public class FirebaseConfig {
  @Bean
  public void initializeFirebase() throws Exception {
    FileInputStream serviceAccount =
        new FileInputStream("android/app/src/main/resources/firebase-adminsdk.json");
    FirebaseOptions options = new FirebaseOptions.Builder()
        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
        .build();
    FirebaseApp.initializeApp(options);
  }
}
```

### 8. Test Setup

1. Start your app: `npm run dev`
2. Open browser DevTools Console
3. Check for messages:
   - `[FIREBASE] Initialized successfully` ✅
   - `[FCM] Service Worker registered` ✅
   - `[FCM] Device token obtained` ✅
4. You should see "Allow notifications?" prompt
5. Click Allow

### 9. Test Sending Notifications

#### Option A: Send Test Notification via Backend
```bash
curl -X POST http://localhost:8080/api/admin/devices/test
```

#### Option B: Send from Firebase Console
1. Firebase Console → Messaging (left menu)
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Select your app/device
6. Click "Send"

### 10. Send New Order Notifications

From your Spring Boot Order Service:

```java
@Autowired
private FCMNotificationService fcmNotificationService;

// When new order is created:
fcmNotificationService.sendNewOrderNotification(
    adminDeviceToken,
    order.getId(),
    order.getCustomerName(),
    order.getTotalAmount()
);
```

Or via REST API:
```bash
curl -X POST http://localhost:8080/api/admin/devices/notify-new-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "12345",
    "customerName": "John Doe",
    "totalAmount": 500
  }'
```

## Mobile (Capacitor) Setup

### For iOS
1. Install plugin: `npm install @capacitor-firebase/messaging`
2. Run: `npx cap add ios`
3. In Xcode: Add Firebase via CocoaPods
4. Add APNs certificate in Firebase Console

### For Android
1. Install plugin: `npm install @capacitor-firebase/messaging`
2. Run: `npx cap add android`
3. Add `google-services.json` to `android/app/`
4. Download from Firebase Console → Project Settings → Your apps → Android

## Troubleshooting

### "Firebase not configured"
- Check `.env.local` variables
- Restart dev server: `npm run dev`
- Verify all 7 environment variables are set

### "Service Worker failed to register"
- Check browser console for errors
- Ensure `/public/firebase-messaging-sw.js` exists
- Enable https (Firebase requires secure context)

### "Permission denied" prompt not showing
- Clear browser cache/cookies
- Try incognito window
- Check Firebase Console → Authentication → Enable Anonymous auth

### No notification received
- Check admin device is registered: `curl http://localhost:8080/api/admin/devices/count`
- Check backend logs for FCM errors
- Verify Service Worker is active: DevTools → Application → Service Workers

### Device token keeps changing
- Tokens expire periodically
- System periodically refreshes via `registerServiceWorkerAndGetToken()`
- Frontend auto-sends new token to backend

## Production Notes

⚠️ **Important:**
1. Move device token storage from memory to database
2. Implement token cleanup (remove expired tokens)
3. Add authentication to device token endpoints
4. Use environment variables for Firebase config
5. Don't commit service account key to git
6. Enable rate limiting on notification endpoints

## API Endpoints

### Register Device
```
POST /api/admin/devices/register
{
  "fcmToken": "...",
  "deviceName": "user agent string",
  "platform": "web|mobile"
}
```

### Get Device Count
```
GET /api/admin/devices/count
```

### Send Test Notification
```
POST /api/admin/devices/test
```

### Send New Order Notification
```
POST /api/admin/devices/notify-new-order
{
  "orderId": "123",
  "customerName": "John",
  "totalAmount": 500
}
```

### Unregister Device
```
DELETE /api/admin/devices/unregister/{token}
```

## Files Modified

Frontend:
- `src/config/firebase.ts` - Firebase initialization
- `src/utils/firebaseMessaging.ts` - FCM utilities
- `src/pages/admin/CurrentOrdersTab.tsx` - Initialize FCM on page load
- `public/firebase-messaging-sw.js` - Service Worker for background notifications
- `.env.example` - Environment variables template

Backend:
- `android/app/src/main/java/.../notification/FCMNotificationService.java` - FCM service
- `android/app/src/main/java/.../notification/DeviceTokenController.java` - REST endpoints
