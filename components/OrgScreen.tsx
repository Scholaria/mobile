import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useUser } from '@clerk/clerk-expo';
import { fetchAPI } from '@/lib/fetch';
import AuthorModal from './authorModel';

interface Organization {
  id: number;
  name: string;
  bio?: string;
  website?: string;
  pfp?: string;
}

interface Author {
  id: number;
  name: string;
  bio?: string;
  info?: string;
  paper_count: number;
}

interface Paper {
  paper_id: string;
  title: string;
  abstract: string;
  published: string;
  authors: Author[];
  categories: any[];
  organizations: Organization[];
}

interface OrgScreenProps {
  organization: Organization;
  userData: any;
  onClose: () => void;
  onFollowChange?: () => void;
}

const { width } = Dimensions.get('window');

const OrgScreen: React.FC<OrgScreenProps> = ({ organization, userData, onClose, onFollowChange }) => {
  const [orgData, setOrgData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const [showAuthorModal, setShowAuthorModal] = React.useState(false);
  const [selectedAuthor, setSelectedAuthor] = React.useState<Author | null>(null);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = React.useState(false);
  const [pushNotificationLoading, setPushNotificationLoading] = React.useState(false);
  const { user } = useUser();

  React.useEffect(() => {
    fetchOrganizationData();
    checkFollowStatus();
    checkPushNotificationStatus();
  }, [organization]);

  // Re-check follow status when userData changes
  React.useEffect(() => {
    checkFollowStatus();
    checkPushNotificationStatus();
  }, [userData]);

  const fetchOrganizationData = async () => {
    setLoading(true);
    try {
      const [orgDetails, orgAuthors, orgPapers] = await Promise.all([
        fetchAPI(`/organization/${organization.id}`),
        fetchAPI(`/organization/${organization.id}/authors`),
        fetchAPI(`/organization/${organization.id}/papers?limit=5`)
      ]);

      setOrgData({
        ...organization,
        authors: orgAuthors?.data || [],
        recentPapers: orgPapers?.data || [],
        bio: orgDetails?.data?.bio || organization.bio || 'No description available.',
        website: orgDetails?.data?.website || organization.website
      });
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setOrgData({
        ...organization,
        authors: [],
        recentPapers: [],
        bio: organization.bio || 'No description available.'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = () => {
    if (userData?.followed_organizations && Array.isArray(userData.followed_organizations)) {
      const isAlreadyFollowing = userData.followed_organizations.some(
        (org: Organization) => org.id === organization.id
      );
      setIsFollowing(isAlreadyFollowing);
    } else {
      // If userData is not available or followed_organizations is not an array, default to false
      setIsFollowing(false);
    }
  };

  const checkPushNotificationStatus = () => {
    // Check if user has push notifications enabled for this organization
    if (userData?.followed_organizations && Array.isArray(userData.followed_organizations)) {
      const followedOrg = userData.followed_organizations.find(
        (org: any) => org.id === organization.id
      );
      setPushNotificationsEnabled(followedOrg?.push_notification || false);
    } else {
      setPushNotificationsEnabled(false);
    }
  };

  const handleTogglePushNotifications = async () => {
    if (!user?.id || !isFollowing) return;
    
    setPushNotificationLoading(true);
    try {
      const newStatus = !pushNotificationsEnabled;
      const response = await fetchAPI(`/user/${user.id}/organization/push-notification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationId: organization.id,
          pushNotification: newStatus 
        }),
      });
      
      if (response) {
        setPushNotificationsEnabled(newStatus);
        // Call the callback to refresh user data in parent component
        if (onFollowChange) {
          onFollowChange();
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
    } finally {
      setPushNotificationLoading(false);
    }
  };

  const handleFollow = async (pushNotification = false) => {
    if (!user?.id) return;
    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'PATCH';
      const response = await fetchAPI(`/user/${user.id}/organization`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationId: organization.id,
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
        // Call the callback to refresh user data in parent component
        if (onFollowChange) {
          onFollowChange();
        }
      }
    } catch (error: any) {
      console.error('Error toggling organization follow:', error);
      
      // Handle duplicate key error - user is already following
      if (error.message && error.message.includes('duplicate key')) {
        // console.log('User is already following this organization, updating UI state');
        setIsFollowing(true);
        // Don't set push notification status here, let the user data refresh handle it
        // Call the callback to refresh user data in parent component
        if (onFollowChange) {
          onFollowChange();
        }
      } else {
        // For other errors, revert the state
        setIsFollowing(isFollowing);
      }
    } finally {
      setFollowLoading(false);
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


  const handleWebsitePress = () => {
    if (orgData?.website) {
      Linking.openURL(orgData.website);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAuthorPress = (author: Author) => {
    setSelectedAuthor(author);
    setShowAuthorModal(true);
  };

  const handleAuthorModalClose = () => {
    setShowAuthorModal(false);
    setSelectedAuthor(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading organization details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Author Modal */}
      <AuthorModal
        visible={showAuthorModal}
        onClose={handleAuthorModalClose}
        author={selectedAuthor}
        userData={userData}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="times" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {organization.pfp ? (
              <Image
                source={{ uri: organization.pfp }}
                style={styles.avatarImage}
                onError={() => {
                  // Fallback to initials if image fails to load
                }}
              />
            ) : (
              <Text style={styles.avatarText}>
                {getInitials(organization.name)}
              </Text>
            )}
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.organizationName}>{organization.name}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleFollowPress}
                disabled={followLoading}
                style={[styles.followButton, isFollowing && styles.followingButton]}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? "#666" : "white"} />
                ) : (
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
              
              {isFollowing && (
                <TouchableOpacity
                  onPress={handleTogglePushNotifications}
                  disabled={pushNotificationLoading}
                  style={[styles.pushNotificationButton, pushNotificationsEnabled && styles.pushNotificationEnabled]}
                >
                  {pushNotificationLoading ? (
                    <ActivityIndicator size="small" color={pushNotificationsEnabled ? "#666" : "white"} />
                  ) : (
                    <>
                                  <Icon 
              name={pushNotificationsEnabled ? "bell" : "bell-slash"} 
              size={14} 
              color={pushNotificationsEnabled ? "#9CA3AF" : "white"} 
              style={{ marginRight: 4 }}
            />
                      <Text style={[styles.pushNotificationText, pushNotificationsEnabled && styles.pushNotificationEnabledText]}>
                        {pushNotificationsEnabled ? 'Notifications On' : 'Notifications Off'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Bio Section */}
      {orgData?.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{orgData.bio}</Text>
        </View>
      )}

      {/* Website Section */}
      {orgData?.website && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Website</Text>
          <TouchableOpacity onPress={handleWebsitePress} style={styles.websiteButton}>
            <Icon name="globe" size={16} color="#3B82F6" />
            <Text style={styles.websiteText}>
              {orgData.website.replace(/^https?:\/\//, '')}
            </Text>
            <Icon name="external-link" size={12} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      )}

      {/* Authors Section */}
      {orgData?.authors && orgData.authors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Researchers ({orgData.authors.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.authorsContainer}>
            {orgData.authors.slice(0, 10).map((author: Author) => (
              <TouchableOpacity 
                key={author.id} 
                style={styles.authorCard}
                onPress={() => handleAuthorPress(author)}
              >
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorInitials}>
                    {getInitials(author.name)}
                  </Text>
                </View>
                <Text style={styles.authorName} numberOfLines={1}>
                  {author.name}
                </Text>
                <Text style={styles.authorPapers}>
                  {author.paper_count} papers
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Papers Section */}
      {orgData?.recentPapers && orgData.recentPapers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Papers</Text>
          {orgData.recentPapers.map((paper: Paper) => (
            <View key={paper.paper_id} style={styles.paperCard}>
              <Text style={styles.paperTitle} numberOfLines={2}>
                {paper.title}
              </Text>
              <Text style={styles.paperAuthors} numberOfLines={1}>
                {paper.authors?.map(author => author.name).join(', ')}
              </Text>
              <Text style={styles.paperDate}>
                {new Date(paper.published).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {(!orgData?.authors || orgData.authors.length === 0) && 
       (!orgData?.recentPapers || orgData.recentPapers.length === 0) && (
        <View style={styles.emptyState}>
          <Icon name="building" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No additional information available</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  header: {
    backgroundColor: '#374151',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  organizationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  followButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  followingButton: {
    backgroundColor: '#4B5563',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#9CA3AF',
  },
  pushNotificationButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pushNotificationEnabled: {
    backgroundColor: '#4B5563',
  },
  pushNotificationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  pushNotificationEnabledText: {
    color: '#9CA3AF',
  },
  section: {
    backgroundColor: '#374151',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  websiteText: {
    fontSize: 16,
    color: '#3B82F6',
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
  },
  authorsContainer: {
    marginTop: 8,
  },
  authorCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorInitials: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
  },
  authorPapers: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#374151',
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  paperCard: {
    backgroundColor: '#374151',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 20,
  },
  paperAuthors: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  paperDate: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default OrgScreen;
