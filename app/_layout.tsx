import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import * as React from "react";
import '../lib/reanimated-setup';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import * as Notifications from 'expo-notifications';
import { View, Text } from 'react-native';
import ErrorBoundary from '../components/ErrorBoundary';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Debug logging
console.log('🔍 Debug Info:');
console.log('Publishable Key:', publishableKey ? 'Present' : 'Missing');
console.log('Environment:', process.env.NODE_ENV || 'development');

// Debug component to show what's happening
const DebugInfo = ({ message }: { message: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#1F2937' }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#ffffff' }}>Debug Info</Text>
    <Text style={{ fontSize: 14, textAlign: 'center', color: '#9CA3AF', marginBottom: 10 }}>
      {message}
    </Text>
    <Text style={{ fontSize: 12, textAlign: 'center', color: '#6B7280' }}>
      Key: {publishableKey ? 'Present' : 'Missing'}
    </Text>
  </View>
);

// Error boundary component
const ErrorFallback = ({ error }: { error: Error }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#1F2937' }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#ffffff' }}>Something went wrong</Text>
    <Text style={{ fontSize: 14, textAlign: 'center', color: '#9CA3AF' }}>
      {error.message}
    </Text>
  </View>
);

export default function RootLayout() {
  const [loaded] = useFonts({
    "Jakarta-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Jakarta-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "Jakarta-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
    "Jakarta-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "Jakarta-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    Jakarta: require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2937' }}>
        <Text style={{ fontSize: 16, color: '#ffffff' }}>Loading...</Text>
      </View>
    );
  }

  // Check for required environment variables
  if (!publishableKey) {
    return <DebugInfo message="Missing Clerk Publishable Key. Please check your environment configuration." />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
          <ClerkLoaded>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(root)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ClerkLoaded>
        </ClerkProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}