# PDF Viewer Components

This directory contains PDF viewer components for the Scholaria mobile app.

## Components

### PDFViewer
A wrapper component that provides a clean interface for displaying PDFs with optional annotation capabilities.

**Props:**
- `uri: string` - The URL of the PDF to display
- `onClose: () => void` - Callback when the viewer is closed
- `paperId: string` - Unique identifier for the paper
- `userData: any` - User data for saving reading progress and annotations
- `paperTitle?: string` - Title of the paper (optional)
- `initialPage?: number` - Starting page number (default: 1)
- `onPageChange?: (page: number) => void` - Callback when page changes
- `annotation?: boolean` - Enable annotation mode (default: false)

**Usage:**
```tsx
// Regular PDF viewer (no annotations)
<PDFViewer
  uri="https://example.com/paper.pdf"
  onClose={() => setShowPDF(false)}
  paperId="paper123"
  userData={userData}
  paperTitle="Research Paper Title"
/>

// Annotatable PDF viewer
<PDFViewer
  uri="https://example.com/paper.pdf"
  onClose={() => setShowPDF(false)}
  paperId="paper123"
  userData={userData}
  paperTitle="Research Paper Title"
  annotation={true}
/>
```

### AnnotatablePDFViewer
The core PDF viewer component that handles both regular and annotatable PDF viewing.

**Features:**
- **Regular Mode**: Basic PDF viewing with navigation, zoom, and reading progress tracking
- **Annotation Mode**: Full annotation capabilities including:
  - Highlight annotations
  - Text annotations
  - Zoom controls
  - Page navigation
  - Touch gesture support
  - Backend integration for saving/loading annotations

**Annotation Tools:**
- **Highlight**: Click/tap to add yellow highlights
- **Text**: Click/tap to add text annotations with custom content
- **Clear**: Remove all annotations
- **Zoom**: Zoom in/out buttons for better viewing

**Navigation:**
- Arrow keys for page navigation
- Swipe gestures on mobile
- Page info display (annotation mode only)

## Backend Integration

When annotation mode is enabled, the component automatically:
- Loads existing annotations for the paper/user combination
- Saves new annotations to the backend
- Updates existing annotations
- Deletes annotations when removed
- Tracks reading progress

## File Structure

```
components/
├── PDFViewer.tsx              # Main wrapper component
├── AnnotatablePDFViewer.tsx   # Core PDF viewer with annotation support
└── README.md                  # This documentation
```

## Dependencies

- `react-native-webview` - For rendering PDF.js in a WebView
- `@/lib/fetch` - For API calls to the backend
- `@/constants` - For icons and other constants

## Notes

- The component uses PDF.js for PDF rendering, loaded from CDN
- Annotations are stored as percentages of page dimensions for responsive design
- Reading progress is automatically saved when the viewer is closed
- The component handles various error states and loading states
- Debug logging is available for troubleshooting 