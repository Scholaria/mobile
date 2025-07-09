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
import { useUser } from '@clerk/clerk-expo';
import { fetchAPI } from '@/lib/fetch';
import { getCategoryDisplayName } from '@/lib/categoryMapping';

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
  info?: any;
}

interface Paper {
  paper_id: string;
  title: string;
  published?: string;
  category?: string;
  authors?: Author[];
}

interface OrganizationModalProps {
  visible: boolean;
  onClose: () => void;
  organization: Organization | null;
  userData: any;
}

const { width } = Dimensions.get('window');

const OrganizationModal = ({
  visible,
  onClose,
  organization,
  userData,
}: OrganizationModalProps) => {
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [orgData, setOrgData] = React.useState<any>(null);
  const [loadingData, setLoadingData] = React.useState(false);
  const { user } = useUser();

  // Fetch organization data when modal becomes visible
  React.useEffect(() => {
    if (visible && organization) {
      fetchOrganizationData();
    }
  }, [visible, organization]);

  // Add effect to check if user is already following the organization
  React.useEffect(() => {
    if (visible && userData?.followed_organizations && organization) {
      const isAlreadyFollowing = userData.followed_organizations.some((org: Organization) => org.id === organization.id);
      setIsFollowing(isAlreadyFollowing);
    }
  }, [visible, organization, userData]);

  // Add cleanup effect
  React.useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      setOrgData(null);
    };
  }, []);

  // Add effect to handle modal visibility
  React.useEffect(() => {
    if (!visible) {
      setOrgData(null);
    }
  }, [visible]);

  const fetchOrganizationData = async () => {
    if (!organization) return;
    
    setLoadingData(true);
    try {
      // Fetch organization details, authors, and recent papers
      const [orgDetails] = await Promise.all([
        fetchAPI(`/organization/${organization.id}`)
      ]);

      setOrgData({
        ...organization,
        authors: orgDetails?.data?.authors || [],
        recentPapers: orgDetails?.data?.recentPapers || [],
        bio: orgDetails?.data?.bio || organization.bio || 'No description available.',
        website: orgDetails?.data?.website || organization.website
      });
    } catch (error) {
      console.error('Error fetching organization data:', error);
      // Fallback to basic organization info
      setOrgData({
        ...organization,
        authors: [],
        recentPapers: [],
        bio: organization.bio || 'No description available.'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleFollow = async (pushNotification = false) => {
    if (!user?.id || !organization) return;
    setLoading(true);
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
      }
    } catch (error) {
      console.error('Error toggling organization follow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowPress = () => {
    if (isFollowing) {
      // If already following, just unfollow
      handleFollow();
    } else {
      handleFollow(true);
    }
  };


  if (!visible || !organization) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <Text style={styles.organizationName}>{organization.name}</Text>
                  {orgData?.website && (
                    <View style={styles.websiteTag}>
                      <Text style={styles.websiteText}>Website</Text>
                    </View>
                  )}
                </View>
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
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Icon name="times" size={24} color="#4b5563" />
                  </TouchableOpacity>
                </View>
              </View>

              {loadingData ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.loadingText}>Loading organization data...</Text>
                </View>
              ) : (
                <>
                  {/* Description */}
                  {orgData?.bio && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>About</Text>
                      <Text style={styles.descriptionText}>{orgData.bio}</Text>
                    </View>
                  )}

                  {/* Recent Papers */}
                  {orgData?.recentPapers && orgData.recentPapers.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Recent Papers</Text>
                      {orgData.recentPapers.map((paper: Paper) => (
                        <View key={paper.paper_id} style={styles.paperItem}>
                          <Text style={styles.paperTitle}>{paper.title}</Text>
                          {paper.authors && paper.authors.length > 0 && (
                            <Text style={styles.paperAuthors}>
                              {paper.authors.map(author => author.name).join(', ')}
                            </Text>
                          )}
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

                  {/* Associated Researchers */}
                  {orgData?.authors && orgData.authors.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Key Researchers</Text>
                      {orgData.authors.slice(0, 5).map((author: Author) => (
                        <View key={author.id} style={styles.researcherItem}>
                          <Text style={styles.researcherName}>{author.name}</Text>
                          {author.bio && (
                            <Text style={styles.researcherBio}>{author.bio}</Text>
                          )}
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
    backgroundColor: 'white',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  organizationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  websiteTag: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  websiteText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
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
    backgroundColor: '#e5e7eb',
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#4b5563',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  paperItem: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  paperAuthors: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  paperMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paperYear: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryTag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#4b5563',
  },
  researcherItem: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  researcherName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  researcherBio: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default OrganizationModal;
