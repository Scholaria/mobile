import React, { useRef, useState } from 'react';
import { View, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/FontAwesome';
import PaperCard from './PaperCard';

interface SwipeablePaperCardProps {
  paper: any;
  onRemove: () => void;
  showSummary?: boolean;
  showKeywords?: boolean;
  showOrganizations?: boolean;
  showReadingProgress?: boolean;
  userData?: any;
  onPress?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;

const SwipeablePaperCard: React.FC<SwipeablePaperCardProps> = ({
  paper,
  onRemove,
  showSummary = false,
  showKeywords = false,
  showOrganizations = false,
  showReadingProgress = true,
  userData,
  onPress,
}) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const backgroundOpacity = useSharedValue(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setIsSwiping)(true);
    },
    onActive: (event) => {
      if (event.translationX < 0) {
        translateX.value = event.translationX;
        // Gradually show background as user swipes
        const progress = Math.min(Math.abs(event.translationX) / Math.abs(SWIPE_THRESHOLD), 1);
        backgroundOpacity.value = progress;
      }
    },
    onEnd: (event) => {
      runOnJS(setIsSwiping)(false);
      if (event.translationX < SWIPE_THRESHOLD) {
        // Swipe threshold reached, remove the item
        translateX.value = withTiming(-screenWidth, { duration: 250 });
        opacity.value = withTiming(0, { duration: 250 }, () => {
          runOnJS(onRemove)();
        });
      } else {
        // Reset position and hide background
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        backgroundOpacity.value = withTiming(0, { duration: 200 });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle}>
        <View className="relative">
          {/* Background delete indicator - only visible when swiping */}
          {isSwiping && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  right: -20,
                  top: -20,
                  bottom: -20,
                  left: -20,
                  backgroundColor: '#ef4444',
                  borderRadius: 24,
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  paddingRight: 40,
                  zIndex: 1,
                },
                backgroundAnimatedStyle,
              ]}
            >
              <View style={{
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Icon name="trash" size={20} color="#ef4444" />
              </View>
            </Animated.View>
          )}
          
          <View style={{ zIndex: 2 }}>
            <PaperCard
              paper={paper}
              showSummary={showSummary}
              showKeywords={showKeywords}
              showOrganizations={showOrganizations}
              showReadingProgress={showReadingProgress}
              userData={userData}
              onPress={onPress}
            />
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

export default SwipeablePaperCard; 