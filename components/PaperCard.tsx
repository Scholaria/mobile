import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import PaperDetailModal from './PaperDetailModal';
import { useUser } from '@clerk/clerk-expo';
import { fetchAPI } from '@/lib/fetch';
import { getCategoryDisplayName } from '@/lib/categoryMapping';

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

interface PaperCardProps {
  paper: {
    paper_id: string;
    title: string;
    authors?: Author[];
    published?: string;
    category?: string;
    summary?: string;
    keywords?: string[];
    organizations?: Organization[];
    current_page?: number;
    abstract?: string;
    link?: string;
    likes_count?: number;
    save_count?: number;
  };
  onPress?: () => void;
  showSummary?: boolean;
  showKeywords?: boolean;
  showOrganizations?: boolean;
  showReadingProgress?: boolean;
  className?: string;
  userData?: any;
  isNew?: boolean;
}

const PaperCard: React.FC<PaperCardProps> = React.memo(({
  paper,
  onPress,
  showSummary = true,
  showKeywords = true,
  showOrganizations = true,
  showReadingProgress = false,
  className = "",
  userData,
  isNew,
}) => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fullPaper, setFullPaper] = React.useState(paper);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const { user } = useUser();

  // Check if paper is already saved
  React.useEffect(() => {
    if (userData && paper) {
      setIsSaved(userData.saves?.some((p: any) => p.paper_id === paper.paper_id) || false);
    }
  }, [userData, paper]);

  // Memoize computed values
  const publishedDate = React.useMemo(() => 
    paper.published
      ? new Date(paper.published).toLocaleDateString()
      : "Unknown date",
    [paper.published]
  );

  const authors = React.useMemo(() => 
    Array.isArray(paper.authors)
      ? paper.authors.map((author: Author) => author.name).join(", ")
      : "Unknown authors",
    [paper.authors]
  );

  const summaryPreview = React.useMemo(() => 
    paper.summary && paper.summary.length > 200
      ? paper.summary.slice(0, 200) + "…"
      : paper.summary,
    [paper.summary]
  );

  const handleSave = React.useCallback(async () => {
    if (!user?.id || !paper || isSaving) return;
    
    setIsSaving(true);
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetchAPI(`/user/${user.id}/saves`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.paper_id }),
      });
      
      if (response) {
        setIsSaved(!isSaved);
        // Update userData if available
        if (userData) {
          if (isSaved) {
            // Remove from saves
            userData.saves = userData.saves.filter((p: any) => p.paper_id !== paper.paper_id);
          } else {
            // Add to saves
            userData.saves = [...(userData.saves || []), paper];
          }
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, paper, isSaving, isSaved, userData]);

  const handlePress = React.useCallback(async () => {
    if (onPress) {
      onPress();
    } else {
      // If paper doesn't have an abstract, fetch full details
      if (!paper.abstract) {
        setIsLoading(true);
        try {
          const result = await fetchAPI(`/paper/${paper.paper_id}`);
          if (result) {
            setFullPaper(result.data);
          }
        } catch (error) {
          console.error("Error fetching paper details:", error);
        } finally {
          setIsLoading(false);
        }
      }
      setIsModalVisible(true);
    }
  }, [onPress, paper]);

  return (
    <View className={`mx-4 ${className}`}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleSave}
        delayLongPress={500}
        className="bg-white rounded-2xl p-4 mb-4 shadow-lg"
        style={{
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
        activeOpacity={0.95}
      >
        {isLoading ? (
          <View className="items-center justify-center py-4">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <>
            {/* New Paper Badge */}
            {isNew && (
              <View className="absolute top-2 right-2 z-10">
                <View className="bg-red-500 px-2 py-1 rounded-full shadow-sm">
                  <Text className="text-xs text-white font-JakartaBold">NEW</Text>
                </View>
              </View>
            )}

            {/* Title */}
            <Text className="text-lg font-JakartaBold text-gray-900 mb-2 leading-6">
              {paper.title}
            </Text>

            {/* Subtitle row: category tag + published date */}
            <View className="flex-row items-center mb-3">
              {paper.category && (
                <View className="bg-blue-100 px-3 py-1 rounded-full mr-3 border border-blue-200">
                  <Text className="text-xs text-blue-800 font-JakartaMedium">{getCategoryDisplayName(paper.category)}</Text>
                </View>
              )}
              <Text className="text-xs text-gray-500 font-JakartaMedium">{publishedDate}</Text>
            </View>

            {/* Authors */}
            <Text className="text-sm text-gray-700 mb-3 leading-5 font-JakartaMedium" numberOfLines={2}>
              {authors}
            </Text>

            {/* Summary preview (if enabled) */}
            {showSummary && summaryPreview && (
              <Text className="text-sm text-gray-800 mb-3 leading-5">{summaryPreview}</Text>
            )}

            {/* Keywords (if enabled) */}
            {showKeywords && Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
              <View className="flex-wrap flex-row mb-3">
                {paper.keywords.slice(0, 3).map((kw: string, idx: number) => (
                  <View
                    key={idx}
                    className="bg-gray-100 px-2 py-1 rounded-lg mr-2 mb-2 border border-gray-200"
                  >
                    <Text className="text-xs text-gray-700 font-JakartaMedium">{kw}</Text>
                  </View>
                ))}
                {paper.keywords.length > 3 && (
                  <View className="bg-gray-100 px-2 py-1 rounded-lg mr-2 mb-2 border border-gray-200">
                    <Text className="text-xs text-gray-700 font-JakartaMedium">+{paper.keywords.length - 3} more</Text>
                  </View>
                )}
              </View>
            )}

            {/* Organizations (if enabled) */}
            {showOrganizations && Array.isArray(paper.organizations) && paper.organizations.length > 0 && (
              <View className="flex-wrap flex-row mb-3">
                {paper.organizations.slice(0, 2).map((org: any, idx: number) => (
                  <View
                    key={org.id}
                    className="bg-blue-50 px-2 py-1 rounded-lg mr-2 mb-2 border border-blue-100"
                  >
                    <Text className="text-xs text-blue-700 font-JakartaMedium">{org.name}</Text>
                  </View>
                ))}
                {paper.organizations.length > 2 && (
                  <View className="bg-blue-50 px-2 py-1 rounded-lg mr-2 mb-2 border border-blue-100">
                    <Text className="text-xs text-blue-700 font-JakartaMedium">+{paper.organizations.length - 2} more</Text>
                  </View>
                )}
              </View>
            )}

            {/* Reading Progress (if enabled) */}
            {showReadingProgress && paper.current_page && (
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-gray-600 font-JakartaMedium">Reading Progress</Text>
                  <Text className="text-xs text-gray-600 font-JakartaMedium">Page {paper.current_page}</Text>
                </View>
                <View className="w-full bg-gray-200 rounded-full h-1">
                  <View 
                    className="bg-blue-500 h-1 rounded-full" 
                    style={{ width: `${Math.min((paper.current_page / 10) * 100, 100)}%` }}
                  />
                </View>
              </View>
            )}

            {/* Save indicator */}
            <View className="flex-row items-center justify-end mt-2">
              {isSaving ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <View className="flex-row items-center bg-gray-50 px-3 py-1 rounded-full">
                  <Icon 
                    name={isSaved ? "bookmark" : "bookmark-o"} 
                    size={14} 
                    color={isSaved ? "#2563eb" : "#666"} 
                  />
                  <Text className="text-xs text-gray-600 ml-1 font-JakartaMedium">
                    {isSaved ? "Saved" : "Long press to save"}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </TouchableOpacity>

      <PaperDetailModal
        paper={fullPaper}
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        userData={userData}
      />
    </View>
  );
});

export default PaperCard; 