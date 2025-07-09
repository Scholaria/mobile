import PaperDetailModal from "@/components/PaperDetailModal";
import { icons } from "@/constants";
import { useClerk, useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { fetchAPI } from '@/lib/fetch';
import PaperCard from "@/components/PaperCard";

type TabType = 'saved' | 'liked';

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [userData, setUserData] = useState<any>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('saved');
  const [savedPapers, setSavedPapers] = useState<any[]>([]);
  const [likedPapers, setLikedPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async (skipCache = false) => {
    try {
      const result = await fetchAPI(`/user/${user?.id}`, { skipCache });
      if (result) {
        setUserData(result);
      } else {
        console.error("Error fetching user data:", result.error);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const pickImageAndUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission required", "We need permission to access your photos.");
        return;
      }
  
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      if (pickerResult.canceled) return;
  
      setUploading(true);
  
      const base64 = pickerResult.assets[0].base64;
      if (!base64) throw new Error("Failed to get base64");
  
      await user?.setProfileImage({ file: `data:image/jpeg;base64,${base64}` });
      await user?.reload(); // refresh Clerk session data
      await fetchUserData(true); // re-fetch backend userData
  
    } catch (err) {
      console.error("Image upload error:", err);
      Alert.alert("Error", "There was an error uploading your image.");
    } finally {
      setUploading(false);
    }
  };

  const fetchUserPapers = async (skipCache = false) => {
    if (!user?.id || !userData) return;
    setLoadingPapers(true);
    try {
      // Use saves directly from userData
      const savedPapersWithDetails = userData.saves.map((paper: any) => ({
        ...paper
      }));
      setSavedPapers(savedPapersWithDetails);

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
            onPress={handleLogout}
            className="justify-center items-center w-10 h-10 rounded-full bg-white"
          >
            <Image source={icons.out} className="w-5 h-5" />
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
            <Text className="text-gray-500">{user?.primaryEmailAddress?.emailAddress}</Text>
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

            {/* Affiliations */}
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <Text className="text-lg font-JakartaBold text-gray-900 mb-2">Affiliations</Text>
              <View className="flex-row flex-wrap">
                {userData?.affiliations?.map((interest: string, index: number) => (
                  <View key={index} className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2">
                    <Text className="text-sm text-blue-800">{interest}</Text>
                  </View>
                )) || (
                  <Text className="text-gray-500">No affiliations specified</Text>
                )}
              </View>
            </View>

            {/* Saved and Liked Papers */}
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <Text className="text-lg font-JakartaBold text-gray-900 mb-4">My Papers</Text>
              
              {/* Tab Buttons */}
              <View className="flex-row mb-4">
                <TouchableOpacity
                  onPress={() => setActiveTab('saved')}
                  className={`flex-1 mr-2 py-2 rounded-full ${
                    activeTab === 'saved' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center ${
                      activeTab === 'saved' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    Saved
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab('liked')}
                  className={`flex-1 ml-2 py-2 rounded-full ${
                    activeTab === 'liked' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center ${
                      activeTab === 'liked' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    Liked
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Papers List */}
              {loadingPapers ? (
                <View className="py-4">
                  <ActivityIndicator size="large" color="#0000ff" />
                </View>
              ) : (
                <View>
                  {activeTab === 'saved' ? (
                    savedPapers.length > 0 ? (
                      savedPapers.map((paper, index) => (
                        <View key={paper.paper_id || index}>
                          {renderPaperCard({ item: paper })}
                        </View>
                      ))
                    ) : (
                      <Text className="text-gray-500 text-center py-4">No saved papers yet</Text>
                    )
                  ) : (
                    likedPapers.length > 0 ? (
                      likedPapers.map((paper, index) => (
                        <View key={paper.paper_id || index}>
                          {renderPaperCard({ item: paper })}
                        </View>
                      ))
                    ) : (
                      <Text className="text-gray-500 text-center py-4">No liked papers yet</Text>
                    )
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
