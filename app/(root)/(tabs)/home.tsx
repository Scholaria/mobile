import PaperDetailModal from "@/components/PaperDetailModal";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl
} from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { fetchAPI } from '@/lib/fetch';
import PaperCard from "@/components/PaperCard";

const Home = () => {
  const router = useRouter();
  const { user } = useUser();
  const [userData, setUserData] = useState<any>(null);
  const [papers, setPapers] = useState<any[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async (skipCache = false) => {
    try {
      // console.log("Fetching user data for ID:", user?.id);
      const result = await fetchAPI(`/user/${user?.id}`, { skipCache });

      if (result) {
        // console.log("User data fetched successfully:", result);
        setUserData(result);
      } else {
        console.error("Error fetching user data:", result.error);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchPapers = async (skipCache = false) => {
    try { 
      // console.log("Fetching papers for user ID:", user?.id);
      const result = await fetchAPI(`/recommendation/${user?.id}`, { skipCache });
      setPapers(result.data);
      setFilteredPapers(result.data);
    } catch (error) {
      console.error("Error fetching papers:", error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserData(true),
      fetchPapers(true)
    ]);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => {
    // console.log("User state changed:", user?.id);
    if (user?.id) {
      // console.log("User ID available, fetching data...");
      fetchPapers();
      fetchUserData();
    } else {
      console.log("No user ID available yet");
    }
  }, [user?.id]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredPapers(papers);
      setIsSearching(false);
      return;
    }

    // First search locally in the papers we already have
    const localResults = papers.filter(paper => {
      const searchableText = [
        paper.title,
        paper.authors,
        paper.categories,
        paper.keywords?.join(' '),
        paper.organizations?.join(' ')
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(query.toLowerCase());
    });

    // If we have enough local results (more than 5), use those
    if (localResults.length >= 5) {
      setFilteredPapers(localResults);
      setIsSearching(false);
      return;
    }

    // If we don't have enough local results, make an API call
    try {
      const result = await fetchAPI(`/paper/search?query=${query}`);
      setFilteredPapers(result.data);
    } catch (error) {
      console.error("Error searching papers:", error);
      // Fallback to local results if API call fails
      setFilteredPapers(localResults);
    } finally {
      setIsSearching(false);
    }
  };

  const renderPaperCard = ({ item }: { item: any }) => {
    return (
      <PaperCard
        paper={item}
        userData={userData}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <SignedIn>
        <FlatList
          data={filteredPapers}
          keyExtractor={(item) => item.paper_id}
          renderItem={renderPaperCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-200">
                {isSearching ? "Searching..." : "No papers found"}
              </Text>
            </View>
          }
          ListHeaderComponent={() => (
            <View className="px-4 pt-6 pb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl font-JakartaBold">
                  Welcome back, {userData?.name.split(" ")[0] || "Researcher"}
                </Text>
                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/resume-reading',
                    params: { userData: JSON.stringify(userData) }
                  })}
                  className="bg-primary-500 px-4 py-2 rounded-full flex-row items-center"
                >
                  <Icon name="book" size={16} color="white" style={{ marginRight: 8 }} />
                </TouchableOpacity>
              </View>
              
              {/* Search Bar */}
              <View className="flex-row items-center bg-white rounded-full px-4 py-2 mb-4">
                <Icon name="search" size={16} color="#666" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-base"
                  placeholder="Search papers by title, authors, keywords..."
                  value={searchQuery}
                  onChangeText={(text) => handleSearch(text)}
                  placeholderTextColor="#666"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => handleSearch("")}>
                    <Icon name="times-circle" size={16} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
        <PaperDetailModal
          paper={selectedPaper}
          visible={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setSelectedPaper(null);
          }}
          userData={userData}
        />
      </SignedIn>

      <SignedOut>
        <View className="flex-1 justify-center items-center">
          <Link href="/sign-in">
            <Text className="text-blue-400 mb-4">Sign In</Text>
          </Link>
          <Link href="/sign-up">
            <Text className="text-blue-400">Sign Up</Text>
          </Link>
        </View>
      </SignedOut>
    </SafeAreaView>
  );
};

export default Home;