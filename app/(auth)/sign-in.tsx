import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/Oauth";
import { icons, images } from "@/constants";
import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";



const SignIn = () => {
  const [user, setUser] = useState(
    {
      email: '',
      password: '',
    }
  )
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: user.email,
        password: user.password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
        // router.push('/(root)/(tabs)/home')
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
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
            secureTextEntry={true}
            value={user.password}
            onChangeText={(password) => setUser({ ...user, password: password })}
            className="text-black"
          />
          <CustomButton
              title="Sign In"
              onPress={onSignInPress}
              className="mt-6"
            />

            <OAuth />

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
