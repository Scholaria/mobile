import * as React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

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

interface PaperCardProps {
    paper: Paper;
    onPress?: () => void;
}

export const PaperCard = ({ paper, onPress }: PaperCardProps) => {
    // Format the published date
    const publishedDate = paper.published
        ? new Date(paper.published).toLocaleDateString()
        : "Unknown date";

    // Join authors array into a comma-separated string
    const authors = Array.isArray(paper.authors)
        ? paper.authors.join(", ")
        : paper.authors;

    // Truncate summary if too long
    const summaryPreview =
        paper.summary && paper.summary.length > 200
            ? paper.summary.slice(0, 200) + "…"
            : paper.summary;

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white rounded-2xl p-4 mb-4 shadow-md"
        >
            {/* Title */}
            <Text className="text-lg font-JakartaBold text-gray-900 mb-1">
                {paper.title}
            </Text>

            {/* Subtitle row: category tag + published date */}
            <View className="flex-row items-center mb-2">
                <View className="bg-blue-200 px-2 py-1 rounded-full mr-2">
                    <Text className="text-xs text-blue-800">{paper.category}</Text>
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
            {Array.isArray(paper.keywords) && paper.keywords.length > 0 ? (
                <View className="flex-wrap flex-row">
                    {paper.keywords.map((kw: string, idx: number) => (
                        <View
                            key={`keyword-${idx}`}
                            className="bg-gray-200 px-2 py-0.5 rounded-xl mr-2 mb-2"
                        >
                            <Text className="text-xs text-gray-700">{kw}</Text>
                        </View>
                    ))}
                </View>
            ) : null}

            {/* Organizations */}
            {Array.isArray(paper.organizations) && paper.organizations.length > 0 ? (
                <View className="flex-wrap flex-row mt-1">
                    {paper.organizations.map((org: string, idx: number) => (
                        <View
                            key={`org-${idx}`}
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