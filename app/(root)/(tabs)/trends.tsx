import PaperDetailModal from "@/components/PaperDetailModal";
import { useUser } from "@clerk/clerk-expo";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import PaperCard from "@/components/PaperCard";

type TimePeriod = "day" | "week" | "month" | "all";

interface TrendData {
  date: string;
  likes: number;
  saves: number;
  views: number;
}

const Trends = () => {
  const { user } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("week");
  const [topPapers, setTopPapers] = useState<any[]>([]);
  const [hotPapers, setHotPapers] = useState<any[]>([]);
  const [newestPapers, setNewestPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const timePeriods: TimePeriod[] = ["day", "week", "month", "all"];

  const fetchTrends = async (skipCache = false) => {
    if (!skipCache) setLoading(true);
    try {
      // Fetch top papers
      // const topResponse = await fetch(`/(api)/trends/top?period=${selectedPeriod}`);
      // const topResult = await topResponse.json();
      // console.log("topResult", topResult);
      // if (topResponse.ok) {
      //   setTopPapers(topResult.data);
      // }

      // // Fetch hot papers
      // const hotResponse = await fetch(`/(api)/trends/hot?period=${selectedPeriod}`);
      // const hotResult = await hotResponse.json();
      // console.log("hotResult", hotResult);
      // if (hotResponse.ok) {
      //   setHotPapers(hotResult.data);
      // }

      // // Fetch newest papers
      // const newestResponse = await fetch(`/(api)/trends/new`);
      // const newestResult = await newestResponse.json();
      // console.log("newestResult", newestResult);
      // if (newestResponse.ok) {
      //   setNewestPapers(newestResult.data);
      // }
    } catch (error) {
      console.error("Error fetching trends:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTrendData = async (skipCache = false) => {
    try {
      // const response = await fetch(`/(api)/trends/stats?period=${selectedPeriod}`);
      // const result = await response.json();
      // if (response.ok) {
      //   setTrendData(result.data);
      // }
    } catch (error) {
      console.error("Error fetching trend data:", error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTrends(true),
      fetchTrendData(true)
    ]);
  }, [selectedPeriod]);

  useEffect(() => {
    fetchTrends();
    fetchTrendData();
  }, [selectedPeriod]);

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

  const renderSection = (title: string, data: any[]) => (
    <View className="mb-6">
      <Text className="text-xl font-JakartaBold mb-4 px-4">{title}</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.paper_id}
        renderItem={renderPaperCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-4">
            <Text className="text-gray-500">No papers found</Text>
          </View>
        }
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="px-4 pt-6 pb-4">
        <Text className="text-2xl font-JakartaBold mb-4">Trending Papers</Text>
        
        {/* Time Period Selector */}
        <View className="flex-row mb-4">
          {timePeriods.map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              className={`mr-2 px-4 py-2 rounded-full ${
                selectedPeriod === period
                  ? "bg-blue-500"
                  : "bg-gray-200"
              }`}
            >
              <Text
                className={`text-sm ${
                  selectedPeriod === period
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trend Visualization Chart */}
        {trendData.length > 0 && (
          <View className="mb-6 bg-white rounded-2xl p-4 shadow-md">
            <Text className="text-lg font-JakartaBold mb-4">Trends Over Time</Text>
            <LineChart
              data={{
                labels: trendData.map(d => d.date),
                datasets: [
                  {
                    data: trendData.map(d => d.likes),
                    color: () => '#FF6B6B',
                    strokeWidth: 2,
                  },
                  {
                    data: trendData.map(d => d.saves),
                    color: () => '#4ECDC4',
                    strokeWidth: 2,
                  },
                  {
                    data: trendData.map(d => d.views),
                    color: () => '#45B7D1',
                    strokeWidth: 2,
                  },
                ],
                legend: ['Likes', 'Saves', 'Views'],
              }}
              width={Dimensions.get('window').width - 48}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <FlatList
          data={[
            { title: "Top Papers", data: topPapers },
            { title: "Hot Papers", data: hotPapers },
            { title: "Newest Papers", data: newestPapers },
          ]}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => renderSection(item.title, item.data)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
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
    </SafeAreaView>
  );
};

export default Trends;
