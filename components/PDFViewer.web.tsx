import * as React from "react";
import { useState, useEffect } from 'react';
import { View, StatusBar, SafeAreaView, TouchableOpacity, Text, StyleSheet, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { fetchAPI } from '@/lib/fetch';
import { icons } from '@/constants';
import Icon from 'react-native-vector-icons/FontAwesome';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  const handleClose = async () => {
    if (userData?.clerk_id) {
      try {
        // For web version, we don't have totalPages, so we'll just update normally
        // The backend will handle the final page logic
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

  const openInBrowser = () => {
    Linking.openURL(uri);
  };

  const openInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(uri, '_blank');
    }
  };

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

      {/* Web PDF Viewer */}
      <View style={styles.webContainer}>
        <View style={styles.webContent}>
          <Icon name="file-pdf-o" size={64} color="#e74c3c" />
          <Text style={styles.webTitle}>PDF Viewer</Text>
          <Text style={styles.webText}>
            PDF viewing is not available in the web version of the app.
          </Text>
          <Text style={styles.webSubtext}>
            You can open the PDF in a new tab or download it.
          </Text>
          
          <TouchableOpacity 
            style={styles.webButton}
            onPress={openInNewTab}
          >
            <Icon name="external-link" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.webButtonText}>Open in New Tab</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.webSecondaryButton}
            onPress={openInBrowser}
          >
            <Icon name="download" size={20} color="#007AFF" style={{ marginRight: 8 }} />
            <Text style={styles.webSecondaryButtonText}>Download PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.webCloseButton}
            onPress={handleClose}
          >
            <Text style={styles.webCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  webContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  webText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  webSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  webButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  webButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  webSecondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webCloseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  webCloseButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default PDFViewer; 