import * as React from "react";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  RefreshControl,
  ScrollView,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import Icon from 'react-native-vector-icons/FontAwesome';
import { fetchAPI } from '@/lib/fetch';
import OrgCards from "@/components/OrgCards";
import OrgScreen from "@/components/OrgScreen";

interface Organization {
  id: number;
  name: string;
  bio?: string;
  website?: string;
}

const Orgs = () => {
  const { user } = useUser();
  const [userData, setUserData] = useState<any>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isOrgModalVisible, setIsOrgModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fetchUserData = async (skipCache = false) => {
    try {
      const result = await fetchAPI(`/user/${user?.id}`, { skipCache });
      if (result) {
        setUserData(result);
        // Extract organizations from user data
        const userOrgs = result.followed_organizations || [];
        setOrganizations(userOrgs);
      } else {
        console.error("Error fetching user data:", result.error);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      // Search for organizations by name
      const result = await fetchAPI(`/organization/search?query=${encodeURIComponent(query)}`);
      setSearchResults(result?.data || []);
    } catch (error) {
      console.error("Error searching organizations:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOrganizationPress = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsOrgModalVisible(true);
  };

  const handleCloseOrgModal = () => {
    setIsOrgModalVisible(false);
    setSelectedOrganization(null);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
  };

  const renderSearchBar = () => (
    <View className="px-4 pt-6 pb-4">
      <Text className="text-2xl font-JakartaBold text-gray-800 mb-4">
        Organizations
      </Text>
      <View className="flex-row items-center bg-white rounded-full px-4 py-2 mb-4">
        <Icon name="search" size={16} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 text-base"
          placeholder="Search organizations to view..."
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
    // <View className="px-4 pt-6 pb-4">
      
    //   {/* Search Bar */}
    //   <View className="flex-row items-center bg-white rounded-full px-4 py-3 mb-4 shadow-sm">
    //     <Icon name="search" size={16} color="#666" style={{ marginRight: 8 }} />
    //     <TextInput
    //       className="flex-1 text-base"
    //       placeholder="Search organizations..."
    //       value={searchQuery}
    //       onChangeText={(text) => handleSearch(text)}
    //       placeholderTextColor="#666"
    //     />
    //     {searchQuery.length > 0 && (
    //       <TouchableOpacity onPress={clearSearch}>
    //         <Icon name="times-circle" size={16} color="#666" />
    //       </TouchableOpacity>
    //     )}
    //   </View>
    // </View>
  );

  const renderSearchResults = () => (
    <View className="flex-1">
      {isSearching ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Searching organizations...</Text>
        </View>
      ) : searchResults.length > 0 ? (
        <ScrollView className="flex-1">
          <View className="px-4 pb-4">
            <Text className="text-lg font-JakartaMedium text-gray-700 mb-4">
              Search Results ({searchResults.length})
            </Text>
          </View>
          <OrgCards
            organizations={searchResults}
            onOrganizationPress={handleOrganizationPress}
          />
          <View className="h-20" />
        </ScrollView>
      ) : searchQuery.length > 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-white rounded-2xl p-8 items-center shadow-lg">
            <Icon name="search" size={48} color="#ccc" />
            <Text className="text-xl font-JakartaBold text-gray-800 mt-4 mb-2">
              No organizations found
            </Text>
            <Text className="text-gray-600 text-center">
              Try searching with different keywords or check the spelling.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <View className="bg-white rounded-2xl p-8 items-center shadow-lg">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
          <Icon name="building" size={32} color="#666" />
        </View>
        
        <Text className="text-2xl font-JakartaBold text-gray-800 mb-4 text-center">
          No Organizations Yet
        </Text>
        
        <Text className="text-gray-600 text-center mb-6 leading-6">
          You're not part of any organizations yet. Organizations help you discover research from specific institutions, labs, or research groups.
        </Text>
        
        <View className="bg-blue-50 rounded-lg p-4 w-full">
          <Text className="text-blue-800 font-JakartaMedium mb-2">
            How to join organizations:
          </Text>
          <Text className="text-blue-700 text-sm leading-5">
            • You can also be invited by organization administrators{'\n'}
            • Contact us if you'd like to add your organization
          </Text>
        </View>
      </View>
    </View>
  );

  const renderOrganizationsList = () => (
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
      <View className="px-4 pb-4">
        <Text className="text-lg font-JakartaMedium text-gray-700 mb-4">
          Your Organizations ({organizations.length})
        </Text>
      </View>
      
      <OrgCards
        organizations={organizations}
        onOrganizationPress={handleOrganizationPress}
      />
      
      <View className="h-20" />
    </ScrollView>
  );

  const renderMainContent = () => {
    if (showSearchResults) {
      return renderSearchResults();
    }
    
    if (organizations.length > 0) {
      return renderOrganizationsList();
    }
    
    return renderEmptyState();
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <SignedIn>
        {/* Always show search bar */}
        {renderSearchBar()}
        
        {/* Main content area */}
        <View className="flex-1">
          {renderMainContent()}
        </View>
        
        {/* Organization Detail Modal */}
        <Modal
          visible={isOrgModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          {selectedOrganization && (
            <OrgScreen
              organization={selectedOrganization}
              userData={userData}
              onClose={handleCloseOrgModal}
            />
          )}
        </Modal>
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

export default Orgs;

