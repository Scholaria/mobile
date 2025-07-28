import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface Organization {
  id: number;
  name: string;
  bio?: string;
  website?: string;
  pfp?: string;
}

interface OrgCardsProps {
  organizations: Organization[];
  onOrganizationPress: (organization: Organization, fromSearch?: boolean) => void;
}

const { width } = Dimensions.get('window');
const cardWidth = width - 32; // Full width minus padding

const OrgCards: React.FC<OrgCardsProps> = React.memo(({ organizations, onOrganizationPress }) => {
  const getInitials = React.useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const renderOrganizationCard = React.useCallback((organization: Organization) => (
    <TouchableOpacity
      key={organization.id}
      style={styles.card}
      onPress={() => onOrganizationPress(organization)}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {organization.pfp ? (
              <Image
                source={{ uri: organization.pfp }}
                style={styles.avatarImage}
                resizeMode="cover"
                fadeDuration={300}
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
          
          {/* Status indicator */}
          <View style={styles.statusIndicator}>
            <Icon name="circle" size={8} color="#10B981" />
          </View>
        </View>
        
        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.headerRow}>
            <Text style={styles.organizationName} numberOfLines={1}>
              {organization.name}
            </Text>
            <View style={styles.actionButton}>
              <Icon name="chevron-right" size={14} color="#9CA3AF" />
            </View>
          </View>
          
          {organization.bio && (
            <Text style={styles.organizationBio} numberOfLines={2}>
              {organization.bio}
            </Text>
          )}
          
          {/* Footer with website and stats */}
          <View style={styles.footerRow}>
            {organization.website && (
              <View style={styles.websiteContainer}>
                <Icon name="globe" size={12} color="#6B7280" />
                <Text style={styles.websiteText} numberOfLines={1}>
                  {organization.website.replace(/^https?:\/\//, '')}
                </Text>
              </View>
            )}
            
            <View style={styles.statsContainer}>
              <Icon name="users" size={12} color="#6B7280" />
              <Text style={styles.statsText}>Research Group</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Gradient overlay for depth */}
      <View style={styles.gradientOverlay} />
    </TouchableOpacity>
  ), [getInitials, onOrganizationPress]);

  return (
    <View style={styles.container}>
      {organizations.map(renderOrganizationCard)}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1F2937',
    borderRadius: 6,
    padding: 2,
  },
  contentSection: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 56,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  organizationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans-Bold',
    flex: 1,
    marginRight: 8,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizationBio: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  websiteText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
});

export default OrgCards;
