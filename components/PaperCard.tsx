import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import PaperDetailModal from './PaperDetailModal';
import { useUser } from '@clerk/clerk-expo';
import { fetchAPI } from '@/lib/fetch';

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
}

const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  onPress,
  showSummary = true,
  showKeywords = true,
  showOrganizations = true,
  showReadingProgress = false,
  className = "",
  userData,
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

  // Format the published date
  const publishedDate = paper.published
    ? new Date(paper.published).toLocaleDateString()
    : "Unknown date";

  // Join authors array into a comma-separated string
  const authors = Array.isArray(paper.authors)
    ? paper.authors.map((author: Author) => author.name).join(", ")
    : "Unknown authors";

  // Truncate summary if too long
  const summaryPreview =
    paper.summary && paper.summary.length > 200
      ? paper.summary.slice(0, 200) + "…"
      : paper.summary;

  const handleSave = async () => {
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
  };

  const handlePress = async () => {
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
  };

  return (
    <View className={`mx-4 ${className}`}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleSave}
        delayLongPress={500}
        className="bg-white rounded-2xl p-4 mb-4 shadow-md"
      >
        {isLoading ? (
          <View className="items-center justify-center py-4">
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <>
            {/* Title */}
            <Text className="text-lg font-JakartaBold text-gray-900 mb-1">
              {paper.title}
            </Text>

            {/* Subtitle row: category tag + published date */}
            <View className="flex-row items-center mb-2">
              {paper.category && (
                <View className="bg-blue-200 px-2 py-1 rounded-full mr-2">
                  <Text className="text-xs text-blue-800">{paper.category}</Text>
                </View>
              )}
              <Text className="text-xs text-gray-600">{publishedDate}</Text>
            </View>

            {/* Authors */}
            <Text className="text-sm text-gray-700 mb-2" numberOfLines={2}>
              {authors}
            </Text>

            {/* Summary preview (if enabled) */}
            {showSummary && summaryPreview && (
              <Text className="text-sm text-gray-800 mb-2">{summaryPreview}</Text>
            )}

            {/* Keywords (if enabled) */}
            {showKeywords && Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
              <View className="flex-wrap flex-row">
                {paper.keywords.map((kw: string, idx: number) => (
                  <View
                    key={idx}
                    className="bg-gray-200 px-2 py-0.5 rounded-xl mr-2 mb-2"
                  >
                    <Text className="text-xs text-gray-700">{kw}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Organizations (if enabled) */}
            {showOrganizations && Array.isArray(paper.organizations) && paper.organizations.length > 0 && (
              <View className="flex-wrap flex-row mt-1">
                {paper.organizations.slice(0, 5).map((org: Organization, idx: number) => (
                  <View
                    key={idx}
                    className="bg-green-200 px-2 py-0.5 rounded-xl mr-2 mb-1"
                  >
                    <Text className="text-xs text-green-800">{org.name}</Text>
                  </View>
                ))}
                {paper.organizations.length > 5 && (
                  <View className="bg-green-100 px-2 py-0.5 rounded-xl mr-2 mb-1">
                    <Text className="text-xs text-green-700">
                      +{paper.organizations.length - 5} more
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Reading Progress (if enabled) */}
            {showReadingProgress && paper.current_page && (
              <View className="flex-row items-center mt-2">
                <Icon name="bookmark" size={14} color="#666" />
                <Text className="text-xs text-gray-600 ml-1">
                  Page {paper.current_page}
                </Text>
              </View>
            )}

            {/* Save indicator */}
            <View className="flex-row items-center justify-end mt-2">
              {isSaving ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <View className="flex-row items-center">
                  <Icon 
                    name={isSaved ? "bookmark" : "bookmark-o"} 
                    size={16} 
                    color={isSaved ? "#2563eb" : "#666"} 
                  />
                  <Text className="text-xs text-gray-600 ml-1">
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
};

export default PaperCard; 