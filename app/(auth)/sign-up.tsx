import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/Oauth";
import { icons, images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, ScrollView, Text, View, TouchableOpacity } from "react-native";
import ReactNativeModal from "react-native-modal";



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

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    // Validate required fields
    if (!user.email || !user.password || !user.name) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // Validate password length
    if (user.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
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
      Alert.alert(
        "Error", 
        err.errors?.[0]?.longMessage || "An error occurred during sign up. Please try again."
      );
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
          console.log("body", {
            clerk_id: signUpAttempt.createdUserId,
            name: user.name,
            email: user.email,
          })
          // Create user in our backend
          await fetchAPI('/user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clerk_id: signUpAttempt.createdUserId,
              name: user.name,
              email: user.email,
            }),
          });

          await setActive({ session: signUpAttempt.createdSessionId });
          setVerification({
            ...verification,
            state: "success",
          });
        } catch (apiError) {
          console.error('Backend API Error:', apiError);
          Alert.alert(
            "Error",
            "Failed to create user profile. Please try again later."
          );
          return;
        }
      } else {
        setVerification({
          ...verification,
          state: "error",
          error: "Verification failed",
        })
      }
    } catch (err: any) {
      console.error('Verification Error:', err);
      setVerification({
        ...verification,
        state: "error",
        error: err.errors?.[0]?.longMessage || "Verification failed. Please try again.",
      })
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
            onModalHide={() => 
              {
                router.push('/(auth)/setup')
              }
            }
            >
              <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
                <Text className="text-2xl font-JakartaExtraBold mb-2">
                  Verification
                </Text>

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
                
              </View>
            </ReactNativeModal>

        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;
