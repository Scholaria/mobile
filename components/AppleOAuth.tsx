import * as React from "react";
import { Image, Text, View } from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import CustomButton from "./CustomButton";
import { showErrorNotification } from "./ErrorNotification";
import { fetchAPI } from "@/lib/fetch";

const AppleOAuth = () => {
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_apple" });
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleAppleSignIn = async () => {
        try {
            setIsLoading(true);
            
            // Check if Apple Authentication is available
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            if (!isAvailable) {
                showErrorNotification("Apple Sign In is not available on this device.", "Not Available");
                return;
            }

            // Start OAuth flow with Clerk
            const result = await startOAuthFlow();
            
            if (!result) {
                throw new Error("Apple OAuth flow failed to start");
            }

            const { createdSessionId, setActive, signIn, signUp } = result;

            // Check if we have a complete session
            if (createdSessionId && setActive) {
                // User signed in successfully
                await setActive({ session: createdSessionId });
                
                // Check if this is a new user (sign up) or existing user (sign in)
                if (signUp && signUp.createdUserId && signUp.emailAddress) {
                    // This is a new user with complete data, create them in our backend
                    try {
                        // Generate username from email if not provided
                        const username = signUp.username || 
                                       signUp.emailAddress?.split('@')[0] || 
                                       `apple_user_${Date.now()}`;

                        const userResponse = await fetchAPI("/user", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                clerk_id: signUp.createdUserId,
                                email: signUp.emailAddress,
                                username: username,
                            }),
                        });
                        
                        // Navigate to setup to collect additional profile info
                        router.push('/(auth)/setup');
                    } catch (error: any) {
                        console.error("Error creating user in backend:", error);
                        
                        // If user already exists, just navigate to setup
                        if (error?.status === 409) {
                            router.push('/(auth)/setup');
                        } else {
                            showErrorNotification("Failed to create user account. Please try again.", "Backend Error");
                        }
                    }
                } else if (signIn) {
                    // This is an existing user, navigate to main app
                    router.replace('/');
                } else {
                    // Fallback - just navigate to main app
                    router.replace('/');
                }
            } else {
                // OAuth flow is incomplete
                if (signUp) {
                    // Handle incomplete sign-up similar to Google OAuth
                    if (signUp.emailAddress && signUp.missingFields?.includes('username')) {
                        try {
                            // Generate a username from the email
                            const generatedUsername = signUp.emailAddress.split('@')[0] + '_' + Date.now();
                            
                            // Complete the OAuth flow by providing the missing username
                            const completedSignUp = await signUp.update({
                                username: generatedUsername,
                            });
                            
                            if (completedSignUp.createdSessionId && setActive) {
                                await setActive({ session: completedSignUp.createdSessionId });
                                
                                // Create user in backend
                                if (completedSignUp.createdUserId) {
                                    try {
                                        const userResponse = await fetchAPI("/user", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                clerk_id: completedSignUp.createdUserId,
                                                email: signUp.emailAddress,
                                                username: generatedUsername,
                                            }),
                                        });
                                        
                                        router.push('/(auth)/setup');
                                    } catch (error: any) {
                                        console.error("Error creating user in backend:", error);
                                        
                                        if (error?.status === 409) {
                                            router.push('/(auth)/setup');
                                        } else {
                                            showErrorNotification("Failed to create user account. Please try again.", "Backend Error");
                                        }
                                    }
                                }
                            }
                        } catch (completionError: any) {
                            console.error("Error completing Apple OAuth flow:", completionError);
                            showErrorNotification("Failed to complete Apple sign-up. Please try again.", "OAuth Completion Error");
                        }
                    } else {
                        showErrorNotification("Apple sign-in incomplete. Please try again or use email sign-up.", "OAuth Error");
                    }
                } else if (signIn) {
                    router.replace('/');
                } else {
                    showErrorNotification("Apple sign-in failed. Please try again.", "OAuth Error");
                }
            }
        } catch (err: any) {
            console.error("Apple OAuth error:", err);
            
            // Handle specific OAuth errors
            if (err?.errors?.[0]?.code === 'oauth_callback_error') {
                showErrorNotification("Apple sign-in was cancelled or failed. Please try again.", "Sign In Cancelled");
            } else if (err?.errors?.[0]?.code === 'oauth_account_already_exists') {
                showErrorNotification("An account with this Apple ID already exists. Please sign in with your password.", "Account Exists");
            } else {
                showErrorNotification("Apple sign-in failed. Please try again.", "Sign In Error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center items-center">
            <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={{ width: '100%', height: 50 }}
                onPress={handleAppleSignIn}
            />
        </View>
    );
};

export default AppleOAuth; 