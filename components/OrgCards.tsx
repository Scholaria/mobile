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
const cardWidth = (width - 48) / 2; // 2 columns with padding

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
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
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
        
        <View style={styles.textContainer}>
          <Text style={styles.organizationName} numberOfLines={2}>
            {organization.name}
          </Text>
          
          {organization.bio && (
            <Text style={styles.organizationBio} numberOfLines={2}>
              {organization.bio}
            </Text>
          )}
          
          {organization.website && (
            <View style={styles.websiteContainer}>
              <Icon name="globe" size={12} color="#666" />
              <Text style={styles.websiteText} numberOfLines={1}>
                {organization.website.replace(/^https?:\/\//, '')}
              </Text>
            </View>
          )}
        </View>
      </View>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    padding: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  textContainer: {
    flex: 1,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  organizationBio: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  websiteText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
});

export default OrgCards;
