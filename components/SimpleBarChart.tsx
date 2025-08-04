import React from 'react';
import { View, Text } from 'react-native';

interface BarChartProps {
  data: Array<{
    label: string;
    value: number | string;
    color: string;
  }>;
  maxValue?: number;
  height?: number;
}

const SimpleBarChart: React.FC<BarChartProps> = ({ 
  data, 
  maxValue, 
  height = 120 
}) => {
  const max = maxValue || Math.max(...data.map(d => parseFloat(String(d.value)) || 0));

  return (
    <View className="bg-primary-700 rounded-xl p-2">
      <View style={{ height }}>
        {data.map((item, index) => (
          <View key={index} className="flex-row items-end mb-1">
            <View className="flex-1 mr-2">
              <View 
                className="rounded-sm"
                style={{
                  backgroundColor: item.color,
                  height: Math.max((parseFloat(String(item.value)) / max) * (height - 30), 4),
                  minHeight: 4
                }}
              />
            </View>
            <View className="items-center min-w-[50px]">
              <Text className="text-xs text-gray-300 font-JakartaMedium text-center" numberOfLines={1}>{item.label}</Text>
              <Text className="text-xs text-gray-400">{parseFloat(String(item.value)).toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default SimpleBarChart; 