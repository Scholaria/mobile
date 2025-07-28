import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View, 
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native';
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { fetchAPI } from '@/lib/fetch';
import PaperCard from "@/components/PaperCard";
import { icons } from "@/constants";
import Icon from 'react-native-vector-icons/FontAwesome';

const LikedPapers = () => {
  const { user } = useUser();
  const [likedPapers, setLikedPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const fetchUserData = async (skipCache = false) => {
    try {
      const result = await fetchAPI(`/user/${user?.id}`, { skipCache });
      if (result && result.data) {
        setUserData(result.data);
        setLikedPapers(result.data.likes || []);
      } else {
        console.error("Error fetching user data:", result?.error || "No data returned");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
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

  const renderPaperCard = ({ item }: { item: any }) => {
    return (
      <PaperCard
        paper={item}
        showSummary={true}
        showKeywords={true}
        showOrganizations={true}
        userData={userData}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-800">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-800">
      {/* Header */}
      <View className="px-4 pt-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="justify-center items-center w-10 h-10 rounded-full bg-primary-700"
        >
          <Icon name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-JakartaBold text-white">Liked Papers</Text>
        <View className="w-10" />
      </View>

      {/* Content */}
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
        <View className="px-4 pb-6">
          {likedPapers.length > 0 ? (
            likedPapers.map((paper, index) => (
              <View key={paper.paper_id || index} className="mb-4">
                {renderPaperCard({ item: paper })}
              </View>
            ))
          ) : (
            <View className="flex-1 justify-center items-center py-20">
              <Icon name="heart-o" size={64} color="#6B7280" />
              <Text className="text-xl font-JakartaBold text-gray-400 mt-4 mb-2">
                No Liked Papers Yet
              </Text>
              <Text className="text-gray-500 text-center px-8">
                Papers you like will appear here. Start exploring to discover great research!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LikedPapers; 