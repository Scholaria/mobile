import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text, Dimensions, StyleSheet, StatusBar } from 'react-native';
import Pdf from 'react-native-pdf';
import { icons } from '@/constants';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PDFViewerProps {
  uri: string;
  onClose: () => void;
}

const PDFViewer = ({ uri, onClose }: PDFViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <SafeAreaView >
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image source={icons.backArrow} style={styles.backIcon} tintColor="black" />
        </TouchableOpacity>
        <Text style={styles.title}>PDF Viewer</Text>
        <View style={styles.spacer} />
      </View>
      <Text>test</Text>
      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      )}

      {/* PDF Viewer */}
      <Pdf
        source={{ uri }}
        style={[
          styles.pdf,
          { opacity: isLoading ? 0 : 1 }
        ]}
        onLoadComplete={(numberOfPages, filePath) => {
          console.log(`Number of pages: ${numberOfPages}`);
          setIsLoading(false);
        }}
        onError={(error) => {
          console.log('PDF Error:', error);
          setError('Failed to load PDF. Please try again later.');
          setIsLoading(false);
        }}
        onLoadProgress={(percent) => {
          console.log(`Loading: ${percent}%`);
        }}
        enablePaging={true}
        horizontal={false}
        spacing={10}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
  },
  spacer: {
    width: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

export default PDFViewer; 