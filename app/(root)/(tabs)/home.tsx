import PaperDetailModal from "@/components/PaperDetailModal";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { Link } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { fetchAPI } from '@/lib/fetch';

const Home = () => {
  const isLocal = Constants.expoConfig!.extra?.USE_LOCAL_DATABASE === "true";
  const { user } = useUser();
  const [userData, setUserData] = useState<any>(null);
  const [papers, setPapers] = useState<any[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [localDB, setLocalDB] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await fetchAPI(`/(api)/user/${user?.id}`);
        if (result) {
          setUserData(result.data);
        } else {
          console.error("Error fetching user data:", result.error);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    if (user?.id) fetchUserData();
  }, [user]);

  const fetchPapers = async () => {
    try { 
      const result = await fetchAPI(`/(api)/recommendation/${user?.id}`);
      setPapers(result.data);
      setFilteredPapers(result.data);
    } catch (error) {
      console.error("Error fetching papers:", error);
    }
  };

  useEffect(() => {
    fetchPapers();
    setLocalDB(isLocal);
  }, []);


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
      const result = await fetchAPI(`/(api)/paper/search?query=${query}`);
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
    // Format the published date
    const publishedDate = item.published
      ? new Date(item.published).toLocaleDateString()
      : "Unknown date";

    // Join authors array into a comma-separated string
    const authors = Array.isArray(item.authors)
      ? item.authors.join(", ")
      : item.authors;

    // Truncate summary if too long
    const summaryPreview =
      item.summary && item.summary.length > 200
        ? item.summary.slice(0, 200) + "…"
        : item.summary;

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedPaper(item);
          setIsModalVisible(true);
        }}
        className="bg-white rounded-2xl p-4 mb-4 shadow-md mx-4"
      >
        {/* Title */}
        <Text className="text-lg font-JakartaBold text-gray-900 mb-1">
          {item.title}
        </Text>

        {/* Subtitle row: category tag + published date */}
        <View className="flex-row items-center mb-2">
          <View className="bg-blue-200 px-2 py-1 rounded-full mr-2">
            <Text className="text-xs text-blue-800">{item.category}</Text>
          </View>
          <Text className="text-xs text-gray-600">{publishedDate}</Text>
        </View>

        {/* Authors */}
        <Text className="text-sm text-gray-700 mb-2">
          {authors || "Unknown authors"}
        </Text>

        {/* Summary preview (if available) */}
        {summaryPreview ? (
          <Text className="text-sm text-gray-800 mb-2">{summaryPreview}</Text>
        ) : null}

        {/* Keywords */}
        {Array.isArray(item.keywords) && item.keywords.length > 0 ? (
          <View className="flex-wrap flex-row">
            {item.keywords.map((kw: string, idx: number) => (
              <View
                key={idx}
                className="bg-gray-200 px-2 py-0.5 rounded-xl mr-2 mb-2"
              >
                <Text className="text-xs text-gray-700">{kw}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Organizations */}
        {Array.isArray(item.organizations) && item.organizations.length > 0 ? (
          <View className="flex-wrap flex-row mt-1">
            {item.organizations.map((org: string, idx: number) => (
              <View
                key={idx}
                className="bg-green-200 px-2 py-0.5 rounded-xl mr-2 mb-1"
              >
                <Text className="text-xs text-green-800">{org}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <SignedIn>
        {localDB ? <Text>Local DB</Text> : <Text></Text>}
        <FlatList
          data={filteredPapers}
          keyExtractor={(item) => item.paper_id}
          renderItem={renderPaperCard}
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