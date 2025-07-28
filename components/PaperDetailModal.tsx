import { getCategoryDisplayName } from '@/lib/categoryMapping';
import { fetchAPI } from '@/lib/fetch';
import { useUser } from '@clerk/clerk-expo';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';
import AuthorModal from './authorModel';
import CategoriesModal from './categoriesModel';
import KeywordsModal from './keywordsModal';
import OrgScreen from './OrgScreen';
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
  pfp?: string;
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
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [isFollowingKeyword, setIsFollowingKeyword] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [showPDF, setShowPDF] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [showAISummary, setShowAISummary] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showAllOrgs, setShowAllOrgs] = useState(false);

  // Animation values for swipe down
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const { height: screenHeight } = Dimensions.get('window');

  // Create animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const animatedModalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const getPDFUrl = (url: string) => {
    if (!url) return null;
    
    // Ensure URL uses HTTPS
    let secureUrl = url;
    if (url.startsWith('http://')) {
      secureUrl = url.replace('http://', 'https://');
    } else if (!url.startsWith('https://') && !url.startsWith('http://')) {
      // If no protocol specified, assume HTTPS
      secureUrl = `https://${url}`;
    }
    
    // Handle arXiv URLs
    if (secureUrl.includes('arxiv.org/abs/')) {
      // Convert from abs to pdf (without .pdf extension)
      return secureUrl.replace('arxiv.org/abs/', 'arxiv.org/pdf/');
    }
    
    // If it's already a PDF URL, return as is
    if (secureUrl.endsWith('.pdf')) {
      return secureUrl;
    }
    
    // For other URLs, try to append .pdf if it doesn't end with it
    if (!secureUrl.endsWith('.pdf')) {
      return `${secureUrl}.pdf`;
    }
    
    return secureUrl;
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

  // Re-check save status whenever userData changes
  useEffect(() => {
    if (userData && paper) {
      checkLikeAndSaveStatus();
    }
  }, [userData, paper]);

  useEffect(() => {
    return () => {
      setShowCategoryModal(false);
      setShowKeywordsModal(false);
      setSelectedKeyword('');
      setShowAuthorModal(false);
      setSelectedAuthor(null);
      setShowOrgModal(false);
      setSelectedOrganization(null);
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setShowCategoryModal(false);
      setShowKeywordsModal(false);
      setSelectedKeyword('');
      setShowAuthorModal(false);
      setSelectedAuthor(null);
      setShowOrgModal(false);
      setSelectedOrganization(null);
      setShowAllOrgs(false);
    }
  }, [visible]);

  const checkLikeAndSaveStatus = () => {
    if (!userData || !paper) return;
    
    // Check if paper is liked using userData
    setIsLiked(userData.likes?.some((p: any) => p.paper_id === paper.paper_id) || false);
    
    // Check if paper is saved using userData
    const saved = userData.saves?.some((p: any) => p.paper_id === paper.paper_id) || false;
    setIsSaved(saved);
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

  const handleKeywordPress = (keyword: string) => {
    if (!user?.id) return;
    setSelectedKeyword(keyword);
    // Check if user is already following this keyword
    const isFollowing = userData?.followed_keywords?.includes(keyword) || false;
    setIsFollowingKeyword(isFollowing);
    setShowKeywordsModal(true);
  };

  const handleKeywordConfirm = async () => {
    if (!user?.id || !selectedKeyword) return;
    try {
      const method = isFollowingKeyword ? 'DELETE' : 'PATCH';
      const response = await fetchAPI(`/user/${user?.id}/keyword`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: selectedKeyword }),
      });
      
      if (response) {
        setIsFollowingKeyword(!isFollowingKeyword);
      }
    } catch (error) {
      console.error('Error toggling keyword follow:', error);
    } finally {
      setShowKeywordsModal(false);
    }
  };

  const handleAuthorPress = (author: Author) => {
    setSelectedAuthor(author);
    setShowAuthorModal(true);
  };

  const handleOrganizationPress = (organization: Organization) => {
    setSelectedOrganization(organization);
    setShowOrgModal(true);
  };

  const handleCloseOrgModal = () => {
    setShowOrgModal(false);
    setSelectedOrganization(null);
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
        // Update local state
        setIsSaved(!isSaved);
        
        // Update the save count using state
        setSaveCount(prevCount => prevCount + (isSaved ? -1 : 1));
        
        // Update userData if available to sync with PaperCard
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
      setLoading(false);
    }
  };

  // Create PanResponder for swipe down
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to touches at the top of the modal (first 50px)
        const touchY = evt.nativeEvent.pageY;
        const modalTop = 80; // Approximate top of modal (status bar + header)
        return touchY <= modalTop + 50;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to downward gestures at the top of the modal
        const touchY = evt.nativeEvent.pageY;
        const modalTop = 80;
        return touchY <= modalTop + 50 && gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        // Reset position when gesture starts
        translateY.value = 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward movement
        if (gestureState.dy > 0) {
          translateY.value = gestureState.dy;
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dy, vy } = gestureState;
        
        // Only close if it's a deliberate downward swipe with sufficient distance and velocity
        if (dy > 150 && vy > 0.5) {
          // Swipe down threshold met, close modal
          translateY.value = withTiming(screenHeight, { duration: 200 });
          opacity.value = withTiming(0, { duration: 200 }, () => {
            runOnJS(onClose)();
            // Reset animation values
            translateY.value = 0;
            opacity.value = 1;
          });
        } else {
          // Reset to original position
          translateY.value = withTiming(0, { duration: 200 });
          opacity.value = withTiming(1, { duration: 200 });
        }
      },
    })
  ).current;

  // Reset animation when modal becomes visible
  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      opacity.value = 1;
    }
  }, [visible]);

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
      
      <KeywordsModal
        visible={showKeywordsModal}
        onClose={() => setShowKeywordsModal(false)}
        keyword={selectedKeyword}
        isFollowing={isFollowingKeyword}
        onConfirm={handleKeywordConfirm}
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
        visible={showOrgModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedOrganization && (
          <OrgScreen
            organization={selectedOrganization}
            userData={userData}
            onClose={handleCloseOrgModal}
          />
        )}
      </Modal>

      <Modal
        visible={visible && !showCategoryModal && !showKeywordsModal && !showAuthorModal && !showPDF && !showOrgModal}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View 
          className="flex-1 bg-black/50"
          style={animatedContainerStyle}
        >
          <View 
            className="flex-1 mt-20 bg-primary-700 rounded-t-3xl"
            style={animatedModalStyle}
          >
            {/* Swipe indicator and header with PanResponder */}
            <View {...panResponder.panHandlers}>
              {/* Swipe indicator */}
              <View className="items-center pt-2 pb-1">
                <View className="w-10 h-1 bg-primary-600 rounded-full" />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-primary-600">
                <TouchableOpacity onPress={onClose} className="p-2">
                  <Icon name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <View className="flex-row space-x-4">
                  <View className="items-center">
                    <TouchableOpacity onPress={handleLike} disabled={loading} className="p-2">
                      {isLiked ? <Icon name="heart" size={24} color="white" /> : <Icon name="heart-o" size={24} color="white" />}
                    </TouchableOpacity>
                    <Text className="text-xs text-gray-300">{likesCount}</Text>
                  </View>
                  <View className="items-center">
                    <TouchableOpacity onPress={handleSave} disabled={loading} className="p-2">
                      {isSaved ? <Icon name="bookmark" size={24} color="white" /> : <Icon name="bookmark-o" size={24} color="white" />}
                    </TouchableOpacity>
                    <Text className="text-xs text-gray-300">{saveCount}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Content */}
            <ScrollView className="flex-1 p-4">
              <Text className="text-2xl font-JakartaBold text-white mb-2">
                {paper.title}
              </Text>

              {/* Authors and Date */}
              <View className="flex-row items-center mb-4">
                <TouchableOpacity 
                  onPress={handleCategoryPress}
                  className="bg-secondary-100 px-2 py-1 rounded-full mr-2"
                >
                  <View className="flex-row items-center">
                    <Text className="text-xs text-secondary-800">{getCategoryDisplayName(paper.category || 'Uncategorized')}</Text>
                    {isFollowingCategory && (
                      <Icon name="check" size={12} color="#1e40af" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                </TouchableOpacity>
                <Text className="text-xs text-gray-300">
                  {paper.published ? new Date(paper.published).toLocaleDateString() : 'No date'}
                </Text>
              </View>

              <View className="flex-row flex-wrap mb-4">
                {Array.isArray(paper.authors) && paper.authors.length > 0 ? (
                  paper.authors.slice(0, 5).map((author: Author, index: number) => (
                    <TouchableOpacity
                      key={author.id}
                      onPress={() => handleAuthorPress(author)}
                      className="mr-2 mb-2"
                    >
                      <Text className="text-base text-secondary-500">
                        {author.name}{index < Math.min(paper.authors!.length, 5) - 1 ? ',' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text className="text-base text-gray-300">Unknown authors</Text>
                )}
              </View>

              {/* Organizations */}
              {Array.isArray(paper.organizations) && paper.organizations.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-JakartaBold text-white mb-2">
                    Organizations
                  </Text>
                  <View className="flex-row flex-wrap">
                    {paper.organizations
                      .slice(0, showAllOrgs ? paper.organizations.length : 5)
                      .map((org: Organization) => (
                        <TouchableOpacity
                          key={org.id}
                          onPress={() => handleOrganizationPress(org)}
                          className="bg-secondary-100 px-3 py-1 rounded-full mr-2 mb-2"
                          activeOpacity={0.7}
                        >
                          <Text className="text-sm text-secondary-800">{org.name}</Text>
                        </TouchableOpacity>
                      ))}
                    {!showAllOrgs && paper.organizations.length > 5 && (
                      <TouchableOpacity
                        onPress={() => setShowAllOrgs(true)}
                        className="bg-blue-500 px-3 py-1 rounded-full mr-2 mb-2"
                        activeOpacity={0.7}
                      >
                        <Text className="text-sm text-white font-JakartaBold">+{paper.organizations.length - 5}</Text>
                      </TouchableOpacity>
                    )}
                    {showAllOrgs && paper.organizations.length > 5 && (
                      <TouchableOpacity
                        onPress={() => setShowAllOrgs(false)}
                        className="bg-gray-500 px-3 py-1 rounded-full mr-2 mb-2"
                        activeOpacity={0.7}
                      >
                        <Text className="text-sm text-white font-JakartaBold">Show Less</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* AI Summary Toggle Button */}
              {paper.summary && (
                <View className="mb-4">
                  <TouchableOpacity
                    onPress={() => setShowAISummary(!showAISummary)}
                    style={{
                      backgroundColor: '#3b82f6',
                      padding: 12,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="magic" size={20} color="white" style={{ marginRight: 8 }} />
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                        AI Summary
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* AI Summary Content */}
              {showAISummary && paper.summary && (
                <View style={{
                  marginBottom: 24,
                  backgroundColor: '#1e293b', // primary-800
                  borderWidth: 1,
                  borderColor: '#3b82f6', // primary-500
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  elevation: 2,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3b82f6' }}>
                      AI Summary
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, color: '#fff', lineHeight: 24 }}>
                    {paper.summary}
                  </Text>
                </View>
              )}

              {/* Abstract */}
              <View className="mb-6">
                <Text className="text-lg font-JakartaBold text-gray-900 mb-2">
                  Abstract
                </Text>
                <Text className="text-base text-gray-700 leading-6 text-white">
                  {paper.abstract}
                </Text>
              </View>

              {/* Keywords */}
              {Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-JakartaBold text-gray-900 mb-2">
                    Keywords
                  </Text>
                  <View className="flex-row flex-wrap">
                    {paper.keywords.map((keyword: string, index: number) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleKeywordPress(keyword)}
                        className="bg-gray-200 px-3 py-1 rounded-full mr-2 mb-2"
                        activeOpacity={0.7}
                      >
                        <Text className="text-sm text-gray-700">{keyword}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Link to paper */}
              <View className="mb-4">
                <TouchableOpacity
                  onPress={() => {
                    const pdfUrl = paper.link ? getPDFUrl(paper.link) : null;
                    
                    if (pdfUrl) {
                      console.log('Opening PDF URL:', pdfUrl);
                      setShowPDF(true);
                    } else {
                      console.log('No PDF URL available for paper:', paper.paper_id);
                      Alert.alert('Error', 'No PDF link available for this paper');
                    }
                  }}
                  className="bg-blue-500 p-4 rounded-xl"
                >
                  <Text className="text-white text-center font-JakartaBold">
                    View Full Paper
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPDF}
        animationType="slide"
        onRequestClose={() => {
          // console.log('DEBUG: PDF modal close requested');
          setShowPDF(false);
        }}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          <PDFViewer
            paperId={paper.paper_id}
            userData={userData}
            uri={paper.link ? getPDFUrl(paper.link) || '' : ''}
            onClose={() => {
              setShowPDF(false);
            }}
            paperTitle={paper.title}
          />
        </View>
      </Modal>
    </>
  );
};

export default PaperDetailModal; 