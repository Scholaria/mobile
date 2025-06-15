import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const ResumeReadingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [savedPapers, setSavedPapers] = useState<any[]>([]);
  const [currentlyReading, setCurrentlyReading] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX < -100) { // Swipe left threshold
        router.back();
      }
    });

  useEffect(() => {
    if (params.userData) {
      try {
        const userData = JSON.parse(params.userData as string);
        setSavedPapers(userData.saves || []);
        setCurrentlyReading(userData.saves || []);
      } catch (error) {
        console.error("Error parsing user data:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [params.userData]);

  const renderPaperCard = (paper: any) => {
    const publishedDate = paper.published
      ? new Date(paper.published).toLocaleDateString()
      : "Unknown date";

    const authors = Array.isArray(paper.authors)
      ? paper.authors.join(", ")
      : paper.authors;

    return (
      <TouchableOpacity
        key={paper.paper_id}
        className="bg-white rounded-2xl p-4 mb-4 shadow-md mx-4"
      >
        <Text className="text-lg font-JakartaBold text-gray-900 mb-1">
          {paper.title}
        </Text>
        <View className="flex-row items-center mb-2">
          <View className="bg-blue-200 px-2 py-1 rounded-full mr-2">
            <Text className="text-xs text-blue-800">{paper.category}</Text>
          </View>
          <Text className="text-xs text-gray-600">{publishedDate}</Text>
        </View>
        <Text className="text-sm text-gray-700 mb-2">
          {authors || "Unknown authors"}
        </Text>
      </TouchableOpacity>
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
          <ScrollView className="flex-1">
            <View className="px-4 py-2">
              <Text className="text-black text-lg font-JakartaBold mb-4">Currently Reading</Text>
              {currentlyReading.length > 0 ? (
                currentlyReading.map(renderPaperCard)
              ) : (
                <Text className="text-gray-400 text-center">No papers currently being read</Text>
              )}
            </View>

            <View className="px-4 py-2">
              <Text className="text-black text-lg font-JakartaBold mb-4">Saved Papers</Text>
              {savedPapers.length > 0 ? (
                savedPapers.map(renderPaperCard)
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