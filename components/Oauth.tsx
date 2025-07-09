import React from "react";
import { Image, Text, View } from "react-native";
import CustomButton from "./CustomButton";

const OAuth = () => {
    const handleGoogleSignIn = async () => {
        // console.log("Google Sign In");
    }

    return (
        <View className="flex-1 justify-center items-center">
            <CustomButton
                title="Continue with Google"
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
            />
        </View>
    );
};

export default OAuth;