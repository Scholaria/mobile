import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import * as React from "react";

const Home = () => {
  
  const { isSignedIn, isLoaded } = useAuth();
  
  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return null;
  }
  
  // Redirect based on authentication state
  return isSignedIn ? <Redirect href="/(root)/(tabs)/home" /> : <Redirect href="/(auth)/welcome" />;
};

export default Home;
