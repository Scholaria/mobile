import { Stack } from 'expo-router';
import React from "react";


const Layout = () => {

  return (
    <Stack>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ headerShown: false }} />
    </Stack>
  );
}

export default Layout;