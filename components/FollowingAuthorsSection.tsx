import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Author {
  id: number;
  name: string;
  bio?: string;
  info?: any;
  order?: number;
}

interface FollowingAuthorsSectionProps {
  followedAuthors: Author[];
  onAuthorPress: (author: Author) => void;
  visible?: boolean;
}

const { width } = Dimensions.get('window');

const FollowingAuthorsSection: React.FC<FollowingAuthorsSectionProps> = ({
  followedAuthors,
  onAuthorPress,
  visible = true,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(visible);

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation: when 'visible' becomes false, animate both opacity and vertical position
      // - fadeAnim animates from 1 to 0 (fully visible to invisible)
      // - slideAnim animates from 0 to -100 (slides up by 100 units)
      // After both animations finish, set shouldRender to false so the component is removed from the tree
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,           // fade out
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,        // slide up
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Only hide the component after animation completes
        setShouldRender(false);
      });
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!followedAuthors || followedAuthors.length === 0 || !shouldRender) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Following</Text>
        <Text style={styles.subtitle}>{followedAuthors.length} authors</Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {followedAuthors.map((author) => (
          <TouchableOpacity
            key={author.id}
            style={styles.authorCard}
            onPress={() => onAuthorPress(author)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {author.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.authorName} numberOfLines={1}>
              {author.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  authorCard: {
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 80,
    maxWidth: 100,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default FollowingAuthorsSection; 