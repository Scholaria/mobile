import * as React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import OrganizationModal from './organizationModel';
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

interface Paper {
  paper_id: string;
  title: string;
  published?: string;
  category?: string;
}

interface AuthorModalProps {
  visible: boolean; 
  onClose: () => void;
  author: Author | null;
  userData: any;
}

const { width } = Dimensions.get('window');

const AuthorModal = ({
  visible,
  onClose,
  author,
  userData,
}: AuthorModalProps) => {
  const [showOrgModal, setShowOrgModal] = React.useState(false);
  const [selectedOrg, setSelectedOrg] = React.useState<Organization | null>(null);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [authorData, setAuthorData] = React.useState<any>(null);
  const [loadingData, setLoadingData] = React.useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = React.useState(false);
  const [pushNotificationLoading, setPushNotificationLoading] = React.useState(false);
  const { user } = useUser();

  // Fetch author data when modal becomes visible
  React.useEffect(() => {
    if (visible && author) {
      fetchAuthorData();
    }
  }, [visible, author]);

  // Add effect to check if user is already following the author
  React.useEffect(() => {
    if (visible && userData?.followed_authors && author) {
      const isAlreadyFollowing = userData.followed_authors.some((a: Author) => a.id === author.id);
      setIsFollowing(isAlreadyFollowing);
      checkPushNotificationStatus();
    }
  }, [visible, author, userData]);

  // Add cleanup effect
  React.useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      setShowOrgModal(false);
      setSelectedOrg(null);
      setAuthorData(null);
    };
  }, []);

  // Add effect to handle modal visibility
  React.useEffect(() => {
    if (!visible) {
      setShowOrgModal(false);
      setSelectedOrg(null);
      setAuthorData(null);
    }
  }, [visible]);

  const checkPushNotificationStatus = () => {
    // Check if user has push notifications enabled for this author
    if (userData?.followed_authors && Array.isArray(userData.followed_authors)) {
      const followedAuthor = userData.followed_authors.find(
        (auth: any) => auth.id === author?.id
      );
      setPushNotificationsEnabled(followedAuthor?.push_notification || false);
    } else {
      setPushNotificationsEnabled(false);
    }
  };

  const handleTogglePushNotifications = async () => {
    if (!user?.id || !author || !isFollowing) return;
    
    setPushNotificationLoading(true);
    try {
      const newStatus = !pushNotificationsEnabled;
      const response = await fetchAPI(`/user/${user.id}/author/push-notification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authorId: author.id,
          pushNotification: newStatus 
        }),
      });
      
      if (response) {
        setPushNotificationsEnabled(newStatus);
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
    } finally {
      setPushNotificationLoading(false);
    }
  };

  const fetchAuthorData = async () => {
    if (!author) return;
    
    setLoadingData(true);
    try {
      // Fetch author details, organizations, and recent papers
      const [authorDetails] = await Promise.all([
        fetchAPI(`/author/${author.id}`)
      ]);
      console.log("authorDetails", authorDetails.data.organizations);
      console.log("authorDetails", author);
      setAuthorData({
        ...author,
        organizations: authorDetails?.data?.organizations || [],
        recentPapers: authorDetails?.data?.recentPapers || [],
        bio: authorDetails?.data?.bio || author.bio || 'No biography available.',
        info: authorDetails?.data?.info || author.info
      });
    } catch (error) {
      console.error('Error fetching author data:', error);
      // Fallback to basic author info
      setAuthorData({
        ...author,
        organizations: [],
        recentPapers: [],
        bio: author.bio || 'No biography available.'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleFollow = async (pushNotification = false) => {
    if (!user?.id || !author) return;
    setLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'PATCH';
      const response = await fetchAPI(`/user/${user.id}/author`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authorId: author.id,
          pushNotification: pushNotification 
        }),
      });
      if (response) {
        setIsFollowing(!isFollowing);
        // Update push notification status when following
        if (!isFollowing) {
          setPushNotificationsEnabled(pushNotification);
        } else {
          // When unfollowing, disable push notifications
          setPushNotificationsEnabled(false);
        }
      }
    } catch (error) {
      console.error('Error toggling author follow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowPress = () => {
    if (isFollowing) {
      // If already following, just unfollow
      handleFollow();
    } else {
      // If not following, show notification prompt
      handleFollow(true);
    }
  };


  const handleOrgPress = (org: Organization) => {
    setSelectedOrg(org);
    setShowOrgModal(true);
  };

  if (!visible || !author) return null;

  return (
    <>
      <OrganizationModal
        visible={showOrgModal}
        onClose={() => {
          setShowOrgModal(false);
          onClose();
        }}
        organization={selectedOrg}
        userData={userData}
      />

      <Modal
        visible={visible && !showOrgModal}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.scrollView}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.authorName}>{author.name}</Text>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    onPress={handleFollowPress} 
                    style={[styles.followButton, isFollowing && styles.followingButton]}
                    disabled={loading}
                  >
                    <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                  
                  {isFollowing && (
                    <TouchableOpacity
                      onPress={handleTogglePushNotifications}
                      disabled={pushNotificationLoading}
                      style={[styles.pushNotificationButton, pushNotificationsEnabled && styles.pushNotificationEnabled]}
                    >
                      {pushNotificationLoading ? (
                        <ActivityIndicator size="small" color={pushNotificationsEnabled ? "#9CA3AF" : "white"} />
                      ) : (
                        <>
                          <Icon 
                            name={pushNotificationsEnabled ? "bell" : "bell-slash"} 
                            size={12} 
                            color={pushNotificationsEnabled ? "#9CA3AF" : "white"} 
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[styles.pushNotificationText, pushNotificationsEnabled && styles.pushNotificationEnabledText]}>
                            {pushNotificationsEnabled ? 'On' : 'Off'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Icon name="times" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              {loadingData ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading author data...</Text>
                </View>
              ) : (
                <>
                  {/* Organizations */}
                  {authorData?.organizations && authorData.organizations.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Organizations</Text>
                      <View style={styles.tagContainer}>
                        {authorData.organizations.map((org: Organization) => (
                          <TouchableOpacity
                            key={org.id}
                            style={styles.tag}
                            onPress={() => handleOrgPress(org)}
                          >
                            <Text style={styles.tagText}>{org.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Bio */}
                  {authorData?.bio && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Biography</Text>
                      <Text style={styles.bioText}>{authorData.bio}</Text>
                    </View>
                  )}

                  {/* Recent Papers */}
                  {authorData?.recentPapers && authorData.recentPapers.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Recent Papers</Text>
                      {authorData.recentPapers.map((paper: Paper) => (
                        <View key={paper.paper_id} style={styles.paperItem}>
                          <Text style={styles.paperTitle}>{paper.title}</Text>
                          <View style={styles.paperMeta}>
                            {paper.published && (
                              <Text style={styles.paperYear}>
                                {new Date(paper.published).getFullYear()}
                              </Text>
                            )}
                            {paper.category && (
                              <View style={styles.categoryTag}>
                                <Text style={styles.categoryText}>{getCategoryDisplayName(paper.category)}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: '80%',
    backgroundColor: '#374151',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  followButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#4B5563',
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#9CA3AF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  paperItem: {
    backgroundColor: '#4B5563',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 8,
  },
  paperMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paperYear: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  categoryTag: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  pushNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pushNotificationEnabled: {
    backgroundColor: '#4B5563',
  },
  pushNotificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  pushNotificationEnabledText: {
    color: '#9CA3AF',
  },
});

export default AuthorModal;
