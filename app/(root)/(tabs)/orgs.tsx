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
  ActivityIndicator,
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
  pfp?: string;
}

const Orgs = () => {
  const { user } = useUser();
  const [userData, setUserData] = useState<any>(null);
  const [followedOrganizations, setFollowedOrganizations] = useState<Organization[]>([]);
  const [memberOrganizations, setMemberOrganizations] = useState<Organization[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isOrgModalVisible, setIsOrgModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (skipCache = false) => {
    try {
      const result = await fetchAPI(`/user/${user?.id}`, { skipCache });
      if (result && result.data) {
        setUserData(result.data);
        // Extract organizations from user data
        const userFollowedOrgs = result.data.followed_organizations || [];
        const userMemberOrgs = result.data.claimed_organization ? [result.data.claimed_organization] : [];
        setFollowedOrganizations(userFollowedOrgs);
        setMemberOrganizations(userMemberOrgs);
      } else {
        console.error("Error fetching user data:", result?.error || "No data returned");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserData(true);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  const handleReload = async () => {
    try {
      await fetchUserData(true);
    } catch (error) {
      console.error("Error reloading data:", error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      fetchUserData().finally(() => {
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      });
    } else {
      setIsLoading(false);
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

  const handleOrganizationPress = (organization: Organization, fromSearch: boolean = false) => {
    if (fromSearch) {
      // If clicked from search results, fill the search input with the organization name
      setSearchQuery(organization.name);
      setShowSearchResults(false);
    }
    setSelectedOrganization(organization);
    setIsOrgModalVisible(true);
  };

  const handleCloseOrgModal = () => {
    setIsOrgModalVisible(false);
    setSelectedOrganization(null);
  };

  const renderSearchBar = () => (
    <View className="px-4 pt-6 pb-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-JakartaBold text-gray-800">
          Organizations
        </Text>
      </View>
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
  );

  const renderSearchResults = () => (
    <View className="flex-1">
      {isSearching ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Searching organizations...</Text>
        </View>
      ) : searchResults.length > 0 ? (
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
              Search Results ({searchResults.length})
            </Text>
          </View>
          <OrgCards
            organizations={searchResults}
            onOrganizationPress={(org) => handleOrganizationPress(org, true)}
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
      contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
    >
      <View className="flex-1 justify-center items-center px-8">
        <View className="bg-white rounded-2xl p-8 items-center shadow-lg">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
            <Icon name="building" size={32} color="#666" />
          </View>
          
          <Text className="text-2xl font-JakartaBold text-gray-800 mb-4 text-center">
            No Organizations Yet
          </Text>
          
          <Text className="text-gray-600 text-center mb-6 leading-6">
            Start by following organizations you're interested in or search for organizations to discover research from specific institutions, labs, or research groups.
          </Text>
          
          <View className="bg-blue-50 rounded-lg p-4 w-full">
            <Text className="text-blue-800 font-JakartaMedium mb-2">
              How to get started:
            </Text>
            <Text className="text-blue-700 text-sm leading-5">
              • Search for organizations above to follow them{'\n'}
              • Contact us if you'd like to add your organization{'\n'}
              • Organizations help you discover relevant research
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
      {/* Organizations You Follow Section */}
      <View className="px-4 pb-4">
        <Text className="text-lg font-JakartaMedium text-gray-700 mb-4">
          Organizations You Follow ({followedOrganizations.length})
        </Text>
      </View>
      
      {followedOrganizations.length > 0 ? (
        <OrgCards
          organizations={followedOrganizations}
          onOrganizationPress={handleOrganizationPress}
        />
      ) : (
        <View className="px-4 pb-4">
          <View className="bg-gray-50 rounded-lg p-6 items-center">
            <Icon name="building" size={32} color="#9ca3af" />
            <Text className="text-gray-500 mt-2 text-center">
              You're not following any organizations yet
            </Text>
          </View>
        </View>
      )}

      {/* Organizations You're Part Of Section */}
      <View className="px-4 pb-4 mt-6">
        <Text className="text-lg font-JakartaMedium text-gray-700 mb-4">
          Organizations You're Part Of ({memberOrganizations.length})
        </Text>
      </View>
      
      {memberOrganizations.length > 0 ? (
        <OrgCards
          organizations={memberOrganizations}
          onOrganizationPress={handleOrganizationPress}
        />
      ) : (
        <View className="px-4 pb-4">
          <View className="bg-gray-50 rounded-lg p-6 items-center">
            <Icon name="users" size={32} color="#9ca3af" />
            <Text className="text-gray-500 mt-2 text-center">
              You're not part of any organizations yet
            </Text>
            <Text className="text-gray-400 mt-1 text-sm text-center">
              Contact us to add your organization
            </Text>
          </View>
        </View>
      )}
      
      <View className="h-20" />
    </ScrollView>
  );

  const renderMainContent = () => {
    if (showSearchResults) {
      return renderSearchResults();
    }
    
    if (followedOrganizations.length > 0 || memberOrganizations.length > 0) {
      return renderOrganizationsList();
    }
    
    return renderEmptyState();
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <SignedIn>
        {isLoading ? (
          <View className="flex-1 justify-center items-center bg-general-500">
            <View className="bg-white rounded-2xl p-8 shadow-lg">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-gray-600 mt-4 font-JakartaMedium text-center">
                Loading your organizations...
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Always show search bar */}
            {renderSearchBar()}
            
            {/* Main content area */}
            <View className="flex-1">
              {renderMainContent()}
            </View>
          </>
        )}
        
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
              onFollowChange={handleReload}
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

