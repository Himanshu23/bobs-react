import { PushNotifications } from '@capacitor/push-notifications';

export const initPushNotifications = async () => {
  const permission = await PushNotifications.requestPermissions();

  if (permission.receive !== 'granted') {
    console.log('Permission denied');
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener('registration', (token) => {
    console.log('FCM TOKEN:', token.value);

    // SEND TOKEN TO SPRING BOOT BACKEND
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
  });

  PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (notification) => {
      console.log('Notification clicked:', notification);
    }
  );
};
