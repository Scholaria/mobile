import * as React from "react";
import { Image, Text, View } from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import CustomButton from "./CustomButton";
import { showErrorNotification } from "./ErrorNotification";
import { fetchAPI } from "@/lib/fetch";

const OAuth = () => {
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            
            // console.log("Starting OAuth flow...");
            const result = await startOAuthFlow();
            
            if (!result) {
                throw new Error("OAuth flow failed to start");
            }

            // console.log("OAuth result:", result);
            const { createdSessionId, setActive, signIn, signUp } = result;

            // Check if we have a complete session
            if (createdSessionId && setActive) {
                // User signed in successfully
                // console.log("Setting active session...");
                await setActive({ session: createdSessionId });
                
                // Check if this is a new user (sign up) or existing user (sign in)
                if (signUp && signUp.createdUserId && signUp.emailAddress) {
                    // This is a new user with complete data, create them in our backend
                    // console.log("New user signup detected with complete data");
                    try {
                        // Generate username from email if not provided
                        const username = signUp.username || 
                                       signUp.emailAddress?.split('@')[0] || 
                                       `user_${Date.now()}`;

                        // console.log("Creating user in backend with data:", {
                        //     clerk_id: signUp.createdUserId,
                        //     email: signUp.emailAddress,
                        //     username: username,
                        // });

                        const userResponse = await fetchAPI("/user", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                clerk_id: signUp.createdUserId,
                                email: signUp.emailAddress,
                                username: username,
                            }),
                        });
                        
                        // console.log("✅ Backend user creation successful:", userResponse?.data || userResponse);
                        
                        // Navigate to setup to collect name and other profile info
                        router.push('/(auth)/setup');
                    } catch (error: any) {
                        console.error("❌ Error creating user in backend:", error);
                        console.error("❌ Error details:", {
                            status: error?.status,
                            message: error?.message,
                            response: error?.response
                        });
                        
                        // If user already exists, just navigate to setup
                        if (error?.status === 409) {
                            // console.log("✅ User already exists, navigating to setup");
                            router.push('/(auth)/setup');
                        } else {
                            // For other errors, show error and don't proceed
                            console.error("❌ Backend user creation failed:", error);
                            showErrorNotification("Failed to create user account. Please try again.", "Backend Error");
                        }
                    }
                } else if (signIn) {
                    // This is an existing user, navigate to main app
                    // console.log("OAuth SignIn - existing user");
                    router.replace('/');
                } else {
                    // Fallback - just navigate to main app
                    // console.log("OAuth - no signUp or signIn, navigating to main app");
                    router.replace('/');
                }
            } else {
                // OAuth flow is incomplete (missing username, etc.)
                // console.log("OAuth flow incomplete, checking for signUp data...");
                // console.log("createdSessionId:", createdSessionId);
                // console.log("setActive available:", !!setActive);
                
                if (signUp) {
                    // console.log("Incomplete signUp detected:", {
                    //     createdUserId: signUp.createdUserId,
                    //     emailAddress: signUp.emailAddress,
                    //     username: signUp.username,
                    //     status: signUp.status,
                    //     missingFields: signUp.missingFields
                    // });
                    
                    // If we have email but missing username, complete the OAuth flow first
                    if (signUp.emailAddress && signUp.missingFields?.includes('username')) {
                        // console.log("Have email but missing username, completing OAuth flow...");
                        
                        try {
                            // Generate a username from the email
                            const generatedUsername = signUp.emailAddress.split('@')[0] + '_' + Date.now();
                            
                            // console.log("Completing OAuth flow with generated username:", generatedUsername);
                            
                            // Complete the OAuth flow by providing the missing username
                            const completedSignUp = await signUp.update({
                                username: generatedUsername,
                            });
                            
                            // console.log("OAuth flow completed:", completedSignUp);
                            
                            // Now we should have a complete session
                            if (completedSignUp.createdSessionId && setActive) {
                                // console.log("Setting active session after completion...");
                                await setActive({ session: completedSignUp.createdSessionId });
                                
                                // Create user in backend
                                if (completedSignUp.createdUserId) {
                                    try {
                                        // console.log("Creating user in backend with completed OAuth data:", {
                                        //     clerk_id: completedSignUp.createdUserId,
                                        //     email: signUp.emailAddress,
                                        //     username: generatedUsername,
                                        // });

                                        const userResponse = await fetchAPI("/user", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                clerk_id: completedSignUp.createdUserId,
                                                email: signUp.emailAddress,
                                                username: generatedUsername,
                                            }),
                                        });
                                        
                                        // console.log("✅ Backend user creation successful:", userResponse?.data || userResponse);
                                        
                                        // Navigate to setup only after successful backend creation
                                        router.push('/(auth)/setup');
                                    } catch (error: any) {
                                        console.error("❌ Error creating user in backend:", error);
                                        console.error("❌ Error details:", {
                                            status: error?.status,
                                            message: error?.message,
                                            response: error?.response
                                        });
                                        
                                        // If user already exists (409), that's fine, proceed to setup
                                        if (error?.status === 409) {
                                            // console.log("✅ User already exists in backend, proceeding to setup");
                                            router.push('/(auth)/setup');
                                        } else {
                                            // For other errors, show error and don't proceed
                                            console.error("❌ Backend user creation failed:", error);
                                            showErrorNotification("Failed to create user account. Please try again.", "Backend Error");
                                        }
                                    }
                                } else {
                                    // console.log("No createdUserId available after OAuth completion");
                                    showErrorNotification("OAuth completion failed. Please try again.", "OAuth Error");
                                }
                            } else {
                                // console.log("Still no complete session after OAuth completion");
                                showErrorNotification("OAuth completion failed. Please try again.", "OAuth Error");
                            }
                        } catch (completionError: any) {
                            console.error("Error completing OAuth flow:", completionError);
                            showErrorNotification("Failed to complete OAuth sign-up. Please try again.", "OAuth Completion Error");
                        }
                    } else {
                        // console.log("Missing required OAuth data, showing error");
                        showErrorNotification("OAuth sign-in incomplete. Please try again or use email sign-up.", "OAuth Error");
                    }
                } else if (signIn) {
                    // console.log("Incomplete signIn detected:", {
                    //     status: signIn.status,
                    //     identifier: signIn.identifier
                    // });
                    
                    // For incomplete sign-in, try to redirect to main app
                    // console.log("Attempting to redirect to main app for incomplete sign-in");
                    router.replace('/');
                } else {
                    // console.log("No signUp or signIn data available, showing error");
                    showErrorNotification("OAuth sign-in failed. Please try again.", "OAuth Error");
                }
            }
        } catch (err: any) {
            console.error("OAuth error:", err);
            
            // Handle specific OAuth errors
            if (err?.errors?.[0]?.code === 'oauth_callback_error') {
                showErrorNotification("Google sign-in was cancelled or failed. Please try again.", "Sign In Cancelled");
            } else if (err?.errors?.[0]?.code === 'oauth_account_already_exists') {
                showErrorNotification("An account with this Google email already exists. Please sign in with your password.", "Account Exists");
            } else {
                showErrorNotification("Google sign-in failed. Please try again.", "Sign In Error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center items-center">
            <CustomButton
                title={isLoading ? "Signing in..." : "Continue with Google"}
                IconLeft={() => (
                    <Image
                        source={require("@/assets/icons/google.png")}
                        resizeMode="contain"
                        className="w-5 h-5 mx-2"
                    />
                )}
                bgVariant="outline"
                textVariant="primary"
                onPress={handleGoogleSignIn}
                disabled={isLoading}
            />
        </View>
    );
};

export default OAuth;