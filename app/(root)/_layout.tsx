import { Stack, useRouter } from 'expo-router';
import React from "react";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { View } from 'react-native';

const Layout = () => {
  const router = useRouter();

  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX > 100) { // Swipe right threshold
        router.push('/resume-reading');
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="resume-reading" 
            options={{ 
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right',
              headerStyle: {
                backgroundColor: '#333333',
              },
              headerTintColor: '#fff',
              headerTitle: 'Resume Reading'
            }} 
          />
        </Stack>
      </View>
    </GestureDetector>
  );
}

export default Layout;