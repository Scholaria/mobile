import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  gradient: string[];
  onPress?: () => void;
  icon?: React.ReactNode;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtitle,
  gradient,
  onPress,
  icon
}) => {
  const CardContent = () => (
    <View 
      className="flex-1 mx-1 p-4 rounded-2xl"
      style={{ backgroundColor: gradient[0] }}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-2xl font-JakartaBold text-white mb-1">{value}</Text>
          <Text className="text-sm font-JakartaMedium text-white/90">{title}</Text>
          <Text className="text-xs text-white/70">{subtitle}</Text>
        </View>
        {icon && (
          <View className="ml-2">
            {icon}
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} className="flex-1">
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

export default AnalyticsCard; 