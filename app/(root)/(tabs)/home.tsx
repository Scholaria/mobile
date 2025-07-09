import PaperDetailModal from "@/components/PaperDetailModal";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator
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
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true);
      Promise.all([
        fetchPapers(),
        fetchUserData()
      ]).finally(() => {
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      });
    } else {
      // console.log("No user ID available yet");
    }
  }, [user?.id]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setFilteredPapers(papers);
        setIsSearching(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery, papers]);

  const performSearch = async (query: string) => {
    setIsSearching(true);

    // First search locally in the papers we already have
    const localResults = papers.filter(paper => {
      const searchableText = [
        paper.title,
        paper.authors?.map((author: any) => author.name).join(' '),
        paper.categories,
        paper.keywords?.join(' '),
        paper.organizations?.map((org: any) => org.name).join(' ')
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
      // console.log("Searching papers with query:", query);
      const result = await fetchAPI(`/paper/search?query=${encodeURIComponent(query)}`);
      
      if (result && result.data) {
        // console.log("Search API returned:", result.data.length, "papers");
        setFilteredPapers(result.data);
      } else {
        // console.log("No results from search API, using local results");
        setFilteredPapers(localResults);
      }
    } catch (error) {
      console.error("Error searching papers:", error);
      // Fallback to local results if API call fails
      setFilteredPapers(localResults);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredPapers(papers);
    setIsSearching(false);
  };

  const handleReload = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUserData(true),
        fetchPapers(true)
      ]);
    } catch (error) {
      console.error("Error reloading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaperCard = React.useCallback(({ item }: { item: any }) => {
    return (
      <PaperCard
        paper={item}
        userData={userData}
      />
    );
  }, [userData]);

  const keyExtractor = React.useCallback((item: any) => item.paper_id, []);

  const getItemLayout = React.useCallback((data: any, index: number) => ({
    length: 200, // Approximate height of each item
    offset: 200 * index,
    index,
  }), []);

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <SignedIn>
        {isLoading ? (
          <View className="flex-1 justify-center items-center bg-general-500">
            <View className="bg-white rounded-2xl p-8 shadow-lg">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-gray-600 mt-4 font-JakartaMedium text-center">
                Loading your research feed...
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredPapers}
            keyExtractor={keyExtractor}
            renderItem={renderPaperCard}
            getItemLayout={getItemLayout}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={5}
            updateCellsBatchingPeriod={50}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#2563eb"]}
                tintColor="#2563eb"
              />
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-12">
                <View className="bg-white rounded-2xl p-8 mx-4 shadow-sm border border-gray-100">
                  <Icon 
                    name={isSearching ? "search" : "file-text-o"} 
                    size={48} 
                    color="#ccc" 
                    style={{ marginBottom: 16, textAlign: 'center' }}
                  />
                  <Text className="text-gray-500 text-center font-JakartaMedium text-lg mb-2">
                    {isSearching ? "Searching..." : "No papers found"}
                  </Text>
                  <Text className="text-gray-400 text-center font-JakartaMedium text-sm">
                    {isSearching 
                      ? "Looking for relevant research papers..." 
                      : "Try adjusting your search terms or check back later for new papers"
                    }
                  </Text>
                </View>
              </View>
            }
            ListHeaderComponent={() => (
              <View className="px-4 pt-6 pb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-2xl font-JakartaBold">
                    Welcome back, {userData?.name.split(" ")[0] || "Researcher"}
                  </Text>
                  <View className="flex-row items-center space-x-2">
                    <TouchableOpacity 
                      onPress={handleReload}
                      className="bg-gray-100 p-2 rounded-full"
                    >
                      <Icon name="refresh" size={16} color="#666" />
                    </TouchableOpacity>
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
                </View>
                
                {/* Search Bar */}
                <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 mb-4 shadow-sm border border-gray-100">
                  <Icon name="search" size={18} color="#666" style={{ marginRight: 12 }} />
                  <TextInput
                    className="flex-1 text-base font-JakartaMedium"
                    placeholder="Search papers by title, abstract, authors, keywords, organizations..."
                    value={searchQuery}
                    onChangeText={handleSearchInputChange}
                    placeholderTextColor="#999"
                    style={{
                      fontSize: 16,
                      lineHeight: 20,
                    }}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity 
                      onPress={clearSearch}
                      className="bg-gray-100 p-1 rounded-full"
                      activeOpacity={0.7}
                    >
                      <Icon name="times-circle" size={16} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        )}
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