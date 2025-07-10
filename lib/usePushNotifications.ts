// lib/usePushNotifications.ts
import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useUser } from '@clerk/clerk-expo';
import { fetchAPI } from './fetch';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { user } = useUser();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Send token to backend if user is logged in
        if (user?.id) {
          sendTokenToBackend(token, user.id);
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification:', response);
      // Handle notification tap - could navigate to specific paper or screen
      handleNotificationTap(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current!);
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, [user?.id]);

  // Send token to backend when user changes
  useEffect(() => {
    if (expoPushToken && user?.id) {
      sendTokenToBackend(expoPushToken, user.id);
    }
  }, [expoPushToken, user?.id]);

  return expoPushToken;
}

async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token!');
      return;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Push token:', token);
    return token;
  } else {
    alert('Must use physical device');
  }
}

async function sendTokenToBackend(token: string, userId: string) {
  try {
    console.log('Sending push token to backend for user:', userId);
    await fetchAPI(`/user/${userId}/push-token`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expoPushToken: token,
      }),
    });
    console.log('Push token sent to backend successfully');
  } catch (error) {
    console.error('Failed to send push token to backend:', error);
  }
}

function handleNotificationTap(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data;
  
  if (data?.type === 'batched_papers') {
    // Navigate to home screen to show new papers
    // You can implement navigation logic here if needed
    console.log('User tapped batched papers notification');
  } else if (data?.type === 'new_paper') {
    // Navigate to specific paper
    console.log('User tapped new paper notification:', data.paperId);
    // You can implement navigation to paper detail here
  }
}