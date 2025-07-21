import PaperDetailModal from "@/components/PaperDetailModal";
import { icons } from "@/constants";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { fetchAPI } from '@/lib/fetch';
import PaperCard from "@/components/PaperCard";
import { SafeImagePicker } from "@/components/SafeImagePicker";

const Profile = () => {
  const { user } = useUser();
  const [userData, setUserData] = useState<any>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [likedPapers, setLikedPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async (skipCache = false) => {
    try {
      const result = await fetchAPI(`/user/${user?.id}`, { skipCache });
      if (result && result.data) {
        setUserData(result.data);
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
      
      // Use SafeImagePicker for better error handling and iPad compatibility
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
  
      // Upload to Clerk with better error handling
      await user?.setProfileImage({ file: `data:image/jpeg;base64,${result.data.base64}` });
      await user?.reload(); // refresh Clerk session data
      await fetchUserData(true); // re-fetch backend userData
  
    } catch (err) {
      console.error("Image upload error:", err);
      Alert.alert("Upload Error", "There was an error uploading your image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const fetchUserPapers = async (skipCache = false) => {
    if (!user?.id || !userData) return;
    setLoadingPapers(true);
    try {
      // Use likes directly from userData
      const likedPapersWithDetails = userData.likes.map((paper: any) => ({
        ...paper
      }));
      setLikedPapers(likedPapersWithDetails);
    } catch (error) {
      console.error("Error processing user papers:", error);
    } finally {
      setLoadingPapers(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchUserData(true);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && userData) {
      fetchUserPapers();
    }
  }, [user?.id, userData]);

  const renderPaperCard = ({ item }: { item: any }) => {
    return (
      <PaperCard
        paper={item}
        showSummary={false}
        showKeywords={false}
        showOrganizations={false}
        userData={userData}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
          />
        }
      >
        {/* Header */}
        <View className="px-4 pt-6 pb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-JakartaBold">Profile</Text>
          <TouchableOpacity
            onPress={() => router.push("/(root)/settings")}
            className="justify-center items-center w-10 h-10 rounded-full bg-white"
          >
            <Image source={icons.person} className="w-5 h-5" tintColor="black" />
          </TouchableOpacity>
        </View>

        {/* Profile Content */}
        <View className="px-4">
          {/* Profile data */}
          <View className="items-center mb-6">
            <TouchableOpacity 
              onPress={pickImageAndUpload}
              className="w-24 h-24 rounded-full bg-gray-200 mb-3 items-center justify-center"
            >
              {uploading ? (
                <ActivityIndicator size="large" color="#0000ff" />
                ) : user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="w-24 h-24 rounded-full"
                  />
              ) : (
                <Text className="text-4xl text-gray-500">
                  {userData?.name?.[0] || user?.firstName?.[0] || "?"}
                </Text>
              )}
            </TouchableOpacity>
            
            <Text className="text-xl font-JakartaBold text-gray-900">
              {userData?.name || user?.fullName || "User"}
            </Text>
            
            <Text className="text-gray-500">
              {user?.primaryEmailAddress?.emailAddress?.endsWith('appleid.com') 
                ? "No email" 
                : user?.primaryEmailAddress?.emailAddress}
            </Text>
            <Text className="text-blue-500 text-lg font-bold">{userData?.role}</Text>
          </View>

          {/* User Information Cards */}
          <View className="space-y-4">
            {/* Research Interests */}
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <Text className="text-lg font-JakartaBold text-gray-900 mb-2">Research Interests</Text>
              <View className="flex-row flex-wrap">
                {userData?.interests?.map((interest: string, index: number) => (
                  <View key={index} className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2">
                    <Text className="text-sm text-blue-800">{interest}</Text>
                  </View>
                )) || (
                  <Text className="text-gray-500">No research interests specified</Text>
                )}
              </View>
            </View>

            {/* Liked Papers */}
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <Text className="text-lg font-JakartaBold text-gray-900 mb-4">Liked Papers</Text>
              
              {/* Papers List */}
              {loadingPapers ? (
                <View className="py-4">
                  <ActivityIndicator size="large" color="#0000ff" />
                </View>
              ) : (
                <View>
                  {likedPapers.length > 0 ? (
                    likedPapers.map((paper, index) => (
                      <View key={paper.paper_id || index}>
                        {renderPaperCard({ item: paper })}
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-500 text-center py-4">No liked papers yet</Text>
                  )}
                </View>
              )}
            </View>
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
