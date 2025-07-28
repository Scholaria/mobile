import { icons } from "@/constants";
import { Tabs } from "expo-router";
import * as React from "react";
import { Image, ImageSourcePropType, View, Platform } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';

const TabIcon = ({ focused, source }: { focused: boolean, source: ImageSourcePropType }) => (
    <View className={`items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${focused ? "bg-blue-500/20" : ""}`}>
        <Image 
            source={source} 
            className="w-8 h-8" 
            tintColor={focused ? "#3B82F6" : "#9CA3AF"} 
            resizeMode="contain"
            style={{
                transform: [{ scale: focused ? 1.1 : 1 }],
            }}
        />
    </View>
)

const VectorTabIcon = ({ focused, iconName }: { focused: boolean, iconName: string }) => (
    <View className={`items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${focused ? "bg-blue-500/20" : ""}`}>
        <Icon 
            name={iconName} 
            size={32} 
            color={focused ? "#3B82F6" : "#9CA3AF"}
            style={{
                transform: [{ scale: focused ? 1.1 : 1 }],
            }}
        />
    </View>
)

const Layout = () => (
    <Tabs
        initialRouteName="home"
        screenOptions={{
            tabBarActiveTintColor: "#3B82F6",
            tabBarInactiveTintColor: "#9CA3AF",
            tabBarShowLabel: false,
            tabBarStyle: {
                backgroundColor: "#1F2937",
                borderTopWidth: 0,
                paddingTop: 16,
                paddingBottom: Platform.OS === 'ios' ? 44 : 24,
                paddingHorizontal: 24,
                height: Platform.OS === 'ios' ? 108 : 90,
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                ...Platform.select({
                    ios: {
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: -2,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                    },
                    android: {
                        elevation: 4,
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