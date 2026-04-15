# Firebase Push Notifications - Quick Setup Checklist

## ✅ What Was Implemented

- [x] Frontend Firebase initialization (`src/config/firebase.ts`)
- [x] FCM utilities for token registration (`src/utils/firebaseMessaging.ts`)
- [x] Service Worker for background notifications (`public/firebase-messaging-sw.js`)
- [x] Backend FCM service to send notifications (`FCMNotificationService.java`)
- [x] Device registration endpoints (`DeviceTokenController.java`)
- [x] Integration with admin orders page
- [x] Comprehensive setup documentation

## 🚀 Quick Start (5 minutes)

### Step 1: Firebase Project Setup
```bash
# 1. Go to https://console.firebase.google.com
# 2. Create new project "Bobs Restaurant"
# 3. Get Web config (Settings → Your apps → Web)
# 4. Generate Web Push VAPID key (Messaging → Cloud Messaging)
```

### Step 2: Configure Frontend
```bash
# Create .env.local in root directory
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key
```

### Step 3: Configure Backend
```bash
# 1. Firebase Console → Settings → Service Accounts
# 2. Click "Generate New Private Key"
# 3. Save the JSON to: android/app/src/main/resources/firebase-adminsdk.json
# 4. Add Firebase Admin SDK dependency in build.gradle
```

### Step 4: Initialize Firebase in Backend
```java
// Add to your Spring Boot Application class
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

### Step 5: Test in Browser
```bash
# 1. npm run dev
# 2. Open admin page
# 3. Check browser console for:
#    ✅ [FIREBASE] Initialized successfully
#    ✅ [FCM] Service Worker registered
#    ✅ [FCM] Device token obtained
# 4. Allow notifications when prompted
```

### Step 6: Test Notifications
```bash
# Send test notification to all registered admin devices
curl -X POST http://localhost:8080/api/admin/devices/test

# Check registered devices
curl http://localhost:8080/api/admin/devices/count

# Send new order notification
curl -X POST http://localhost:8080/api/admin/devices/notify-new-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "123",
    "customerName": "John Doe",
    "totalAmount": 500
  }'
```

## 📋 Next Steps

### When Order is Created
Call FCM service from order creation endpoint:

```java
@Autowired
private FCMNotificationService fcmNotificationService;

@PostMapping("/orders")
public ResponseEntity<?> createOrder(@RequestBody OrderRequest request) {
    Order order = orderService.create(request);
    
    // Send FCM notification to all admin devices
    // TODO: Get actual admin device tokens from database
    fcmNotificationService.sendNewOrderNotification(
        adminDeviceToken,
        order.getId(),
        order.getCustomerName(),
        order.getTotalAmount()
    );
    
    return ResponseEntity.ok(order);
}
```

### Production Checklist
- [ ] Move device tokens from memory to database
- [ ] Add authentication to device endpoints
- [ ] Implement token cleanup (remove expired tokens)
- [ ] Add rate limiting
- [ ] Use environment variables for all Firebase config
- [ ] Don't commit service account key to git
- [ ] Add `.env.local` to `.gitignore`

## 🔗 How It Works

```
1. User opens admin page
   ↓
2. Browser requests notification permission
   ↓
3. Service Worker registered automatically
   ↓
4. Firebase device token obtained
   ↓
5. Token sent to backend (POST /api/admin/devices/register)
   ↓
6. Backend stores token in database
   ↓
7. When new order arrives:
   - Backend calls FCM with all registered device tokens
   ↓
8. Admin gets notification:
   - If browser open → Foreground + WebSocket + Sound
   - If browser closed → Push notification wakes device
   - If app backgrounded → Push notification shows
```

## 📱 Mobile Support

### iOS (Capacitor)
```bash
npm install @capacitor-firebase/messaging
npx cap add ios
# In Xcode: Add Firebase via CocoaPods, configure APNs
```

### Android (Capacitor)
```bash
npm install @capacitor-firebase/messaging
npx cap add android
# Download google-services.json from Firebase Console
# Place in android/app/
```

## 💡 Key Features

✅ **Reliable**: Google's infrastructure  
✅ **Background**: Works when app closed  
✅ **Mobile**: Works on iOS, Android, Web  
✅ **Hybrid**: Combines FCM + WebSocket  
✅ **Free**: Up to 500K messages/month free tier  
✅ **Real-time**: Instant notifications for new orders

## 📖 Full Documentation

See `FIREBASE_SETUP.md` for:
- Detailed step-by-step setup
- Troubleshooting guide
- API endpoints documentation
- Production deployment notes
