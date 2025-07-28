import PaperCard from "@/components/PaperCard";
import SwipeablePaperCard from "@/components/SwipeablePaperCard";
import { fetchAPI } from '@/lib/fetch';
import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ResumeReadingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUser();
  const [savedPapers, setSavedPapers] = useState<any[]>([]);
  const [currentlyReading, setCurrentlyReading] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const fetchUserData = async (skipCache = false) => {
    try {
      const result = await fetchAPI(`/user/${user?.id}`, { skipCache });
      // console.log("[DEBUG] result", result.data);
      if (result && result.data) {
        setUserData(result.data);
        setSavedPapers(result.data.saves || []);
        // Process reading progress data - filter out fully read papers
        const readingProgress = result.data.reading_progress || [];
        const papersWithProgress = readingProgress
          .filter((paper: any) => {
            // Only include papers that are not fully read
            // A paper is fully read if current_page equals final_page
            return !paper.final_page || paper.current_page < paper.final_page;
          })
          .map((paper: any) => ({
            ...paper,
            current_page: paper.current_page || 1
          }));
        setCurrentlyReading(papersWithProgress);
      } else {
        console.error("Error fetching user data:", result?.error || "No data returned");
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

  const handleRemoveReadingProgress = async (paperId: string) => {
    if (!user?.id) return;
    
    try {
      // Configure layout animation for smooth slide-up
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      await fetchAPI(`/user/${user.id}/reading-progress`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId }),
      });
      
      // Remove from local state
      setCurrentlyReading(prev => prev.filter(paper => paper.paper_id !== paperId));
      
      // Update userData if available
      if (userData) {
        userData.reading_progress = userData.reading_progress.filter(
          (paper: any) => paper.paper_id !== paperId
        );
      }
    } catch (error) {
      console.error('Error removing reading progress:', error);
    }
  };

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
        
        // Process reading progress data - filter out fully read papers
        const readingProgress = parsedUserData.reading_progress || [];
        const papersWithProgress = readingProgress
          .filter((paper: any) => {
            // Only include papers that are not fully read
            // A paper is fully read if current_page equals final_page
            return !paper.final_page || paper.current_page < paper.final_page;
          })
          .map((paper: any) => ({
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

  const renderSwipeablePaperCard = (paper: any) => {
    return (
      <SwipeablePaperCard
        paper={paper}
        onRemove={() => handleRemoveReadingProgress(paper.paper_id)}
        showSummary={false}
        showKeywords={false}
        showOrganizations={false}
        showReadingProgress={true}
        userData={userData}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-800">
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2"
        >
          <Icon name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-JakartaBold flex-1 text-center">Reading</Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
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
          <View className="px-4 py-2">
            <Text className="text-white text-lg font-JakartaBold mb-2">Currently Reading</Text>
            <Text className="text-gray-300 text-sm font-JakartaMedium mb-4">Swipe left to remove papers from your reading list</Text>
            {currentlyReading.length > 0 ? (
              currentlyReading.map((paper) => (
                <View key={paper.paper_id}>
                  {renderSwipeablePaperCard(paper)}
                </View>
              ))
            ) : (
              <Text className="text-gray-300 text-center">No papers currently being read</Text>
            )}
          </View>

          <View className="px-4 py-2">
            <Text className="text-white text-lg font-JakartaBold mb-4">Saved Papers</Text>
            {savedPapers.length > 0 ? (
              savedPapers.map((paper) => (
                <View key={paper.paper_id}>
                  {renderPaperCard(paper)}
                </View>
              ))
            ) : (
              <Text className="text-gray-300 text-center">No saved papers</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ResumeReadingScreen; 