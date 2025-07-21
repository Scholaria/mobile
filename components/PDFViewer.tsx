import * as React from "react";
import { useState, useEffect } from 'react';
import { View, StatusBar, SafeAreaView, TouchableOpacity, Text, StyleSheet, Dimensions, ActivityIndicator, Linking, Platform } from 'react-native';
import { fetchAPI } from '@/lib/fetch';
import { icons } from '@/constants';
import Icon from 'react-native-vector-icons/FontAwesome';

// Platform-specific PDF import - only import on native platforms
let Pdf: any = null;
let isNativePdfAvailable = false;

if (Platform.OS !== 'web') {
  try {
    Pdf = require('react-native-pdf').default;
    isNativePdfAvailable = true;
  } catch (error) {
    // console.log('react-native-pdf not available, using fallback');
    isNativePdfAvailable = false;
  }
}

interface PDFViewerProps {
  uri: string;
  onClose: () => void;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  paperId: string;
  userData: any;
  paperTitle?: string;
  annotation?: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  uri, 
  initialPage = 1, 
  paperId, 
  paperTitle, 
  annotation = false, 
  userData, 
  onClose,
  onPageChange 
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const pdfRef = React.useRef<any>(null);

  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  };

  const handleClose = async () => {
    if (userData?.clerk_id) {
      try {
        await fetchAPI(`/user/${userData.clerk_id}/reading-progress`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            paperId, 
            currentPage 
          }),
        });
      } catch (err) {
        console.error('Error saving reading progress:', err);
      }
    }
    onClose();
  };

  const handleLoadComplete = (numberOfPages: number) => {
    setTotalPages(numberOfPages);
    setLoading(false);
    // console.log(`PDF loaded successfully: ${numberOfPages} pages`);
  };

  const handleError = (error: any) => {
    console.error('PDF loading error:', error);
    setError('Failed to load PDF. Please check your internet connection and try again.');
    setLoading(false);
  };

  const handlePageChanged = (page: number) => {
    handlePageChange(page);
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale * 1.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale / 1.2, 0.5));
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      pdfRef.current?.setPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const openInBrowser = () => {
    Linking.openURL(uri);
  };

  // Fallback component for when react-native-pdf is not available
  const FallbackPDFViewer = () => (
    <View style={styles.fallbackContainer}>
      <View style={styles.fallbackContent}>
        <Icon name="file-pdf-o" size={64} color="#e74c3c" />
        <Text style={styles.fallbackTitle}>PDF Viewer</Text>
        <Text style={styles.fallbackText}>
          This PDF requires a development build to view natively.
        </Text>
        <Text style={styles.fallbackSubtext}>
          You can open it in your browser instead.
        </Text>
        
        <TouchableOpacity 
          style={styles.fallbackButton}
          onPress={openInBrowser}
        >
          <Icon name="external-link" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.fallbackButtonText}>Open in Browser</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fallbackCloseButton}
          onPress={handleClose}
        >
          <Text style={styles.fallbackCloseButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!Pdf) {
    // console.log('react-native-pdf not available, using fallback');
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          PDF viewer not available. Please install react-native-pdf to view PDFs.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {paperTitle || 'PDF Viewer'}
        </Text>
        <View style={styles.spacer} />
      </View>

      {/* Show fallback if react-native-pdf is not available */}
      {!isNativePdfAvailable ? (
        <FallbackPDFViewer />
      ) : (
        <>
          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="exclamation-triangle" size={48} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  setLoading(true);
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PDF Viewer */}
          {!error && (
            <View style={styles.pdfContainer}>
              <Pdf
                ref={pdfRef}
                source={{ uri }}
                style={styles.pdf}
                onLoadComplete={handleLoadComplete}
                onError={handleError}
                onPageChanged={handlePageChanged}
                page={initialPage}
                scale={scale}
                enablePaging={true}
                enableRTL={false}
                enableAnnotationRendering={annotation}
                trustAllCerts={false}
              />
            </View>
          )}

          {/* Controls */}
          {!error && !loading && (
            <View style={styles.controls}>
              {/* Page Navigation */}
              <View style={styles.pageControls}>
                <TouchableOpacity 
                  onPress={goToPrevPage} 
                  disabled={currentPage <= 1}
                  style={[styles.pageButton, currentPage <= 1 && styles.pageButtonDisabled]}
                >
                  <Icon name="chevron-left" size={20} color={currentPage <= 1 ? "#ccc" : "#007AFF"} />
                </TouchableOpacity>
                
                <Text style={styles.pageInfo}>
                  {currentPage} / {totalPages}
                </Text>
                
                <TouchableOpacity 
                  onPress={goToNextPage} 
                  disabled={currentPage >= totalPages}
                  style={[styles.pageButton, currentPage >= totalPages && styles.pageButtonDisabled]}
                >
                  <Icon name="chevron-right" size={20} color={currentPage >= totalPages ? "#ccc" : "#007AFF"} />
                </TouchableOpacity>
              </View>

              {/* Zoom Controls */}
              <View style={styles.zoomControls}>
                <TouchableOpacity onPress={zoomOut} style={styles.zoomButton}>
                  <Icon name="search-minus" size={20} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
                <TouchableOpacity onPress={zoomIn} style={styles.zoomButton}>
                  <Icon name="search-plus" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
    color: '#000',
  },
  spacer: {
    width: 40,
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    padding: 8,
    borderRadius: 4,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginHorizontal: 16,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomButton: {
    padding: 8,
    borderRadius: 4,
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  // Fallback styles
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  fallbackContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  fallbackText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  fallbackButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  fallbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackCloseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  fallbackCloseButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default PDFViewer;