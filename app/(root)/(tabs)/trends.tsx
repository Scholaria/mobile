import PaperDetailModal from "@/components/PaperDetailModal";
import AnalyticsCard from "@/components/AnalyticsCard";
import AnalyticsIcon from "@/components/AnalyticsIcon";
import SimpleBarChart from "@/components/SimpleBarChart";
import OrganizationModal from "@/components/organizationModel";
import AuthorModal from "@/components/authorModel";
import CategoriesModal from "@/components/categoriesModel";
import { useUser } from "@clerk/clerk-expo";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Dimensions,
} from "react-native";
import PaperCard from "@/components/PaperCard";
import { fetchAPI } from "@/lib/fetch";

type TimePeriod = "day" | "week" | "month" | "all";

interface StatsCard {
  title: string;
  value: string | number;
  subtitle: string;
  gradient: string[];
}

interface AnalyticsData {
  trendingPapers: any[];
  trendingTopics: any[];
  trendingAuthors: any[];
  trendingOrganizations: any[];
  overallStats: any;
  categoryBreakdown: any[];
}

const { width, height } = Dimensions.get('window');

const Trends = () => {
  const { user } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("week");
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [isOrgModalVisible, setIsOrgModalVisible] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<any>(null);
  const [isAuthorModalVisible, setIsAuthorModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isCategoryFollowing, setIsCategoryFollowing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    trendingPapers: [],
    trendingTopics: [],
    trendingAuthors: [],
    trendingOrganizations: [],
    overallStats: {},
    categoryBreakdown: []
  });

  const timePeriods: TimePeriod[] = ["day", "week", "month", "all"];

  const fetchTrends = async (skipCache = false) => {
    if (!skipCache) setLoading(true);
    try {
      const [papersResult, topicsResult, authorsResult, orgsResult, statsResult, categoriesResult] = await Promise.all([
        fetchAPI(`/trends/papers?period=${selectedPeriod}`).catch(err => {
          console.error("Error fetching papers:", err);
          return { data: [] };
        }),
        fetchAPI(`/trends/topics?period=${selectedPeriod}`).catch(err => {
          console.error("Error fetching topics:", err);
          return { data: [] };
        }),
        fetchAPI(`/trends/authors?period=${selectedPeriod}`).catch(err => {
          console.error("Error fetching authors:", err);
          return { data: [] };
        }),
        fetchAPI(`/trends/organizations?period=${selectedPeriod}`).catch(err => {
          console.error("Error fetching organizations:", err);
          return { data: [] };
        }),
        fetchAPI(`/trends/stats?period=${selectedPeriod}`).catch(err => {
          console.error("Error fetching stats:", err);
          return { data: {} };
        }),
        fetchAPI(`/trends/categories?period=${selectedPeriod}`).catch(err => {
          console.error("Error fetching categories:", err);
          return { data: [] };
        })
      ]);

      const newAnalyticsData = {
        trendingPapers: papersResult?.data || [],
        trendingTopics: topicsResult?.data || [],
        trendingAuthors: authorsResult?.data || [],
        trendingOrganizations: orgsResult?.data || [],
        overallStats: statsResult?.data || {},
        categoryBreakdown: categoriesResult?.data || []
      };

      setAnalyticsData(newAnalyticsData);
    } catch (error) {
      console.error("Error fetching trends:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTrends(true);
  }, [selectedPeriod]);

  useEffect(() => {
    fetchTrends();
  }, [selectedPeriod]);

  const handleOrganizationPress = (organization: any) => {
    setSelectedOrganization(organization);
    setIsOrgModalVisible(true);
  };

  const handleAuthorPress = (author: any) => {
    setSelectedAuthor(author);
    setIsAuthorModalVisible(true);
  };

  const handleCategoryPress = async (category: string) => {
    if (!user?.id) return;
    
    try {
      // Check if user is already following this category
      const userData = await fetchAPI(`/user/${user.id}`);
      const followedCategories = userData?.data?.followed_categories || [];
      const isFollowing = followedCategories.some((cat: any) => cat.category === category);
      
      setSelectedCategory(category);
      setIsCategoryFollowing(isFollowing);
      setIsCategoryModalVisible(true);
    } catch (error) {
      console.error('Error checking category follow status:', error);
    }
  };

  const handleCategoryConfirm = async () => {
    if (!user?.id || !selectedCategory) return;
    
    try {
      const method = isCategoryFollowing ? 'DELETE' : 'POST';
      await fetchAPI(`/user/${user.id}/category`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });
      
      setIsCategoryModalVisible(false);
      // Refresh data to update UI
      fetchTrends(true);
    } catch (error) {
      console.error('Error toggling category follow:', error);
    }
  };

  const renderStatsCard = ({ item, index }: { item: StatsCard; index: number }) => {
    const getIconType = (title: string) => {
      if (title.includes('Papers')) return 'papers';
      if (title.includes('Engagement')) return 'engagement';
      if (title.includes('Avg')) return 'avg';
      if (title.includes('%')) return 'percentage';
      return 'papers';
    };

    return (
      <AnalyticsCard
        key={`stats-${index}`}
        title={item.title}
        value={item.value}
        subtitle={item.subtitle}
        gradient={item.gradient}
        icon={<AnalyticsIcon type={getIconType(item.title)} />}
      />
    );
  };

  const renderTopicCard = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      key={`topic-${item.category}-${index}`} 
      className="bg-primary-700 rounded-xl p-4 mr-4 min-w-[200px] max-w-[250px]"
      onPress={() => handleCategoryPress(item.category)}
    >
      <Text className="text-lg font-JakartaBold text-white mb-2" numberOfLines={2}>{item.category}</Text>
      <View className="flex-row justify-between mb-2">
        <Text className="text-sm text-gray-300">Papers: {item.paper_count}</Text>
        <Text className="text-sm text-gray-300">Score: {Math.round(item.trend_score)}</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-sm text-gray-300">Engagement: {parseFloat(item.engagement_rate || "0").toFixed(2)}</Text>
        <Text className="text-sm text-secondary-400">Avg Age: {parseFloat(item.avg_days_old || "0").toFixed(1)}d</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAuthorCard = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      key={`author-${item.id || item.name}-${index}`} 
      className="bg-primary-700 rounded-xl p-4 mr-4 min-w-[200px] max-w-[250px]"
      onPress={() => handleAuthorPress(item)}
    >
      <Text className="text-lg font-JakartaBold text-white mb-1" numberOfLines={1}>{item.name}</Text>
      <Text className="text-sm text-gray-300 mb-2" numberOfLines={2}>{item.bio}</Text>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-300">Papers: {item.paper_count}</Text>
        <Text className="text-sm text-gray-300">Followers: {item.followers_count}</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-sm text-gray-300">Engagement: {parseFloat(item.engagement_rate || "0").toFixed(2)}</Text>
        <Text className="text-sm text-secondary-400">Score: {Math.round(parseFloat(item.trend_score || "0"))}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderOrganizationCard = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      key={`org-${item.id || item.name}-${index}`} 
      className="bg-primary-700 rounded-xl p-4 mr-4 min-w-[200px] max-w-[250px]"
      onPress={() => handleOrganizationPress(item)}
    >
      <Text className="text-lg font-JakartaBold text-white mb-1" numberOfLines={1}>{item.name}</Text>
      <Text className="text-sm text-gray-300 mb-2" numberOfLines={2}>{item.bio}</Text>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-300">Papers: {item.paper_count}</Text>
        <Text className="text-sm text-gray-300">Followers: {item.followers_count}</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-sm text-gray-300">Engagement: {parseFloat(item.engagement_rate || "0").toFixed(2)}</Text>
        <Text className="text-sm text-secondary-400">Score: {Math.round(parseFloat(item.trend_score || "0"))}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryCard = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      key={`category-${item.category}-${index}`} 
      className="bg-primary-700 rounded-xl p-3 mr-3 min-w-[150px] max-w-[200px]"
      onPress={() => handleCategoryPress(item.category)}
    >
      <Text className="text-sm font-JakartaBold text-white mb-1" numberOfLines={1}>{item.category}</Text>
      <View className="flex-row justify-between">
        <Text className="text-xs text-gray-300">{item.paper_count} papers</Text>
        <Text className="text-xs text-secondary-400">{parseFloat(item.engagement_rate || "0").toFixed(2)} eng.</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPaperCard = ({ item }: { item: any }) => {
    return (
      <PaperCard
        paper={item}
        userData={user}
        onPress={() => {
          setSelectedPaper(item);
          setIsModalVisible(true);
        }}
      />
    );
  };

  const renderSection = (title: string, data: any[], renderItem: any, horizontal = true) => {
    if (data.length === 0) return null;
    
    return (
      <View className="mb-6" style={{ maxHeight: horizontal ? 200 : undefined }}>
        <Text className="text-xl font-JakartaBold mb-4 px-4 text-white">{title}</Text>
        <FlatList
          data={data}
          keyExtractor={(item, index) => {
            const id = item.paper_id || item.category || item.id || item.name || `item-${index}`;
            return `${title}-${id}-${index}`;
          }}
          renderItem={renderItem}
          horizontal={horizontal}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={horizontal ? { paddingRight: 16 } : undefined}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center px-4">
              <Text className="text-gray-300">No data found</Text>
            </View>
          }
        />
      </View>
    );
  };

  const statsCards: StatsCard[] = [
    {
      title: "Total Papers",
      value: analyticsData.overallStats?.total_papers || 0,
      subtitle: "Published",
      gradient: ["#3B82F6", "#1D4ED8"]
    },
    {
      title: "Total Engagement",
      value: (analyticsData.overallStats?.total_likes || 0) + (analyticsData.overallStats?.total_saves || 0),
      subtitle: "Likes + Saves",
      gradient: ["#10B981", "#059669"]
    },
    {
      title: "Avg Engagement",
      value: parseFloat(analyticsData.overallStats?.avg_engagement_per_paper || "0").toFixed(2),
      subtitle: "Per Paper",
      gradient: ["#8B5CF6", "#7C3AED"]
    },
    {
      title: "Engagement %",
      value: `${parseFloat(analyticsData.overallStats?.engagement_percentage || "0").toFixed(1)}%`,
      subtitle: "Papers with activity",
      gradient: ["#F59E0B", "#D97706"]
    }
  ];

  const renderMainItem = ({ item, index }: { item: any; index: number }) => {
    switch (item.type) {
      case 'header':
        return (
          <View key="header" className="px-4 pt-6 pb-4">
            <Text className="text-3xl font-JakartaBold mb-2 text-white">Analytics</Text>
            <Text className="text-gray-300 mb-4">Research trends & insights</Text>
            
            {/* Time Period Selector */}
            <View className="flex-row mb-4 flex-wrap">
              {timePeriods.map((period) => (
                <TouchableOpacity
                  key={period}
                  onPress={() => setSelectedPeriod(period)}
                  className={`mr-2 mb-2 px-4 py-2 rounded-full ${
                    selectedPeriod === period
                      ? "bg-secondary-500"
                      : "bg-primary-600"
                  }`}
                >
                  <Text
                    className={`text-sm font-JakartaMedium ${
                      selectedPeriod === period
                        ? "text-white"
                        : "text-gray-200"
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'stats':
        return (
          <View key="stats" className="mb-6 px-4">
            <Text className="text-xl font-JakartaBold mb-4 text-white">Overview</Text>
            {statsCards.length > 0 ? (
              <FlatList
                data={statsCards}
                keyExtractor={(item, index) => `stats-${item.title}-${index}`}
                renderItem={renderStatsCard}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              />
            ) : (
              <View className="bg-primary-700 rounded-xl p-4">
                <Text className="text-gray-300 text-center">No data available</Text>
              </View>
            )}
          </View>
        );

      case 'categoryChart':
        const validChartCategories = analyticsData.categoryBreakdown.filter(item => item.category && item.category.trim() !== '');
        
        if (validChartCategories.length > 0 && validChartCategories.length <= 20) {
          return (
            <View key="categoryChart" className="mb-6 px-4">
              <Text className="text-xl font-JakartaBold mb-4 text-white">Category Engagement</Text>
              <View className="bg-primary-700 rounded-xl p-4">
                {validChartCategories.slice(0, 3).map((item, index) => (
                  <View key={index} className="flex-row items-center justify-between mb-3 last:mb-0">
                    <Text className="text-sm text-gray-300 font-JakartaMedium flex-1 mr-3" numberOfLines={1}>
                      {item.category}
                    </Text>
                    <View className="flex-row items-center">
                      <View className="w-16 h-2 bg-gray-600 rounded-full mr-2">
                        <View 
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6'][index % 3],
                            width: '50%'
                          }}
                        />
                      </View>
                      <Text className="text-xs text-gray-400 w-12 text-right">
                        {parseFloat(String(item.engagement_rate)).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        }
        return null;

      case 'categories':
        const validCategories = analyticsData.categoryBreakdown.filter(item => item.category && item.category.trim() !== '');
        const topCategories = validCategories.slice(0, 10);
        return renderSection("Top Categories", topCategories, renderCategoryCard);

      case 'topics':
        const validTopics = analyticsData.trendingTopics.filter(item => item.category && item.category.trim() !== '');
        const topTopics = validTopics.slice(0, 8);
        return renderSection("Trending Topics", topTopics, renderTopicCard);

      case 'authors':
        const topAuthors = analyticsData.trendingAuthors.slice(0, 8);
        return renderSection("Trending Authors", topAuthors, renderAuthorCard);

      case 'organizations':
        const topOrganizations = analyticsData.trendingOrganizations.slice(0, 8);
        return renderSection("Trending Organizations", topOrganizations, renderOrganizationCard);

      case 'platformStats':
        return analyticsData.overallStats ? (
          <View key="platformStats" className="mb-6 px-4">
            <Text className="text-xl font-JakartaBold mb-4 text-white">Platform Stats</Text>
            <View className="bg-primary-700 rounded-xl p-4">
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-300">Total Authors</Text>
                <Text className="text-white font-JakartaBold">{analyticsData.overallStats.total_authors || 0}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-300">Total Organizations</Text>
                <Text className="text-white font-JakartaBold">{analyticsData.overallStats.total_organizations || 0}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-300">Papers with Likes</Text>
                <Text className="text-white font-JakartaBold">{analyticsData.overallStats.papers_with_likes || 0}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Papers with Saves</Text>
                <Text className="text-white font-JakartaBold">{analyticsData.overallStats.papers_with_saves || 0}</Text>
              </View>
            </View>
          </View>
        ) : null;

      case 'papers':
        return renderSection("Trending Papers", analyticsData.trendingPapers, renderPaperCard, false);

      case 'spacing':
        return <View key="spacing" className="h-20" />;

      default:
        return null;
    }
  };

  const mainData = loading ? [] : [
    { type: 'header' },
    { type: 'stats' },
    { type: 'categoryChart' },
    { type: 'categories' },
    { type: 'topics' },
    { type: 'authors' },
    { type: 'organizations' },
    { type: 'platformStats' },
    { type: 'papers' },
    { type: 'spacing' }
  ];

  return (
    <SafeAreaView className="flex-1 bg-primary-800">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-300 mt-4">Loading analytics...</Text>
        </View>
      ) : mainData.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-xl font-JakartaBold text-white mb-2">No Data Available</Text>
          <Text className="text-gray-300 text-center mb-4">
            Unable to load analytics data. Please check your connection and try again.
          </Text>
          <TouchableOpacity 
            onPress={() => fetchTrends(true)}
            className="bg-secondary-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-JakartaMedium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mainData}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          renderItem={renderMainItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B82F6"]}
              tintColor="#3B82F6"
            />
          }
        />
      )}

      <PaperDetailModal
        paper={selectedPaper}
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedPaper(null);
        }}
      />

      <OrganizationModal
        organization={selectedOrganization}
        visible={isOrgModalVisible}
        onClose={() => {
          setIsOrgModalVisible(false);
          setSelectedOrganization(null);
        }}
        userData={user}
      />

      <AuthorModal
        author={selectedAuthor}
        visible={isAuthorModalVisible}
        onClose={() => {
          setIsAuthorModalVisible(false);
          setSelectedAuthor(null);
        }}
        userData={user}
      />

      <CategoriesModal
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        category={selectedCategory}
        isFollowing={isCategoryFollowing}
        onConfirm={handleCategoryConfirm}
      />
    </SafeAreaView>
  );
};

export default Trends; 