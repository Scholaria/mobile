import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text, Dimensions, StyleSheet, StatusBar } from 'react-native';
import Pdf from 'react-native-pdf';
import { icons } from '@/constants';
import { Image } from 'react-native';
import { fetchAPI } from '@/lib/fetch';

interface PDFViewerProps {
  uri: string;
  onClose: () => void;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  paperId: string;
  userData: any;
  paperTitle?: string;
}

const PDFViewer = ({ uri, onClose, initialPage = 1, onPageChange, paperId, userData, paperTitle }: PDFViewerProps) => { 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  };

  const handleClose = () => {
    if (userData?.clerk_id) {
      fetchAPI(`/user/${userData.clerk_id}/reading-progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          currentPage: currentPage,
          paperId: paperId
        })
      })
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.log(err);
      });
    }
    onClose();
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content"/>
      
      {/* Header with manual padding for status bar */}
      <View className="pt-12 flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity 
          onPress={handleClose}
          className="p-2"
        >
          <Image source={icons.backArrow} className="w-6 h-6" tintColor="black" />
        </TouchableOpacity>
        <Text className="text-black text-lg font-JakartaBold flex-1 text-center mx-2" numberOfLines={2} ellipsizeMode="tail">
          {paperTitle || 'Viewer'}
        </Text>
        <View className="w-10" />
      </View>

      {/* Loading State */}
      {isLoading && (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}

      {/* Error State */}
      {error && (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 text-lg font-JakartaBold">{error}</Text>
        </View>
      )}

      {/* PDF Viewer */}
      <View className="flex-1">
        <Pdf
          source={{ uri: uri }}
          style={styles.pdf}
          onLoadComplete={(numberOfPages, filePath) => {
            setIsLoading(false);
          }}
          onError={(error) => {
            console.log('PDF Error:', error);
            setError('Failed to load PDF. Please try again later.');
            setIsLoading(false);
          }}
          onPageChanged={(page) => handlePageChange(page)}
          page={currentPage}
          enablePaging={true}
          horizontal={false}
          spacing={10}
          enableRTL={false}
          enableAnnotationRendering={true}
          fitPolicy={0}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#f5f5f5',
  },
});

export default PDFViewer;