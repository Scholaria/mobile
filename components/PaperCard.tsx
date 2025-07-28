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
  onRemove?: () => void;
  showSummary?: boolean;
  showKeywords?: boolean;
  showOrganizations?: boolean;
  showReadingProgress?: boolean;
  className?: string;
  userData?: any;
  isNew?: boolean;
  disableTouch?: boolean;
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
  disableTouch = false,
}) => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fullPaper, setFullPaper] = React.useState(paper);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const { user } = useUser();

  // Check if paper is already saved - always check from userData
  React.useEffect(() => {
    if (userData && paper) {
      const saved = userData.saves?.some((p: any) => p.paper_id === paper.paper_id) || false;
      setIsSaved(saved);
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
        // Update local state
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
        onPress={disableTouch ? undefined : handlePress}
        onLongPress={disableTouch ? undefined : handleSave}
        delayLongPress={500}
        className="bg-primary-700 rounded-3xl p-6 mb-5"
        style={{
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 8,
          borderWidth: 0.5,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
        activeOpacity={disableTouch ? 1 : 0.92}
        disabled={disableTouch}
      >
        {isLoading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <>
            {/* New Paper Badge */}
            {isNew && (
              <View className="absolute top-4 right-4 z-10">
                <View className="bg-red-500 px-3 py-1.5 rounded-full shadow-sm">
                  <Text className="text-xs text-white font-JakartaBold tracking-wide">NEW</Text>
                </View>
              </View>
            )}

            {/* Category and Date Row */}
            <View className="flex-row items-center justify-between mb-4">
              {paper.category && (
                <View className="bg-secondary-100 px-4 py-2 rounded-full border border-secondary-200">
                  <Text className="text-xs text-secondary-800 font-JakartaSemiBold tracking-wide">
                    {getCategoryDisplayName(paper.category)}
                  </Text>
                </View>
              )}
              <Text className="text-xs text-gray-300 font-JakartaMedium">{publishedDate}</Text>
            </View>

            {/* Title */}
            <Text className="text-xl font-JakartaBold text-white mb-3 leading-7 tracking-tight">
              {paper.title}
            </Text>

            {/* Authors */}
            <Text className="text-sm text-gray-300 mb-4 leading-5 font-JakartaMedium" numberOfLines={1}>
              {authors}
            </Text>

            {/* Summary preview (if enabled) */}
            {showSummary && summaryPreview && (
              <Text
                className="text-base text-gray-200 mb-5 leading-6 font-JakartaMedium"
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {summaryPreview}
              </Text>
            )}

            {/* Keywords (if enabled) */}
            {showKeywords && Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
              <View className="flex-wrap flex-row mb-4">
                {paper.keywords.slice(0, 3).map((kw: string, idx: number) => (
                  <View
                    key={idx}
                    className="bg-primary-600 px-3 py-1.5 rounded-full mr-2 mb-2 border border-primary-500"
                  >
                    <Text className="text-xs text-gray-200 font-JakartaMedium">{kw}</Text>
                  </View>
                ))}
                {paper.keywords.length > 3 && (
                  <View className="bg-primary-600 px-3 py-1.5 rounded-full mr-2 mb-2 border border-primary-500">
                    <Text className="text-xs text-gray-200 font-JakartaMedium">+{paper.keywords.length - 3} more</Text>
                  </View>
                )}
              </View>
            )}

            {/* Organizations (if enabled) */}
            {showOrganizations && Array.isArray(paper.organizations) && paper.organizations.length > 0 && (
              <View className="flex-wrap flex-row mb-4">
                {paper.organizations.slice(0, 2).map((org: any, idx: number) => (
                  <View
                    key={org.id}
                    className="bg-secondary-100 px-3 py-1.5 rounded-full mr-2 mb-2 border border-secondary-200"
                  >
                    <Text className="text-xs text-secondary-700 font-JakartaMedium">{org.name}</Text>
                  </View>
                ))}
                {paper.organizations.length > 2 && (
                  <View className="bg-secondary-100 px-3 py-1.5 rounded-full mr-2 mb-2 border border-secondary-200">
                    <Text className="text-xs text-secondary-700 font-JakartaMedium">+{paper.organizations.length - 2} more</Text>
                  </View>
                )}
              </View>
            )}

            {/* Reading Progress (if enabled) */}
            {showReadingProgress && paper.current_page && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs text-gray-300 font-JakartaMedium">Reading Progress</Text>
                  <Text className="text-xs text-gray-300 font-JakartaMedium">Page {paper.current_page}</Text>
                </View>
                <View className="w-full bg-primary-600 rounded-full h-1.5">
                  <View 
                    className="bg-secondary-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min((paper.current_page / 10) * 100, 100)}%` }}
                  />
                </View>
              </View>
            )}

            {/* Save indicator */}
            <View className="flex-row items-center justify-end mt-3">
              {isSaving ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <View className={`flex-row items-center px-4 py-2 rounded-full ${
                  isSaved ? 'bg-secondary-100 border border-secondary-200' : 'bg-primary-600 border border-primary-500'
                }`}>
                  <Icon 
                    name={isSaved ? "bookmark" : "bookmark-o"} 
                    size={14} 
                    color={isSaved ? "#3B82F6" : "#9CA3AF"} 
                  />
                  <Text className={`text-xs ml-2 font-JakartaMedium ${
                    isSaved ? 'text-secondary-700' : 'text-gray-200'
                  }`}>
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