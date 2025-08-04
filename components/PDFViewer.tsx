import { fetchAPI } from '@/lib/fetch';
import * as React from "react";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Linking, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Alert, Modal, TextInput, ScrollView } from 'react-native';
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

interface Annotation {
  id?: string;
  type: 'highlight' | 'text' | 'point' | 'area';
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TouchPoint {
  x: number;
  y: number;
  page: number;
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
  // Debug logging
  useEffect(() => {
    console.log('PDFViewer received URI:', uri);
  }, [uri]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [showControls, setShowControls] = useState(false);
  const [showAnnotationTools, setShowAnnotationTools] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationType, setSelectedAnnotationType] = useState<'highlight' | 'text' | 'point' | 'area'>('highlight');
  const [selectedColor, setSelectedColor] = useState('#FFFF00');
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState(false);
  const [startPoint, setStartPoint] = useState<TouchPoint | null>(null);
  const [currentPoint, setCurrentPoint] = useState<TouchPoint | null>(null);
  const [showNewAnnotationModal, setShowNewAnnotationModal] = useState(false);
  const [newAnnotationData, setNewAnnotationData] = useState<Partial<Annotation> | null>(null);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const pdfRef = React.useRef<any>(null);

  // Get dynamic dimensions that update with screen rotation
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  // Load annotations when component mounts
  useEffect(() => {
    if (userData?.clerk_id && paperId) {
      loadAnnotations();
    }
  }, [userData?.clerk_id, paperId]);

  // Calculate responsive scale based on device
  const getInitialScale = () => {
    const { width, height } = dimensions;
    const isTablet = width >= 768 || height >= 1024;
    
    if (isTablet) {
      // For iPad and tablets, start with a larger scale
      return Math.min(width / 800, height / 1000);
    } else {
      // For phones, use a more conservative scale
      return Math.min(width / 400, height / 600);
    }
  };

  useEffect(() => {
    const initialScale = getInitialScale();
    setScale(initialScale);
  }, [dimensions]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  };

  const loadAnnotations = async () => {
    try {
      console.log('🔄 Frontend: Loading annotations for paper:', paperId, 'user:', userData.clerk_id);
      setLoadingAnnotations(true);
      
      const response = await fetchAPI(`/annotations/${paperId}/${userData.clerk_id}`);
      
      console.log('📊 Frontend: Annotations loaded:', response);
      
      // fetchAPI returns parsed JSON directly, not a Response object
      if (response) {
        setAnnotations(response || []);
        console.log('✅ Frontend: Annotations set successfully, count:', (response || []).length);
      } else {
        console.log('📝 Frontend: No annotations found');
        setAnnotations([]);
      }
    } catch (error) {
      console.error('❌ Frontend: Error loading annotations:', error);
      setAnnotations([]);
    } finally {
      setLoadingAnnotations(false);
    }
  };

  const saveAnnotation = async (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('🔄 Frontend: Saving annotation...', annotation);
      
      const response = await fetchAPI('/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId,
          userId: userData.clerk_id,
          ...annotation
        }),
      });

      console.log('�� Frontend: Response received:', response);
      
      // fetchAPI returns parsed JSON directly, not a Response object
      if (response) {
        console.log('✅ Frontend: Annotation saved successfully:', response);
        
        setAnnotations(prev => [...prev, response]);
        setShowNewAnnotationModal(false);
        setNewAnnotationData(null);
        setAnnotationText('');
        
        // Don't show alert for successful creation to avoid interruption
        // Alert.alert('Success', 'Annotation saved successfully!');
      } else {
        console.error('❌ Frontend: Empty response from server');
        throw new Error('Empty response from server');
      }
    } catch (error) {
      console.error('❌ Frontend: Error saving annotation:', error);
      Alert.alert('Error', 'Failed to save annotation. Please try again.');
    }
  };

  const updateAnnotation = async (annotationId: string, updates: Partial<Annotation>) => {
    try {
      const response = await fetchAPI(`/annotations/${annotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId,
          userId: userData.clerk_id,
          ...updates
        }),
      });

      if (response.ok) {
        const updatedAnnotation = await response.json();
        setAnnotations(prev => 
          prev.map(ann => ann.id === annotationId ? updatedAnnotation : ann)
        );
        Alert.alert('Success', 'Annotation updated successfully!');
      } else {
        throw new Error('Failed to update annotation');
      }
    } catch (error) {
      console.error('Error updating annotation:', error);
      Alert.alert('Error', 'Failed to update annotation. Please try again.');
    }
  };

  const deleteAnnotation = async (annotationId: string) => {
    try {
      const response = await fetchAPI(`/annotations/${annotationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId,
          userId: userData.clerk_id
        }),
      });

      if (response.ok) {
        setAnnotations(prev => prev.filter(ann => ann.id !== annotationId));
        Alert.alert('Success', 'Annotation deleted successfully!');
      } else {
        throw new Error('Failed to delete annotation');
      }
    } catch (error) {
      console.error('Error deleting annotation:', error);
      Alert.alert('Error', 'Failed to delete annotation. Please try again.');
    }
  };

  const handleAnnotationPress = (annotation: Annotation) => {
    setEditingAnnotation(annotation);
    setAnnotationText(annotation.text || '');
    setShowAnnotationModal(true);
  };

  const handleSaveAnnotation = () => {
    if (!editingAnnotation) return;

    const updates: Partial<Annotation> = {
      text: annotationText,
    };

    updateAnnotation(editingAnnotation.id!, updates);
    setShowAnnotationModal(false);
    setEditingAnnotation(null);
    setAnnotationText('');
  };

  const handleClose = async () => {
    if (userData?.clerk_id) {
      try {
        // Check if user has reached the final page
        if (currentPage >= totalPages) {
          // Mark paper as read
          await fetchAPI(`/user/${userData.clerk_id}/reading-progress/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              paperId
            }),
          });
        } else {
          // Update reading progress normally
          await fetchAPI(`/user/${userData.clerk_id}/reading-progress`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              paperId, 
              currentPage,
              finalPage: totalPages
            }),
          });
        }
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
    
    let errorMessage = 'Failed to load PDF. Please check your internet connection and try again.';
    
    // Check for specific ATS errors
    if (error && error.message) {
      if (error.message.includes('App Transport Security') || error.message.includes('secure connection')) {
        errorMessage = 'This PDF requires a secure connection. The link may be using HTTP instead of HTTPS.';
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = 'PDF not found. The link may be invalid or the paper may not be publicly available.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'PDF loading timed out. Please check your internet connection and try again.';
      }
    }
    
    setError(errorMessage);
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

  const openInBrowser = () => {
    Linking.openURL(uri);
  };

  // Touch handling for annotation creation
  const handleTouchStart = (event: any) => {
    if (!showAnnotationTools) return;
    
    const { locationX, locationY } = event.nativeEvent;
    setStartPoint({ x: locationX, y: locationY, page: currentPage });
    setCurrentPoint({ x: locationX, y: locationY, page: currentPage });
    setIsCreatingAnnotation(true);
    
    // Prevent event from bubbling to PDF
    event.preventDefault();
  };

  const handleTouchMove = (event: any) => {
    if (!isCreatingAnnotation || !showAnnotationTools) return;
    
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPoint({ x: locationX, y: locationY, page: currentPage });
    
    // Prevent event from bubbling to PDF
    event.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isCreatingAnnotation || !startPoint || !currentPoint || !showAnnotationTools) return;
    
    setIsCreatingAnnotation(false);
    
    // Calculate annotation dimensions
    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);
    
    // Only create annotation if there's a meaningful size
    if (width > 10 || height > 10) {
      // Convert to percentage coordinates
      const pdfWidth = dimensions.width;
      const pdfHeight = dimensions.height - 200; // Account for header and controls
      
      const annotationData: Partial<Annotation> = {
        type: selectedAnnotationType,
        page: currentPage,
        x: (x / pdfWidth) * 100,
        y: (y / pdfHeight) * 100,
        width: (width / pdfWidth) * 100,
        height: (height / pdfHeight) * 100,
        color: selectedColor,
        text: selectedAnnotationType === 'text' ? '' : undefined
      };
      
      setNewAnnotationData(annotationData);
      setShowNewAnnotationModal(true);
    }
    
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handleCreateAnnotation = async () => {
    if (!newAnnotationData) return;
    
    try {
      await saveAnnotation(newAnnotationData as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>);
      // setShowNewAnnotationModal(false); // This is now handled by the saveAnnotation success block
      // setNewAnnotationData(null); // This is now handled by the saveAnnotation success block
      // setAnnotationText(''); // This is now handled by the saveAnnotation success block
    } catch (error) {
      console.error('Error creating annotation:', error);
    }
  };

  const annotationColors = [
    '#FFFF00', // Yellow
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Light Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
  ];

  const annotationTypes = [
    { type: 'highlight', icon: 'paint-brush', label: 'Highlight' },
    { type: 'text', icon: 'sticky-note', label: 'Note' },
    { type: 'point', icon: 'map-marker', label: 'Point' },
    { type: 'area', icon: 'square-o', label: 'Area' },
  ] as const;

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
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {paperTitle || 'PDF Viewer'}
        </Text>
        <TouchableOpacity 
          onPress={() => setShowControls(!showControls)} 
          style={styles.menuButton}
        >
          <Icon name="ellipsis-v" size={20} color="#007AFF" />
        </TouchableOpacity>
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
              <Icon name="exclamation-triangle" size={48} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
              
              <View style={styles.errorButtons}>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    setError(null);
                    setLoading(true);
                  }}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.browserButton}
                  onPress={openInBrowser}
                >
                  <Icon name="external-link" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.browserButtonText}>Open in Browser</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* PDF Viewer with Touch Overlay */}
          {!error && (
            <View style={styles.pdfContainer}>
              <Pdf
                ref={pdfRef}
                source={{ uri }}
                style={[styles.pdf, { width: dimensions.width, height: dimensions.height - 200 }]}
                onLoadComplete={handleLoadComplete}
                onError={handleError}
                onPageChanged={handlePageChanged}
                page={initialPage}
                scale={scale}
                enablePaging={false} // Disable paging for continuous scrolling
                enableRTL={false}
                enableAnnotationRendering={true} // Always enable for our custom annotations
                trustAllCerts={false}
                spacing={0} // Remove spacing for continuous flow
                fitPolicy={0}
                enableAntialiasing={true}
                horizontal={false} // Ensure vertical scrolling
              />
              
              {/* Annotation Loading Indicator */}
              {loadingAnnotations && (
                <View style={styles.annotationLoadingOverlay}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.annotationLoadingText}>Loading annotations...</Text>
                </View>
              )}
              
              {/* Touch Overlay for Annotation Creation */}
              {showAnnotationTools && (
                <View 
                  style={styles.touchOverlay}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  pointerEvents="box-none"
                >
                  {/* Visual feedback for annotation creation */}
                  {isCreatingAnnotation && startPoint && currentPoint && (
                    <View 
                      style={[
                        styles.annotationPreview,
                        {
                          left: Math.min(startPoint.x, currentPoint.x),
                          top: Math.min(startPoint.y, currentPoint.y),
                          width: Math.abs(currentPoint.x - startPoint.x),
                          height: Math.abs(currentPoint.y - startPoint.y),
                          backgroundColor: selectedColor + '40', // 40 = 25% opacity
                          borderColor: selectedColor,
                          borderWidth: 2,
                        }
                      ]}
                    />
                  )}
                </View>
              )}

              {/* Existing Annotations Overlay */}
              {annotations.length > 0 && (
                <View style={[styles.annotationsOverlay, { pointerEvents: showAnnotationTools ? "auto" : "box-none" }]}>
                  {annotations
                    .filter(ann => ann.page === currentPage)
                    .map((annotation) => (
                      <TouchableOpacity
                        key={annotation.id}
                        style={[
                          styles.annotationDisplay,
                          {
                            left: `${annotation.x}%`,
                            top: `${annotation.y}%`,
                            width: `${annotation.width}%`,
                            height: `${annotation.height}%`,
                            backgroundColor: annotation.color + '40',
                            borderColor: annotation.color,
                            borderWidth: 1,
                          }
                        ]}
                        onPress={() => handleAnnotationPress(annotation)}
                        activeOpacity={0.7}
                      >
                        {annotation.type === 'text' && annotation.text && (
                          <View style={styles.annotationTextBubble}>
                            <Text style={styles.annotationText}>{annotation.text}</Text>
                          </View>
                        )}
                        {annotation.type === 'text' && !annotation.text && (
                          <View style={styles.annotationTextBubble}>
                            <Text style={styles.annotationText}>Tap to add note</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>
          )}

          {/* Annotation Tools - Fixed at bottom */}
          {!error && !loading && showAnnotationTools && (
            <View style={styles.annotationTools}>
              <View style={styles.annotationToolsContent}>
                {/* Annotation Types */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.annotationTypesScroll}>
                  {annotationTypes.map(({ type, icon, label }) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.annotationTypeButton,
                        selectedAnnotationType === type && styles.annotationTypeButtonActive
                      ]}
                      onPress={() => setSelectedAnnotationType(type)}
                    >
                      <Icon 
                        name={icon} 
                        size={16} 
                        color={selectedAnnotationType === type ? '#ffffff' : '#007AFF'} 
                      />
                      <Text style={[
                        styles.annotationTypeLabel,
                        selectedAnnotationType === type && styles.annotationTypeLabelActive
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Color Picker */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPickerScroll}>
                  {annotationColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorButtonActive
                      ]}
                      onPress={() => setSelectedColor(color)}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Floating Controls - Fixed at bottom */}
          {!error && !loading && showControls && (
            <View style={styles.floatingControls}>
              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {currentPage} / {totalPages}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(currentPage / totalPages) * 100}%` }
                    ]} 
                  />
                </View>
              </View>

              {/* Zoom Controls */}
              <View style={styles.zoomControls}>
                <TouchableOpacity onPress={zoomOut} style={styles.zoomButton}>
                  <Icon name="search-minus" size={16} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
                <TouchableOpacity onPress={zoomIn} style={styles.zoomButton}>
                  <Icon name="search-plus" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {/* Annotation Toggle */}
              <TouchableOpacity 
                style={[
                  styles.annotationToggle,
                  showAnnotationTools && styles.annotationToggleActive
                ]}
                onPress={() => setShowAnnotationTools(!showAnnotationTools)}
              >
                <Icon 
                  name="pencil" 
                  size={16} 
                  color={showAnnotationTools ? '#ffffff' : '#007AFF'} 
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Floating Toggle Button - Fixed position */}
          {!error && !loading && (
            <TouchableOpacity 
              style={styles.floatingToggle}
              onPress={() => setShowControls(!showControls)}
            >
              <Icon 
                name={showControls ? "times" : "cog"} 
                size={20} 
                color="#ffffff" 
              />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Annotation Modal */}
      <Modal
        visible={showAnnotationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnnotationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Annotation</Text>
              <TouchableOpacity 
                onPress={() => setShowAnnotationModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.annotationTextInput}
              value={annotationText}
              onChangeText={setAnnotationText}
              placeholder="Add your note..."
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => {
                  if (editingAnnotation?.id) {
                    deleteAnnotation(editingAnnotation.id);
                  }
                  setShowAnnotationModal(false);
                  setEditingAnnotation(null);
                  setAnnotationText('');
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Delete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleSaveAnnotation}
              >
                <Text style={styles.modalButtonPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Annotation Modal */}
      <Modal
        visible={showNewAnnotationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewAnnotationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Annotation</Text>
              <TouchableOpacity 
                onPress={() => setShowNewAnnotationModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            {newAnnotationData?.type === 'text' && (
              <TextInput
                style={styles.annotationTextInput}
                value={annotationText}
                onChangeText={setAnnotationText}
                placeholder="Add your note..."
                multiline
                numberOfLines={4}
              />
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setShowNewAnnotationModal(false);
                  setNewAnnotationData(null);
                  setAnnotationText('');
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleCreateAnnotation}
              >
                <Text style={styles.modalButtonPrimaryText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#38383A',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  pdf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  annotationPreview: {
    position: 'absolute',
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
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
  errorButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  browserButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browserButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  annotationTools: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 0.5,
    borderTopColor: '#38383A',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  annotationToolsContent: {
    gap: 12,
  },
  annotationTypesScroll: {
    marginBottom: 8,
  },
  colorPickerScroll: {
    marginTop: 4,
  },
  annotationTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  annotationTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  annotationTypeLabel: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  annotationTypeLabelActive: {
    color: '#ffffff',
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#ffffff',
  },
  floatingControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 0.5,
    borderTopColor: '#38383A',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#38383A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginHorizontal: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  annotationToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    marginLeft: 8,
  },
  annotationToggleActive: {
    backgroundColor: '#007AFF',
  },
  floatingToggle: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalCloseButton: {
    padding: 4,
  },
  annotationTextInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    backgroundColor: '#F2F2F7',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  modalButtonSecondaryText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  modalButtonPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Fallback styles
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  fallbackContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
  },
  fallbackText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#8E8E93',
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
    color: '#8E8E93',
    fontSize: 16,
  },
  annotationsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1, // Ensure it's above the PDF
  },
  annotationDisplay: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  annotationTextBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  annotationText: {
    fontSize: 12,
    color: '#000000',
    lineHeight: 16,
  },
  annotationLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, // Ensure it's above PDF and annotations
  },
  annotationLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default PDFViewer;