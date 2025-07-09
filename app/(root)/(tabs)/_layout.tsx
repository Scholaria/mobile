import { icons } from "@/constants";
import { Tabs } from "expo-router";
import * as React from "react";
import { Image, ImageSourcePropType, View, Platform } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';

const TabIcon = ({ focused, source }: { focused: boolean, source: ImageSourcePropType }) => (
    <View className={`flex flex-row items-center justify-center rounded-full transition-all duration-200 ${focused ? "bg-primary-500 shadow-lg" : ""}`}>
        <View className={`rounded-full w-14 h-14 items-center justify-center transition-all duration-200 ${focused ? "bg-general-400 scale-110" : "bg-transparent"}`}>
            <Image 
                source={source} 
                className="w-8 h-8" 
                tintColor="white" 
                resizeMode="contain"
                style={{
                    transform: [{ scale: focused ? 1.1 : 1 }],
                }}
            />
        </View>
    </View>
)

const VectorTabIcon = ({ focused, iconName }: { focused: boolean, iconName: string }) => (
    <View className={`flex flex-row items-center justify-center rounded-full transition-all duration-200 ${focused ? "bg-primary-500 shadow-lg" : ""}`}>
        <View className={`rounded-full w-14 h-14 items-center justify-center transition-all duration-200 ${focused ? "bg-general-400 scale-110" : "bg-transparent"}`}>
            <Icon 
                name={iconName} 
                size={32} 
                color="white"
                style={{
                    transform: [{ scale: focused ? 1.1 : 1 }],
                }}
            />
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
                overflow: "hidden",
                marginHorizontal: 20,
                marginBottom: 20,
                height: 78,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexDirection: "row",
                position: "absolute",
                ...Platform.select({
                    ios: {
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: 4,
                        },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    },
                    android: {
                        elevation: 8,
                    },
                }),
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
        name="orgs" 
        options={{ 
            title: "Organizations",
            headerShown: false,
            tabBarIcon: ( {focused} ) => <VectorTabIcon focused={focused} iconName="building"/>,
        }} />
        <Tabs.Screen 
        name="following" 
        options={{ 
            title: "Following",
            headerShown: false,
            tabBarIcon: ( {focused} ) => <VectorTabIcon focused={focused} iconName="heart"/>,
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