import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/Oauth";
import { icons, images } from "@/constants";
import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { showErrorNotification } from "@/components/ErrorNotification";

const SignIn = () => {
  const [user, setUser] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const onSignInPress = async () => {
    if (!isLoaded || isLoading) return;

    // Validate required fields
    if (!user.email || !user.password) {
      showErrorNotification("Please fill in all required fields", "Missing Information");
      return;
    }

    setIsLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: user.email,
        password: user.password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        showErrorNotification("Sign in process was not completed. Please try again.", "Sign In Error");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      
      // Handle specific password incorrect error
      if (err?.status === 422 && err?.clerkError && err?.errors?.length > 0) {
        const clerkError = err.errors[0];
        if (clerkError.code === 'form_password_incorrect') {
          showErrorNotification("The password you entered is incorrect. Please try again.", "Incorrect Password");
        } else {
          showErrorNotification(err, "Sign In Error");
        }
      } else {
        showErrorNotification(err, "Sign In Error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image
            source={images.login_bg}
            className="z-0 w-full h-[250px]"
          />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Welcome
          </Text>
        </View>

        <View className="p-5">
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
            title={isLoading ? "Signing In..." : "Sign In"}
            onPress={onSignInPress}
            className="mt-6"
            disabled={isLoading}
          />
          {/* <OAuth /> */}

          <Link href="/sign-up" className="text-lg text-center text-general-200 mt-10">
            <Text>
              Don't have an account?
              <Text className="text-primary-500"> Sign Up</Text>
            </Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignIn;
