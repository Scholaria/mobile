import * as React from "react";
import { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { PaperCard } from "../../../components/PaperCard";
import PaperDetailModal from "../../../components/PaperDetailModal";
import { Ionicons } from '@expo/vector-icons';
import { icons } from "../../../constants";
import { fetchAPI } from '@/lib/fetch';

interface Paper {
    paper_id: string;
    title: string;
    abstract: string;
    authors: string[];
    published: string;
    category: string;
    link: string;
    summary?: string;
    keywords?: string[];
    organizations?: string[];
}

export default function Following() {
    const { userId } = useAuth();
    const [papers, setPapers] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        async function fetchPapers() {
            try {
                // Get followed authors
                const authorsData = await fetchAPI(`/(api)/user/${userId}/authors`);
                const authors = authorsData.data.map((a: any) => a.author);

                // Get followed organizations
                const orgsData = await fetchAPI(`/(api)/user/${userId}/orgs`);
                const orgs = orgsData.data.map((o: any) => o.organization);

                if (authors.length === 0 && orgs.length === 0) {
                    setLoading(false);
                    return;
                }

                // Search for papers
                const searchParams = new URLSearchParams();
                if (authors.length > 0) searchParams.append('authors', authors.join(','));
                if (orgs.length > 0) searchParams.append('orgs', orgs.join(','));
                
                const papersData = await fetchAPI(`/(api)/paper/search?${searchParams.toString()}`);
                setPapers(papersData.data);
            } catch (err) {
                setError('Failed to fetch papers');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            fetchPapers();
        }
    }, [userId]);

    if (loading) {
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
                        Follow authors and organizations to see their latest research papers here
                    </Text>
                    <View className="bg-blue-50 rounded-lg p-4 w-full">
                        <Text className="text-blue-800 text-center">
                            <Ionicons name="information-circle" size={16} color="#1e40af" /> 
                            {" "}Start by following authors or organizations from their profiles
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-4 py-3 border-b border-gray-100">
                <Text className="text-2xl font-bold text-gray-800">Following</Text>
                <Text className="text-gray-600 mt-1">
                    Latest papers from authors and organizations you follow
                </Text>
            </View>
            <ScrollView className="flex-1">
                <View className="p-4 space-y-4">
                    {papers.map((paper) => (
                        <PaperCard 
                            key={paper.paper_id} 
                            paper={paper} 
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
            />
        </SafeAreaView>
    );
}       