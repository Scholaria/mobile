import React from 'react';
import { View } from 'react-native';

interface AnalyticsIconProps {
  type: 'papers' | 'engagement' | 'avg' | 'percentage' | 'authors' | 'organizations';
  size?: number;
}

const AnalyticsIcon: React.FC<AnalyticsIconProps> = ({ type, size = 24 }) => {
  const getIconPath = () => {
    switch (type) {
      case 'papers':
        return (
          <View 
            style={{ width: size, height: size }}
            className="bg-white/20 rounded-lg items-center justify-center"
          >
            <View className="w-3 h-4 bg-white rounded-sm" />
          </View>
        );
      case 'engagement':
        return (
          <View 
            style={{ width: size, height: size }}
            className="bg-white/20 rounded-lg items-center justify-center"
          >
            <View className="w-3 h-3 bg-white rounded-full" />
          </View>
        );
      case 'avg':
        return (
          <View 
            style={{ width: size, height: size }}
            className="bg-white/20 rounded-lg items-center justify-center"
          >
            <View className="w-3 h-2 bg-white rounded-sm" />
          </View>
        );
      case 'percentage':
        return (
          <View 
            style={{ width: size, height: size }}
            className="bg-white/20 rounded-lg items-center justify-center"
          >
            <View className="w-3 h-3 bg-white rounded-full" />
            <View className="absolute w-1 h-1 bg-white rounded-full" />
          </View>
        );
      case 'authors':
        return (
          <View 
            style={{ width: size, height: size }}
            className="bg-white/20 rounded-lg items-center justify-center"
          >
            <View className="w-2 h-2 bg-white rounded-full" />
            <View className="w-2 h-2 bg-white rounded-full mt-1" />
          </View>
        );
      case 'organizations':
        return (
          <View 
            style={{ width: size, height: size }}
            className="bg-white/20 rounded-lg items-center justify-center"
          >
            <View className="w-3 h-2 bg-white rounded-sm" />
            <View className="w-2 h-1 bg-white rounded-sm mt-1" />
          </View>
        );
      default:
        return null;
    }
  };

  return getIconPath();
};

export default AnalyticsIcon; 