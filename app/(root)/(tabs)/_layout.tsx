import { icons } from "@/constants";
import { Tabs } from "expo-router";
import * as React from "react";
import { Image, ImageSourcePropType, View } from "react-native";

const TabIcon = ({ focused, source }: { focused: boolean, source: ImageSourcePropType }) => (
    <View className={`flex flex-row items-center justify-center rounded-full ${focused ? "bg-primary-500" : ""}`}>
        <View className={`rounded-full w-14 h-14 items-center justify-center ${focused ? "bg-general-400" : ""}`}>
            <Image source={source} className="w-8 h-8" tintColor="white" resizeMode="contain"/>
        </View>
    </View>
)

const Layout = () => (
    <Tabs
        initialRouteName="home"
        screenOptions={{
            tabBarActiveTintColor: "white",
            tabBarInactiveTintColor: "white",
            tabBarShowLabel: false,
            tabBarStyle: {
                backgroundColor: "#333333",
                borderRadius: 50,
                padding: 0,
                margin: 0,
                // paddingBottom: 0,
                // paddingTop: 10,
                overflow: "hidden",
                marginHorizontal: 20,
                marginBottom: 20,
                height: 78,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexDirection: "row",
                position: "absolute",
            }
        }}
    >
        <Tabs.Screen 
        name="home" 
        options={{ 
            title: "Home",
            headerShown: false,
            tabBarIcon: ( {focused} ) => <TabIcon focused={focused} source={icons.home}/>,
        }} />
        <Tabs.Screen 
        name="trends" 
        options={{ 
            title: "Trends",
            headerShown: false,
            tabBarIcon: ( {focused} ) => <TabIcon focused={focused} source={icons.list}/>,
        }} />
        <Tabs.Screen 
        name="following" 
        options={{ 
            title: "Following",
            headerShown: false,
            tabBarIcon: ( {focused} ) => <TabIcon focused={focused} source={icons.person}/>,
        }} />
        <Tabs.Screen 
        name="profile" 
        options={{ 
            title: "Profile",
            headerShown: false,
            tabBarIcon: ( {focused} ) => <TabIcon focused={focused} source={icons.profile}/>,
        }} /> 
    </Tabs>
)

export default Layout