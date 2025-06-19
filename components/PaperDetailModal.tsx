import { icons } from '@/constants';
import { useUser } from '@clerk/clerk-expo';
import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import CategoriesModal from './categoriesModel';
import AuthorModal from './authorModel';
import { fetchAPI } from '@/lib/fetch';
import PDFViewer from './PDFViewer';

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

interface Paper {
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
}

interface PaperDetailModalProps {
  paper: Paper | null;
  visible: boolean;
  onClose: () => void;
  userData?: any;
}

interface AuthorModalProps {
  visible: boolean;
  onClose: () => void;
  author: Author | null;
  userData?: any;
}

const PaperDetailModal = ({ paper, visible, onClose, userData }: PaperDetailModalProps) => {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFollowingCategory, setIsFollowingCategory] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [showPDF, setShowPDF] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);

  const getPDFUrl = (url: string) => {
    if (!url) return null;
    
    // Handle arXiv URLs
    if (url.includes('arxiv.org/abs/')) {
      // Convert from abs to pdf
      return url.replace('arxiv.org/abs/', 'arxiv.org/pdf/') + '.pdf';
    }
    
    // If it's already a PDF URL, return as is
    if (url.endsWith('.pdf')) {
      return url;
    }
    
    return null;
  };

  useEffect(() => {
    if (user?.id && paper?.paper_id) {
      checkLikeAndSaveStatus();
      checkCategoryFollowStatus();
      setLikesCount(paper.likes_count || 0);
      setSaveCount(paper.save_count || 0);
    }
    // console.log(paper)
  }, [user?.id, paper?.paper_id, userData]);

  useEffect(() => {
    return () => {
      setShowCategoryModal(false);
      setShowAuthorModal(false);
      setSelectedAuthor(null);
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setShowCategoryModal(false);
      setShowAuthorModal(false);
      setSelectedAuthor(null);
    }
  }, [visible]);

  const checkLikeAndSaveStatus = () => {
    if (!userData || !paper) return;
    
    // Check if paper is liked using userData
    setIsLiked(userData.likes?.some((p: any) => p.paper_id === paper.paper_id) || false);
    
    // Check if paper is saved using userData
    setIsSaved(userData.saves?.some((p: any) => p.paper_id === paper.paper_id) || false);
  };

  const checkCategoryFollowStatus = () => {
    if (!userData || !paper) return;
    setIsFollowingCategory(userData.followed_categories?.includes(paper.category) || false);
  };

  const handleCategoryPress = () => {
    if (!user?.id || !paper?.category) return;
    setShowCategoryModal(true);
  };

  const handleCategoryConfirm = async () => {
    if (!user?.id || !paper?.category) return;
    try {
      const method = isFollowingCategory ? 'DELETE' : 'PATCH';
      const response = await fetchAPI(`/user/${user?.id}/category`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: paper.category }),
      });
      
      if (response) {
        setIsFollowingCategory(!isFollowingCategory);
      }
    } catch (error) {
      console.error('Error toggling category follow:', error);
    } finally {
      setShowCategoryModal(false);
    }
  };

  const handleAuthorPress = (author: Author) => {
    setSelectedAuthor(author);
    setShowAuthorModal(true);
  };

  const handleLike = async () => {
    if (!user?.id || !paper) return;
    setLoading(true);
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetchAPI(`/user/${user.id}/likes`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.paper_id }),
      });
      if (response) {
        setIsLiked(!isLiked);
        // Update the likes count using state
        setLikesCount(prevCount => prevCount + (isLiked ? -1 : 1));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !paper) return;
    setLoading(true);
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetchAPI(`/user/${user.id}/saves`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.paper_id }),
      });
      if (response) {
        setIsSaved(!isSaved);
        // Update the save count using state
        setSaveCount(prevCount => prevCount + (isSaved ? -1 : 1));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !paper) return null;

  return (
    <>
      <CategoriesModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        category={paper.category || ''}
        isFollowing={isFollowingCategory}
        onConfirm={handleCategoryConfirm}
      />
      
      <AuthorModal
        visible={showAuthorModal}
        onClose={() => {
          setShowAuthorModal(false);
          onClose();
        }}
        author={selectedAuthor}
        userData={userData}
      />

      <Modal
        visible={visible && !showCategoryModal && !showAuthorModal && !showPDF}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <TouchableOpacity onPress={onClose} className="p-2">
                <Image source={icons.backArrow} className="w-6 h-6" tintColor="black" />
              </TouchableOpacity>
              <View className="flex-row space-x-4">
                <View className="items-center">
                  <TouchableOpacity onPress={handleLike} disabled={loading} className="p-2">
                    {isLiked ? <Icon name="heart" size={24} color="black" /> : <Icon name="heart-o" size={24} color="black" />}
                  </TouchableOpacity>
                  <Text className="text-xs text-gray-600">{likesCount}</Text>
                </View>
                <View className="items-center">
                  <TouchableOpacity onPress={handleSave} disabled={loading} className="p-2">
                    {isSaved ? <Icon name="bookmark" size={24} color="black" /> : <Icon name="bookmark-o" size={24} color="black" />}
                  </TouchableOpacity>
                  <Text className="text-xs text-gray-600">{saveCount}</Text>
                </View>
              </View>
            </View>

            {/* Content */}
            <ScrollView className="flex-1 p-4">
              <Text className="text-2xl font-JakartaBold text-gray-900 mb-2">
                {paper.title}
              </Text>

              {/* Authors and Date */}
              <View className="flex-row items-center mb-4">
                <TouchableOpacity 
                  onPress={handleCategoryPress}
                  className="bg-blue-200 px-2 py-1 rounded-full mr-2"
                >
                  <View className="flex-row items-center">
                    <Text className="text-xs text-blue-800">{paper.category || 'Uncategorized'}</Text>
                    {isFollowingCategory && (
                      <Icon name="check" size={12} color="#1e40af" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                </TouchableOpacity>
                <Text className="text-xs text-gray-600">
                  {paper.published ? new Date(paper.published).toLocaleDateString() : 'No date'}
                </Text>
              </View>

              <View className="flex-row flex-wrap mb-4">
                {Array.isArray(paper.authors) && paper.authors.length > 0 ? (
                  paper.authors.map((author: Author, index: number) => (
                    <TouchableOpacity
                      key={author.id}
                      onPress={() => handleAuthorPress(author)}
                      className="mr-2 mb-2"
                    >
                      <Text className="text-base text-blue-600">
                        {author.name}{index < paper.authors!.length - 1 ? ',' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text className="text-base text-gray-600">Unknown authors</Text>
                )}
              </View>

              {/* Abstract */}
              <View className="mb-6">
                <Text className="text-lg font-JakartaBold text-gray-900 mb-2">
                  Abstract
                </Text>
                <Text className="text-base text-gray-700 leading-6">
                  {paper.abstract}
                </Text>
              </View>

              {/* Summary */}
              {paper.summary && (
                <View className="mb-6">
                  <Text className="text-lg font-JakartaBold text-gray-900 mb-2">
                    Summary
                  </Text>
                  <Text className="text-base text-gray-700 leading-6">
                    {paper.summary}
                  </Text>
                </View>
              )}

              {/* Keywords */}
              {Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-JakartaBold text-gray-900 mb-2">
                    Keywords
                  </Text>
                  <View className="flex-row flex-wrap">
                    {paper.keywords.map((keyword: string, index: number) => (
                      <View
                        key={index}
                        className="bg-gray-200 px-3 py-1 rounded-full mr-2 mb-2"
                      >
                        <Text className="text-sm text-gray-700">{keyword}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Organizations */}
              {Array.isArray(paper.organizations) && paper.organizations.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-JakartaBold text-gray-900 mb-2">
                    Organizations
                  </Text>
                  <View className="flex-row flex-wrap">
                    {paper.organizations.map((org: Organization) => (
                      <View
                        key={org.id}
                        className="bg-green-200 px-3 py-1 rounded-full mr-2 mb-2"
                      >
                        <Text className="text-sm text-green-800">{org.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Link to paper */}
              <TouchableOpacity
                onPress={() => {
                  const pdfUrl = paper.link ? getPDFUrl(paper.link) : null;
                  if (pdfUrl) {
                    setShowPDF(true);
                  } else {
                    Alert.alert('Error', 'No PDF link available for this paper');
                  }
                }}
                className="bg-blue-500 p-4 rounded-xl mb-6"
              >
                <Text className="text-white text-center font-JakartaBold">
                  View Full Paper
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPDF}
        animationType="slide"
        onRequestClose={() => setShowPDF(false)}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          <PDFViewer
            paperId={paper.paper_id}
            userData={userData}
            uri={paper.link ? getPDFUrl(paper.link) || '' : ''}
            onClose={() => setShowPDF(false)}
            paperTitle={paper.title}
          />
        </View>
      </Modal>
    </>
  );
};

export default PaperDetailModal; 