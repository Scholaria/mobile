import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/Oauth";
import { icons, images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import { useState } from "react";
import { Alert, Image, ScrollView, Text, View, TouchableOpacity } from "react-native";
import ReactNativeModal from "react-native-modal";
import { showErrorNotification } from "@/components/ErrorNotification";

const SignUp = () => {
  const [user, setUser] = useState(
    {
      name: '',
      email: '',
      password: '',
    }
  )
  const [showPassword, setShowPassword] = useState(false);
  const [verification, setVerification] = useState(
    {
      state: "default",
      error: "",
      code: "",
    }
  )
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  // Handle cancellation of verification
  const onCancelVerification = () => {
    setVerification({
      state: "default",
      error: "",
      code: "",
    });
  }

  // Handle resending verification code
  const onResendCode = async () => {
    if (!isLoaded) return;

    try {
      // Reset the sign-up attempt and create a new one
      await signUp.create({
        emailAddress: user.email,
        password: user.password,
      });

      // Send a new verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      Alert.alert(
        "Code Resent",
        "A new verification code has been sent to your email.",
        [{ text: "OK" }]
      );

      // Clear any previous error
      setVerification({
        ...verification,
        error: "",
      });

    } catch (err: any) {
      console.error("Resend code error:", err);
      showErrorNotification("Failed to resend verification code. Please try signing up again.", "Resend Error");
      // Reset everything and go back to sign-up form
      setVerification({
        state: "default",
        error: "",
        code: "",
      });
    }
  }

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    // Validate required fields
    if (!user.email || !user.password || !user.name) {
      showErrorNotification("Please fill in all required fields", "Missing Information");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      showErrorNotification("Please enter a valid email address", "Invalid Email");
      return;
    }

    // Validate password length
    if (user.password.length < 8) {
      showErrorNotification("Password must be at least 8 characters long", "Password Too Short");
      return;
    }

    // Start sign-up process using email and password provided
    try {
      const signUpResult = await signUp.create({
        emailAddress: user.email,
        password: user.password,
      });

      if (!signUpResult) {
        throw new Error("Failed to create sign up");
      }

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Set 'pendingVerification' to true to display second form
      setVerification({
        ...verification,
        state: "pending"
      });  

    } catch (err: any) {
      console.error("Sign up error:", err);
      showErrorNotification(err, "Sign Up Error");
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      })

      // If verification was completed, set the session to active
      // and redirect the user 
      if (signUpAttempt.status === 'complete') {
        try {
          // console.log("✅ Verification completed successfully");
          // console.log("📝 Creating user in backend with data:", {
          //   clerk_id: signUpAttempt.createdUserId,
          //   email: emailAddress,
          //   name: fullName,
          //   interests: selectedInterests,
          // });
          
          // Create user in our backend
          const userResponse = await fetchAPI("/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clerk_id: signUpAttempt.createdUserId,
              email: user.email,
              name: user.name,
            }),
          });

          // console.log("✅ Backend user creation successful:", userResponse);

          // console.log("🔐 Setting active session...");
          await setActive({ session: signUpAttempt.createdSessionId });
          // console.log("✅ Session set active successfully");

          // console.log("🎉 Sign up process completed, navigating to setup...");
          setVerification({
            ...verification,
            state: "success",
          });
          
          // Navigate immediately after successful completion
          router.push('/(auth)/setup');
          
        } catch (error) {
          console.error("Error creating user in backend:", error);
          showErrorNotification("Failed to create user account. Please try again.", "Backend Error");
        }
      } else {
        // console.log("❌ Verification failed, status:", signUpAttempt.status);
        setVerification({
          ...verification,
          state: "error",
          error: "Verification failed",
        })
      }
    } catch (err: any) {
      console.error('Verification Error:', err);
      
      // Check if it's the "No sign up attempt was found" error
      const errorMessage = err.errors?.[0]?.longMessage || err.message || '';
      const isExpiredAttempt = errorMessage.includes('No sign up attempt was found') || 
                              errorMessage.includes('unable to complete a GET request');
      
      if (isExpiredAttempt) {
        showErrorNotification("Your verification code has expired. Please try signing up again.", "Verification Expired");
        // Reset the verification state and allow user to try again
        setVerification({
          state: "default",
          error: "",
          code: "",
        });
      } else {
        setVerification({
          ...verification,
          state: "error",
          error: errorMessage || "Verification failed. Please try again.",
        });
      }
    }
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image
            source={images.login_bg}
            className="z-0 w-full h-[250px]"
          />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Create Your Account
          </Text>
        </View>

        <View className="p-5">
          <InputField 
            label="Name"
            placeholder="Enter your name"
            placeholderTextColor="gray"
            icon={icons.person}
            value={user.name}
            onChangeText={(name) => setUser({ ...user, name: name })}
            className="text-black"
          />
          <InputField 
            label="Email"
            placeholder="Enter your email"
            placeholderTextColor="gray"
            icon={icons.email}
            value={user.email}
            onChangeText={(email) => setUser({ ...user, email: email })}
            className="text-black"
          />
          <InputField 
            label="Password"
            placeholder="Enter your password"
            placeholderTextColor="gray"
            icon={icons.lock}
            secureTextEntry={!showPassword}
            value={user.password}
            onChangeText={(password) => setUser({ ...user, password: password })}
            className="text-black"
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text className="text-primary-500 font-JakartaSemiBold">
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            }
          />
          <CustomButton
              title="Sign Up"
              onPress={onSignUpPress}
              className="mt-6"
            />

            <OAuth />

            <Link href="/sign-in" className="text-lg text-center text-general-200 mt-10">
              <Text>
                Already have an account?
                <Text className="text-primary-500"> Log In</Text>
              </Text>
            </Link>

            <ReactNativeModal 
            isVisible={verification.state === "pending"}
            onBackdropPress={onCancelVerification}
            onBackButtonPress={onCancelVerification}
            >
              <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-2xl font-JakartaExtraBold">
                    Verification
                  </Text>
                  <TouchableOpacity 
                    onPress={onCancelVerification}
                    className="w-8 h-8 items-center justify-center"
                  >
                    <Text className="text-2xl text-gray-500">×</Text>
                  </TouchableOpacity>
                </View>

                <Text className="font-Jakarta mb-5">
                  We have sent a verification code to {user.email}.
                </Text>

                <InputField
                  label="Code"
                  placeholder="1234"
                  icon={icons.lock}
                  value={verification.code}
                  keyboardType="numeric"
                  onChangeText={(code) => setVerification({ ...verification, code: code })}
                />

                {verification.error && (
                  <Text className="text-red-500 text-sm mt-2">
                    {verification.error}
                  </Text>
                )}

                <CustomButton title="Verify Email" onPress={onVerifyPress} className="mt-5 bg-success-500"/>
                
                <TouchableOpacity 
                  onPress={onResendCode}
                  className="mt-4 items-center"
                >
                  <Text className="text-primary-500 font-JakartaSemiBold">
                    Didn't receive the code? Resend
                  </Text>
                </TouchableOpacity>
              </View>
            </ReactNativeModal>

        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;
