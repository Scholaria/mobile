import * as React from "react";
import { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import PaperCard from "../../../components/PaperCard";
import PaperDetailModal from "../../../components/PaperDetailModal";
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '@/lib/fetch';
import { FollowingTracker } from '@/lib/followingTracker';

interface Author {
  id: number;
  name: string;
  bio?: string;
  info?: any;
  order?: number;
}

interface Organization {
  id: number;
  name: string;
  bio?: string;
  website?: string;
  pfp?: string;
}

interface Paper {
  paper_id: string;
  title: string;
  abstract: string;
  authors: Author[];
  published: string;
  category: string;
  link: string;
  summary?: string;
  keywords?: string[];
  organizations?: Organization[];
  likes_count?: number;
  save_count?: number;
}

export default function Following() {
    const { userId } = useAuth();
    const [papers, setPapers] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [newPaperIds, setNewPaperIds] = useState<string[]>([]);

    const fetchUserData = async (skipCache = false) => {
        try {
            const result = await fetchAPI(`/user/${userId}`, { skipCache });
            if (result) {
                setUserData(result);
                await fetchFollowedPapers(result, skipCache);
            } else {
                console.error("Error fetching user data:", result.error);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchFollowedPapers = async (userData: any, skipCache = false) => {
        try {
            setLoading(true);
            const followedAuthors = userData.followed_authors || [];
            const followedOrganizations = userData.followed_organizations || [];

            if (followedAuthors.length === 0 && followedOrganizations.length === 0) {
                setPapers([]);
                setLoading(false);
                return;
            }

            // Fetch papers for each followed author
            const authorPapersPromises = followedAuthors.map(async (author: Author) => {
                try {
                    const response = await fetchAPI(`/author/${author.id}/papers?limit=20`, { skipCache });
                    return response.data || [];
                } catch (error) {
                    console.error(`Error fetching papers for author ${author.id}:`, error);
                    return [];
                }
            });

            // Fetch papers for each followed organization
            const organizationPapersPromises = followedOrganizations.map(async (org: Organization) => {
                try {
                    const response = await fetchAPI(`/organization/${org.id}/papers?limit=20`, { skipCache });
                    return response.data || [];
                } catch (error) {
                    console.error(`Error fetching papers for organization ${org.id}:`, error);
                    return [];
                }
            });

            // Wait for all requests to complete
            const [authorPapersResults, organizationPapersResults] = await Promise.all([
                Promise.all(authorPapersPromises),
                Promise.all(organizationPapersPromises)
            ]);

            // Flatten and combine all papers
            const allPapers = [
                ...authorPapersResults.flat(),
                ...organizationPapersResults.flat()
            ];

            // Remove duplicates based on paper_id
            const uniquePapers = Array.from(
                new Map(allPapers.map(paper => [paper.paper_id, paper])).values()
            );

            // Sort by published date (newest first)
            const sortedPapers = uniquePapers.sort((a, b) => 
                new Date(b.published).getTime() - new Date(a.published).getTime()
            );

            setPapers(sortedPapers);

            // Track new papers
            const newPapers = await FollowingTracker.getNewPapers(sortedPapers);
            setNewPaperIds(newPapers);

        } catch (error) {
            console.error("Error fetching followed papers:", error);
            setError("An error occurred while fetching papers");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchUserData(true);
    }, []);

    useEffect(() => {
        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    // Set last visit time when component mounts
    useEffect(() => {
        const setLastVisit = async () => {
            await FollowingTracker.setLastVisitTime();
        };
        setLastVisit();
    }, []);

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text className="mt-4 text-gray-600">Loading your followed papers...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center p-6">
                    <Ionicons name="alert-circle" size={48} color="#ef4444" />
                    <Text className="mt-4 text-lg text-red-500 font-medium">{error}</Text>
                    <Text className="mt-2 text-gray-600 text-center">Please try again later</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (papers.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="px-4 py-3 border-b border-gray-100">
                    <Text className="text-2xl font-bold text-gray-800">Following</Text>
                </View>
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
                    <View className="flex-1 items-center justify-center p-6">
                        <View className="w-48 h-48 mb-6 items-center justify-center">
                            <View className="bg-blue-50 rounded-full p-8 mb-4">
                                <Ionicons name="document-text-outline" size={64} color="#2563eb" />
                            </View>
                            <View className="absolute -bottom-2 -right-2">
                                <View className="bg-blue-100 rounded-full p-3">
                                    <Ionicons name="add-circle" size={32} color="#1e40af" />
                                </View>
                            </View>
                        </View>
                        <Text className="text-2xl font-bold text-gray-800 mb-2">
                            No Papers Yet
                        </Text>
                        <Text className="text-base text-gray-600 text-center mb-6">
                            Follow authors and organizations to see their latest research papers here. New papers will be highlighted with a "NEW" badge.
                        </Text>
                        <View className="bg-blue-50 rounded-lg p-4 w-full">
                            <Text className="text-blue-800 text-center">
                                <Ionicons name="information-circle" size={16} color="#1e40af" /> 
                                {" "}Start by following authors or organizations from their profiles
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-4 py-3 border-b border-gray-100">
                <Text className="text-2xl font-bold text-gray-800">Following</Text>
                <Text className="text-gray-600 mt-1">
                    Latest papers from authors and organizations you follow
                    {newPaperIds.length > 0 && (
                        <Text className="text-red-500 font-semibold">
                            {" "}({newPaperIds.length} new)
                        </Text>
                    )}
                </Text>
            </View>
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
                <View className="p-4 space-y-4">
                    {papers.map((paper) => (
                        <PaperCard 
                            key={paper.paper_id} 
                            paper={paper}
                            userData={userData}
                            isNew={newPaperIds.includes(paper.paper_id)}
                            onPress={() => {
                                setSelectedPaper(paper);
                                setIsModalVisible(true);
                            }}
                        />
                    ))}
                </View>
            </ScrollView>
            <PaperDetailModal
                paper={selectedPaper}
                visible={isModalVisible}
                onClose={() => {
                    setIsModalVisible(false);
                    setSelectedPaper(null);
                }}
                userData={userData}
            />
        </SafeAreaView>
    );
}       