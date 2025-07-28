import PaperDetailModal from "@/components/PaperDetailModal";
import { icons } from "@/constants";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { fetchAPI } from '@/lib/fetch';
import { SafeImagePicker } from "@/components/SafeImagePicker";
import Icon from 'react-native-vector-icons/FontAwesome';

const Profile = () => {
  const { user } = useUser();
  const [userData, setUserData] = useState<any>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fetchUserData = async (skipCache = false) => {
    try {
      const result = await fetchAPI(`/user/${user?.id}`, { skipCache });
      if (result && result.data) {
        setUserData(result.data);
        // console.log(result.data);
      } else {
        console.error("Error fetching user data:", result?.error || "No data returned");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const pickImageAndUpload = async () => {
    try {
      setUploading(true);
      
      const result = await SafeImagePicker.pickImage({
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      
      if (!result.success) {
        Alert.alert("Upload Error", result.error || "Failed to pick image");
        return;
      }
      
      if (!result.data?.base64) {
        Alert.alert("Upload Error", "Failed to get image data");
        return;
      }
  
      await user?.setProfileImage({ file: `data:image/jpeg;base64,${result.data.base64}` });
      await user?.reload();
      await fetchUserData(true);
  
    } catch (err) {
      console.error("Image upload error:", err);
      Alert.alert("Upload Error", "There was an error uploading your image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchUserData(true);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const StatCard = ({ title, value, icon }: { title: string; value: number; icon: any }) => (
    <View className="bg-primary-700 rounded-2xl p-4 flex-1 mx-1">
      <View className="flex-row items-center mb-2">
        <Icon name={icon} size={20} color="#3B82F6" style={{ marginRight: 8 }} />
        <Text className="text-sm font-JakartaMedium text-gray-300">{title}</Text>
      </View>
      <Text className="text-2xl font-JakartaBold text-white">{value}</Text>
    </View>
  );

  const CategoryChip = ({ category }: { category: string }) => (
    <View className="bg-secondary-100 px-4 py-2 rounded-full mr-3 mb-2">
      <Text className="text-sm font-JakartaMedium text-secondary-800">{category}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-800">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Header */}
        <View className="px-4 pt-6 pb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-JakartaBold text-white">Profile</Text>
          <TouchableOpacity
            onPress={() => router.push("/(root)/settings")}
            className="justify-center items-center w-10 h-10 rounded-full bg-primary-700"
          >
            <Image source={icons.person} className="w-5 h-5" tintColor="white" />
          </TouchableOpacity>
        </View>

        {/* Profile Content */}
        <View className="px-4">
          {/* Profile Header */}
          <View className="items-center mb-8">
            <TouchableOpacity 
              onPress={pickImageAndUpload}
              className="w-24 h-24 rounded-full bg-primary-600 mb-4 items-center justify-center"
            >
              {uploading ? (
                <ActivityIndicator size="large" color="#3B82F6" />
              ) : user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <Text className="text-4xl text-gray-300">
                  {userData?.name?.[0] || user?.firstName?.[0] || "?"}
                </Text>
              )}
            </TouchableOpacity>
            
            <Text className="text-xl font-JakartaBold text-white mb-1">
              {userData?.name || user?.fullName || "User"}
            </Text>
            
            <Text className="text-gray-300 mb-2">
              {user?.primaryEmailAddress?.emailAddress?.endsWith('appleid.com') 
                ? "No email" 
                : user?.primaryEmailAddress?.emailAddress}
            </Text>
            
            {userData?.role && (
              <Text className="text-secondary-500 text-lg font-bold">{userData.role}</Text>
            )}
          </View>

          {/* Stats Section */}
          <View className="mb-6">
            <Text className="text-lg font-JakartaBold text-white mb-4">Your Stats</Text>
            <View className="flex-row">
              <StatCard 
                title="Likes" 
                value={userData?.likes?.length || 0} 
                icon="heart" 
              />
              <StatCard 
                title="Saves" 
                value={userData?.saves?.length || 0} 
                icon="bookmark" 
              />
              <StatCard 
                title="Reads" 
                value={userData?.reading_progress?.length || 0} 
                icon="book" 
              />
            </View>
          </View>

          {/* Research Interests */}
          <View className="bg-primary-700 rounded-2xl p-4 shadow-sm mb-6">
            <Text className="text-lg font-JakartaBold text-white mb-3">Research Interests</Text>
            <View className="flex-row flex-wrap">
              {userData?.interests?.map((interest: string, index: number) => (
                <CategoryChip key={index} category={interest} />
              )) || (
                <Text className="text-gray-400">No research interests specified</Text>
              )}
            </View>
          </View>

          {/* Followed Categories */}
          <View className="bg-primary-700 rounded-2xl p-4 shadow-sm mb-6">
            <Text className="text-lg font-JakartaBold text-white mb-3">Followed Categories</Text>
            <View className="flex-row flex-wrap">
              {userData?.followed_categories?.map((category: string, index: number) => (
                <CategoryChip key={index} category={category} />
              )) || (
                <Text className="text-gray-400">No categories followed yet</Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3 mb-6">
            <TouchableOpacity
              onPress={() => router.push("/(root)/liked-papers")}
              className="bg-secondary-500 rounded-2xl p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <Icon name="heart" size={20} color="white" style={{ marginRight: 12 }} />
                <Text className="text-white font-JakartaBold">View Liked Papers</Text>
              </View>
              <Icon name="chevron-right" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <PaperDetailModal
        paper={selectedPaper}
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedPaper(null);
        }}
      />
    </SafeAreaView>
  );
};

export default Profile;
