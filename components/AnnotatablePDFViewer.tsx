import * as React from "react";
import { View, TouchableOpacity, Text, StatusBar, StyleSheet, Dimensions, ActivityIndicator, Image, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { icons } from '@/constants';
import { fetchAPI } from '@/lib/fetch';

interface AnnotatablePDFViewerProps {
  uri: string;
  onClose: () => void;
  paperId: string;
  userData: any;
  paperTitle?: string;
  initialPage?: number;
  annotation?: boolean;
  onPageChange?: (page: number) => void;
}

const htmlTemplate = (pdfUrl: string, initialPage: number = 1, enableAnnotations: boolean = false) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    html, body { 
      margin: 0; 
      padding: 0; 
      height: 100%; 
      overflow: hidden; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      touch-action: pan-x pan-y;
    }
    
    #pdf-container { 
      width: 100%; 
      height: 100%; 
      position: relative;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      font-size: 16px;
      color: #666;
    }
    
    .error {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      font-size: 16px;
      color: #e74c3c;
      text-align: center;
      padding: 20px;
    }
    
    .debug-info {
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1001;
      max-width: 300px;
      word-wrap: break-word;
    }
    
    .toolbar {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .toolbar button {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 12px;
      min-width: 60px;
    }
    
    .toolbar button:hover {
      background: #f5f5f5;
    }
    
    .toolbar button.active {
      background: #007AFF;
      color: white;
      border-color: #007AFF;
    }
    
    .page-info {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 1000;
    }
    
    .page-wrapper {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      padding: 20px 0;
    }
    
    .page-container {
      position: relative;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      background: white;
      margin: 0 auto;
    }
    
    .page-canvas {
      display: block;
      max-width: 100%;
      height: auto;
    }
    
    .annotation-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    
    .annotation {
      position: absolute;
      pointer-events: auto;
      cursor: pointer;
    }
    
    .highlight-annotation {
      background: rgba(255, 255, 0, 0.3);
      border: 1px solid rgba(255, 200, 0, 0.5);
    }
    
    .text-annotation {
      background: rgba(0, 123, 255, 0.1);
      border: 1px solid rgba(0, 123, 255, 0.3);
      padding: 2px 4px;
      border-radius: 2px;
      font-size: 12px;
      color: #007AFF;
    }
  </style>
</head>
<body>
  <div id="pdf-container">
    <div class="loading">Loading PDF...</div>
  </div>
  
  <div class="debug-info" id="debug-info">
    Initializing PDF viewer...
  </div>

  ${enableAnnotations ? `
  <div class="toolbar">
    <button id="highlight-btn" onclick="setTool('highlight')" class="active">Highlight</button>
    <button id="text-btn" onclick="setTool('text')">Text</button>
    <button id="clear-btn" onclick="clearAnnotations()">Clear</button>
    <button id="zoom-in-btn" onclick="zoomIn()">+</button>
    <button id="zoom-out-btn" onclick="zoomOut()">-</button>
  </div>
  ` : `
  <div class="toolbar">
    <button id="zoom-in-btn" onclick="zoomIn()">+</button>
    <button id="zoom-out-btn" onclick="zoomOut()">-</button>
    <button id="prev-page-btn" onclick="onPrevPage()">‹</button>
    <button id="next-page-btn" onclick="onNextPage()">›</button>
  </div>
  `}

  <div class="page-info" id="page-info"></div>

  <script>
    console.log('[PDF Viewer] HTML template loaded');
    console.log('[PDF Viewer] PDF URL:', '${pdfUrl}');
    console.log('[PDF Viewer] Initial page:', ${initialPage});
    console.log('[PDF Viewer] Annotations enabled:', ${enableAnnotations});
    
    let currentPage = ${initialPage};
    let totalPages = 0;
    let scale = 1.0;
    let pdfDoc = null;
    let pageRendering = false;
    let pageNumPending = null;
    ${enableAnnotations ? `
    let annotations = [];
    let currentTool = 'highlight';
    let annotationLayer = null;
    ` : ''}
    
    function updateDebugInfo(message) {
      const debugInfo = document.getElementById('debug-info');
      if (debugInfo) {
        debugInfo.textContent = message;
        console.log('[PDF Viewer] Debug:', message);
      }
    }
    
    function sendMessage(type, payload) {
      console.log('[PDF Viewer] Sending message:', type, payload);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: type,
          payload: payload
        }));
      } else {
        console.log('[PDF Viewer] ReactNativeWebView not available');
      }
    }
    
    // Set PDF.js worker
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      console.log('[PDF Viewer] PDF.js worker set');
    } catch (e) {
      console.error('[PDF Viewer] Error setting PDF.js worker:', e);
    }
    
    ${enableAnnotations ? `
    function setTool(tool) {
      console.log('[PDF Viewer] Setting tool to:', tool);
      currentTool = tool;
      document.querySelectorAll('.toolbar button').forEach(btn => btn.classList.remove('active'));
      document.getElementById(tool + '-btn').classList.add('active');
    }
    
    function clearAnnotations() {
      console.log('[PDF Viewer] Clearing all annotations');
      annotations = [];
      renderAnnotations();
      sendMessage('annotations_cleared', {});
    }
    
    function renderAnnotations() {
      console.log('[PDF Viewer] Rendering annotations for page:', currentPage, 'Total annotations:', annotations.length);
      if (!annotationLayer) return;
      
      annotationLayer.innerHTML = '';
      
      annotations.forEach(annotation => {
        if (annotation.page === currentPage) {
          const annotationEl = document.createElement('div');
          annotationEl.className = \`annotation \${annotation.type}-annotation\`;
          annotationEl.style.left = annotation.x + '%';
          annotationEl.style.top = annotation.y + '%';
          annotationEl.style.width = annotation.width + '%';
          annotationEl.style.height = annotation.height + '%';
          annotationEl.textContent = annotation.text || '';
          annotationEl.onclick = () => removeAnnotation(annotation.id);
          annotationLayer.appendChild(annotationEl);
          console.log('[PDF Viewer] Rendered annotation:', annotation.id, 'at', annotation.x + '%', annotation.y + '%');
        }
      });
    }
    
    function removeAnnotation(id) {
      console.log('[PDF Viewer] Removing annotation:', id);
      annotations = annotations.filter(a => a.id !== id);
      renderAnnotations();
      sendMessage('annotation_deleted', { id });
    }
    
    function addAnnotation(x, y, width, height, text = '') {
      const annotation = {
        id: Date.now() + Math.random(),
        type: currentTool,
        page: currentPage,
        x: x,
        y: y,
        width: width,
        height: height,
        text: text
      };
      
      console.log('[PDF Viewer] Adding annotation:', annotation);
      annotations.push(annotation);
      renderAnnotations();
      sendMessage('annotation', annotation);
      
      return annotation;
    }
    ` : ''}
    
    function zoomIn() {
      console.log('[PDF Viewer] Zooming in, current scale:', scale);
      scale = Math.min(scale * 1.2, 3.0);
      applyZoom();
      updatePageInfo();
    }
    
    function zoomOut() {
      console.log('[PDF Viewer] Zooming out, current scale:', scale);
      scale = Math.max(scale / 1.2, 0.5);
      applyZoom();
      updatePageInfo();
    }
    
    function applyZoom() {
      const pageContainer = document.querySelector('.page-container');
      if (pageContainer) {
        pageContainer.style.transform = \`scale(\${scale})\`;
        pageContainer.style.transformOrigin = 'top center';
        console.log('[PDF Viewer] Applied zoom scale:', scale);
      }
    }
    
    function updatePageInfo() {
      const pageInfo = document.getElementById('page-info');
      pageInfo.textContent = \`Page \${currentPage} of \${totalPages} (Zoom: \${Math.round(scale * 100)}%)\`;
      console.log('[PDF Viewer] Updated page info:', currentPage, 'of', totalPages, 'Zoom:', scale);
    }
    
    function queueRenderPage(num) {
      console.log('[PDF Viewer] Queueing page render:', num, 'Current rendering:', pageRendering);
      if (pageRendering) {
        pageNumPending = num;
      } else {
        renderPage(num);
      }
    }
    
    function onPrevPage() {
      if (currentPage <= 1) {
        return;
      }
      currentPage--;
      queueRenderPage(currentPage);
      sendMessage('page_changed', { page: currentPage });
    }
    
    function onNextPage() {
      if (currentPage >= totalPages) {
        return;
      }
      currentPage++;
      queueRenderPage(currentPage);
      sendMessage('page_changed', { page: currentPage });
    }
    
    async function renderPage(num) {
      pageRendering = true;
      updateDebugInfo(\`Rendering page \${num}...\`);
      
      try {
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: 1.5 }); // Good resolution for mobile
        
        // Prepare container
        const container = document.getElementById('pdf-container');
        container.innerHTML = '';
        
        // Create page wrapper for better centering
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'page-wrapper';
        
        // Calculate proper dimensions to fit screen width while maintaining aspect ratio
        const screenWidth = window.innerWidth - 40; // Account for margins
        const aspectRatio = viewport.height / viewport.width;
        const displayWidth = Math.min(screenWidth, viewport.width);
        const displayHeight = displayWidth * aspectRatio;
        
        ${enableAnnotations ? `
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container';
        pageContainer.style.width = displayWidth + 'px';
        pageContainer.style.height = displayHeight + 'px';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'page-canvas';
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        annotationLayer = document.createElement('div');
        annotationLayer.className = 'annotation-layer';
        annotationLayer.style.width = displayWidth + 'px';
        annotationLayer.style.height = displayHeight + 'px';
        
        pageContainer.appendChild(canvas);
        pageContainer.appendChild(annotationLayer);
        pageWrapper.appendChild(pageContainer);
        ` : `
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'page-canvas';
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        pageContainer.appendChild(canvas);
        pageWrapper.appendChild(pageContainer);
        `}
        
        container.appendChild(pageWrapper);
        
        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Apply current zoom
        applyZoom();
        
        ${enableAnnotations ? `
        // Render annotations
        renderAnnotations();
        ` : ''}
        
        // Update page info
        updatePageInfo();
        
        pageRendering = false;
        updateDebugInfo(\`Page \${num} rendered successfully\`);
        
        if (pageNumPending !== null) {
          renderPage(pageNumPending);
          pageNumPending = null;
        }
        
      } catch (error) {
        console.error('Error rendering page:', error);
        pageRendering = false;
        updateDebugInfo(\`Error rendering page \${num}: \${error.message}\`);
        document.getElementById('pdf-container').innerHTML = 
          '<div class="error">Failed to render page. Please try again.</div>';
      }
    }
    
    // Handle keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        onPrevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        onNextPage();
      }
    });
    
    ${enableAnnotations ? `
    // Handle mouse events for annotations (desktop)
    document.addEventListener('click', function(e) {
      if (currentTool === 'highlight' || currentTool === 'text') {
        const pageContainer = document.querySelector('.page-container');
        if (pageContainer && e.target === pageContainer.querySelector('canvas')) {
          const rect = pageContainer.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          
          let text = '';
          if (currentTool === 'text') {
            text = prompt('Enter annotation text:') || '';
            if (text) {
              addAnnotation(x, y, 20, 10, text);
            }
          } else {
            addAnnotation(x, y, 30, 5);
          }
        }
      }
    });
    
    // Handle touch events for annotations (mobile)
    document.addEventListener('touchend', function(e) {
      if (currentTool === 'highlight' || currentTool === 'text') {
        const pageContainer = document.querySelector('.page-container');
        if (pageContainer && e.target === pageContainer.querySelector('canvas')) {
          const rect = pageContainer.getBoundingClientRect();
          const touch = e.changedTouches[0];
          const x = ((touch.clientX - rect.left) / rect.width) * 100;
          const y = ((touch.clientY - rect.top) / rect.height) * 100;
          
          let text = '';
          if (currentTool === 'text') {
            text = prompt('Enter annotation text:') || '';
            if (text) {
              addAnnotation(x, y, 20, 10, text);
            }
          } else {
            addAnnotation(x, y, 30, 5);
          }
        }
      }
    });
    
    // Handle messages from React Native
    document.addEventListener('message', function(e) {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'load_annotations') {
          annotations = msg.payload.annotations || [];
          renderAnnotations();
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    });
    ` : ''}
    
    // Load PDF
    async function loadPDF() {
      updateDebugInfo('Starting PDF load...');
      console.log('[PDF Viewer] Starting PDF load for URL:', '${pdfUrl}');
      
      try {
        updateDebugInfo('Creating PDF loading task...');
        
        const loadingTask = pdfjsLib.getDocument('${pdfUrl}');
        console.log('[PDF Viewer] PDF loading task created');
        
        updateDebugInfo('Waiting for PDF to load...');
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        
        console.log('[PDF Viewer] PDF loaded successfully, pages:', totalPages);
        updateDebugInfo(\`PDF loaded! Pages: \${totalPages}\`);
        
        // Send success message
        sendMessage('pdf_loaded', { success: true, totalPages });
        
        // Render the first page
        console.log('[PDF Viewer] Rendering first page:', currentPage);
        await renderPage(currentPage);
        
      } catch (error) {
        console.error('[PDF Viewer] Error loading PDF:', error);
        updateDebugInfo(\`PDF load failed: \${error.message}\`);
        
        let errorMessage = 'Failed to load PDF. Please check the URL and try again.';
        if (error.message.includes('CORS')) {
          errorMessage = 'CORS error: The PDF server does not allow cross-origin access.';
        } else if (error.message.includes('404')) {
          errorMessage = 'PDF not found (404 error). The URL may be incorrect.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error: Please check your internet connection.';
        }
        
        document.getElementById('pdf-container').innerHTML = 
          '<div class="error">' + errorMessage + '<br><br>Error: ' + error.message + '</div>';
        sendMessage('pdf_loaded', { success: false, error: error.message });
      }
    }
    
    // Start loading when page is ready
    console.log('[PDF Viewer] Document ready state:', document.readyState);
    if (document.readyState === 'loading') {
      console.log('[PDF Viewer] Adding DOMContentLoaded listener');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[PDF Viewer] DOMContentLoaded fired');
        loadPDF();
      });
    } else {
      console.log('[PDF Viewer] Document already ready, loading PDF immediately');
      loadPDF();
    }
    
    // Also try loading after a short delay as fallback
    setTimeout(() => {
      if (!pdfDoc) {
        console.log('[PDF Viewer] Fallback: Loading PDF after timeout');
        loadPDF();
      }
    }, 1000);
  </script>
</body>
</html>
`;

export default function AnnotatablePDFViewer({
  uri,
  onClose,
  paperId,
  userData,
  paperTitle,
  initialPage = 1,
  annotation,
  onPageChange,
}: AnnotatablePDFViewerProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const webViewRef = React.useRef<WebView>(null);

  console.log('[AnnotatablePDFViewer] Component initialized with props:', {
    uri,
    paperId,
    paperTitle,
    initialPage,
    userData: userData ? { clerk_id: userData.clerk_id } : null
  });

  console.log('[AnnotatablePDFViewer] Initial state:', {
    isLoading,
    error,
    currentPage
  });

  // Handle messages from the WebView
  const onMessage = ({ nativeEvent }: any) => {
    try {
      const msg = JSON.parse(nativeEvent.data);
      console.log('[AnnotatablePDFViewer] Received message:', msg);
      
      switch (msg.type) {
        case 'pdf_loaded':
          console.log('[AnnotatablePDFViewer] PDF loaded message:', msg.payload);
          setIsLoading(false);
          if (!msg.payload.success) {
            console.log('[AnnotatablePDFViewer] PDF load failed:', msg.payload.error);
            setError(msg.payload.error || 'Failed to load PDF');
          } else {
            console.log('[AnnotatablePDFViewer] PDF loaded successfully');
            // Only load annotations if annotation mode is enabled
            if (annotation) {
              console.log('[AnnotatablePDFViewer] Loading annotations...');
              loadExistingAnnotations();
            }
          }
          break;
          
        case 'annotation':
          if (annotation) {
            console.log('[AnnotatablePDFViewer] Annotation added:', msg.payload);
            // Save annotation to backend
            saveAnnotation(msg.payload);
          }
          break;
          
        case 'annotation_updated':
          if (annotation) {
            console.log('[AnnotatablePDFViewer] Annotation updated:', msg.payload);
            // Update annotation in backend
            updateAnnotation(msg.payload);
          }
          break;
          
        case 'annotation_deleted':
          if (annotation) {
            console.log('[AnnotatablePDFViewer] Annotation deleted:', msg.payload);
            // Delete annotation from backend
            deleteAnnotation(msg.payload);
          }
          break;
          
        case 'annotations_cleared':
          if (annotation) {
            console.log('[AnnotatablePDFViewer] Annotations cleared');
            // Clear all annotations from backend
            clearAllAnnotations();
          }
          break;
          
        case 'page_changed':
          console.log('[AnnotatablePDFViewer] Page changed:', msg.payload.page);
          setCurrentPage(msg.payload.page);
          onPageChange?.(msg.payload.page);
          break;
          
        default:
          console.log('[AnnotatablePDFViewer] Unknown message type:', msg.type);
      }
    } catch (err) {
      console.error('[AnnotatablePDFViewer] Error parsing WebView message:', err);
    }
  };

  const loadExistingAnnotations = async () => {
    if (!annotation || !userData?.clerk_id || !paperId) return;
    
    try {
      const response = await fetchAPI(`/annotation/papers/${paperId}/annotations?userId=${userData.clerk_id}`, {
        method: 'GET'
      });
      
      if (response && response.annotations) {
        // Transform annotations to match WebView expectations
        const transformedAnnotations = response.annotations.map((annotation: any) => ({
          id: annotation.id,
          type: annotation.type,
          page: annotation.page,
          x: annotation.x,
          y: annotation.y,
          width: annotation.width,
          height: annotation.height,
          text: annotation.text,
          color: annotation.color
        }));
        
        // Send annotations to WebView
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'load_annotations',
          payload: { annotations: transformedAnnotations }
        }));
      }
    } catch (err) {
      console.error('Error loading annotations:', err);
    }
  };

  const clearAllAnnotations = async () => {
    if (!annotation || !userData?.clerk_id || !paperId) return;
    
    try {
      await fetchAPI(`/annotation/papers/${paperId}/annotations/clear`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.clerk_id
        })
      });
    } catch (err) {
      console.error('Error clearing annotations:', err);
    }
  };

  const saveAnnotation = async (annotation: any) => {
    if (!annotation || !userData?.clerk_id || !paperId) return;
    
    try {
      await fetchAPI(`/annotation/papers/${paperId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.clerk_id,
          annotation: {
            type: annotation.type,
            page: annotation.page,
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
            text: annotation.text,
            color: annotation.color
          }
        })
      });
    } catch (err) {
      console.error('Error saving annotation:', err);
    }
  };

  const updateAnnotation = async (annotation: any) => {
    if (!annotation || !userData?.clerk_id || !paperId) return;
    
    try {
      await fetchAPI(`/annotation/papers/${paperId}/annotations/${annotation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.clerk_id,
          annotation: {
            type: annotation.type,
            page: annotation.page,
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
            text: annotation.text,
            color: annotation.color
          }
        })
      });
    } catch (err) {
      console.error('Error updating annotation:', err);
    }
  };

  const deleteAnnotation = async (annotation: any) => {
    if (!annotation || !userData?.clerk_id || !paperId) return;
    
    try {
      await fetchAPI(`/annotation/papers/${paperId}/annotations/${annotation.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.clerk_id
        })
      });
    } catch (err) {
      console.error('Error deleting annotation:', err);
    }
  };

  const handleClose = () => {
    console.log('DEBUG: handleClose annotatable', userData?.clerk_id, paperId);
    if (userData?.clerk_id && paperId) {
      fetchAPI(`/user/${userData.clerk_id}/reading-progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          currentPage: currentPage,
          paperId: paperId
        })
      }).catch(err => {
        console.error('Error saving reading progress:', err);
      });
    }
    onClose();
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Image source={icons.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {paperTitle || 'PDF Viewer'}{annotation ? ' (Annotatable)' : ''}
        </Text>
        <View style={styles.spacer} />
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading PDF viewer...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlTemplate(uri, initialPage, annotation) }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        mixedContentMode="compatibility"
        onMessage={onMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[AnnotatablePDFViewer] WebView error:', nativeEvent);
          setError('Failed to load PDF viewer');
          setIsLoading(false);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[AnnotatablePDFViewer] WebView HTTP error:', nativeEvent);
          setError('Network error loading PDF');
          setIsLoading(false);
        }}
        onLoadStart={() => {
          console.log('[AnnotatablePDFViewer] WebView load started');
        }}
        onLoadEnd={() => {
          console.log('[AnnotatablePDFViewer] WebView load ended');
        }}
        onLoad={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('[AnnotatablePDFViewer] WebView loaded successfully:', nativeEvent.url);
          console.log('[AnnotatablePDFViewer] WebView title:', nativeEvent.title);
        }}
        onContentProcessDidTerminate={() => {
          console.log('[AnnotatablePDFViewer] WebView content process terminated');
          setError('WebView crashed, please try again');
          setIsLoading(false);
        }}
        onShouldStartLoadWithRequest={(request) => {
          console.log('[AnnotatablePDFViewer] WebView should start load:', request.url);
          return true;
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading PDF viewer...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { 
    paddingTop: 12 + (StatusBar.currentHeight || 0), 
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderColor: '#ddd',
    backgroundColor: '#fff'
  },
  backButton: { 
    padding: 8 
  },
  backIcon: { 
    width: 24, 
    height: 24, 
    tintColor: '#000' 
  },
  title: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 18, 
    fontWeight: '600',
    marginHorizontal: 8
  },
  spacer: { 
    width: 40 
  },
  webview: { 
    flex: 1, 
    width: Dimensions.get('window').width 
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1000
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1000,
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});