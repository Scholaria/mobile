import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { fetchAPI } from '@/lib/fetch';
import PaperCard from "@/components/PaperCard";
import { useUser } from "@clerk/clerk-expo";

const ResumeReadingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUser();
  const [savedPapers, setSavedPapers] = useState<any[]>([]);
  const [currentlyReading, setCurrentlyReading] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX < -100) { // Swipe left threshold
        router.back();
      }
    });

  const fetchUserData = async (skipCache = false) => {
    try {
      const result = await fetchAPI(`/user/${user?.id}`, { skipCache });
      if (result) {
        setUserData(result);
        setSavedPapers(result.saves || []);
        // Process reading progress data
        const readingProgress = result.reading_progress || [];
        const papersWithProgress = readingProgress.map((paper: any) => ({
          ...paper,
          current_page: paper.current_page || 1
        }));
        setCurrentlyReading(papersWithProgress);
      } else {
        console.error("Error fetching user data:", result.error);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
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
    } else if (params.userData) {
      try {
        const parsedUserData = JSON.parse(params.userData as string);
        if (!parsedUserData) {
          console.error("User data is null after parsing");
          setLoading(false);
          return;
        }
        setUserData(parsedUserData);
        setSavedPapers(parsedUserData.saves || []);
        
        // Process reading progress data
        const readingProgress = parsedUserData.reading_progress || [];
        const papersWithProgress = readingProgress.map((paper: any) => ({
          ...paper,
          current_page: paper.current_page || 1
        }));
        setCurrentlyReading(papersWithProgress);
        
      } catch (error) {
        console.error("Error parsing user data:", error);
        setSavedPapers([]);
        setCurrentlyReading([]);
      } finally {
        setLoading(false);
      }
    } else {
      console.error("No user data available");
      setSavedPapers([]);
      setCurrentlyReading([]);
      setLoading(false);
    }
  }, [user?.id, params.userData]);

  const renderPaperCard = (paper: any) => {
    return (
      <PaperCard
        paper={paper}
        showSummary={false}
        showKeywords={false}
        showOrganizations={false}
        showReadingProgress={true}
        userData={userData}
      />
    );
  };

  return (
    <GestureDetector gesture={swipeGesture}>
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="flex-row items-center justify-between px-4 py-2">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2"
          >
            <Icon name="arrow-left" size={20} color="black" />
          </TouchableOpacity>
          <Text className="text-black text-xl font-JakartaBold flex-1 text-center">Reading</Text>
          <View className="w-10" />
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
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
            <View className="px-4 py-2">
              <Text className="text-black text-lg font-JakartaBold mb-4">Currently Reading</Text>
              {currentlyReading.length > 0 ? (
                currentlyReading.map((paper) => (
                  <View key={paper.paper_id}>
                    {renderPaperCard(paper)}
                  </View>
                ))
              ) : (
                <Text className="text-gray-400 text-center">No papers currently being read</Text>
              )}
            </View>

            <View className="px-4 py-2">
              <Text className="text-black text-lg font-JakartaBold mb-4">Saved Papers</Text>
              {savedPapers.length > 0 ? (
                savedPapers.map((paper) => (
                  <View key={paper.paper_id}>
                    {renderPaperCard(paper)}
                  </View>
                ))
              ) : (
                <Text className="text-gray-400 text-center">No saved papers</Text>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </GestureDetector>
  );
};

export default ResumeReadingScreen; 