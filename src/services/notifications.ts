import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get Expo push token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with actual project ID
    })).data;

    console.log('Push token:', token);

    // Save token to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'KapKurtar',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00A690',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

// Send local notification
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
}

// Send push notification via Expo push service
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Send notification to a specific user
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (!profile?.push_token) {
      console.log('User has no push token');
      return;
    }

    await sendPushNotification(profile.push_token, title, body, data);
  } catch (error) {
    console.error('Error sending notification to user:', error);
  }
}

// Notification types for the app
export type NotificationType =
  | 'new_reservation'
  | 'reservation_accepted'
  | 'reservation_rejected'
  | 'reservation_completed'
  | 'favorite_offer_available'
  | 'offer_expiring';

// Get notification content based on type
export function getNotificationContent(
  type: NotificationType,
  data: Record<string, any>
): { title: string; body: string } {
  switch (type) {
    case 'new_reservation':
      return {
        title: 'Yeni Rezervasyon!',
        body: `${data.clientName || 'Müşteri'} "${data.offerTitle}" için ${data.quantity} adet rezervasyon yaptı.`,
      };

    case 'reservation_accepted':
      return {
        title: 'Rezervasyonunuz Onaylandı!',
        body: `"${data.offerTitle}" rezervasyonunuz kabul edildi. Lütfen belirtilen saatlerde teslim alın.`,
      };

    case 'reservation_rejected':
      return {
        title: 'Rezervasyon İptal Edildi',
        body: `"${data.offerTitle}" rezervasyonunuz maalesef iptal edildi.`,
      };

    case 'reservation_completed':
      return {
        title: 'Teşekkürler!',
        body: `"${data.offerTitle}" siparişinizi teslim aldınız. Yemek israfını azalttınız!`,
      };

    case 'favorite_offer_available':
      return {
        title: 'Favori Mağazandan Yeni Teklif!',
        body: `${data.storeName} yeni bir teklif ekledi: "${data.offerTitle}"`,
      };

    case 'offer_expiring':
      return {
        title: 'Teklif Bitiyor!',
        body: `"${data.offerTitle}" teklifi 1 saat içinde sona eriyor. Kaçırmayın!`,
      };

    default:
      return {
        title: 'KapKurtar',
        body: 'Yeni bir bildiriminiz var.',
      };
  }
}

// Send typed notification
export async function sendTypedNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, any>
): Promise<void> {
  const { title, body } = getNotificationContent(type, data);
  await sendNotificationToUser(userId, title, body, { type, ...data });
}

// Setup notification listeners
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // Handle notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Handle user interaction with notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification response:', response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    }
  );

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

// Get badge count
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// Set badge count
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// Clear all notifications
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}
