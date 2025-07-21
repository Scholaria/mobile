# PDF Viewer Components

This directory contains PDF viewer components for the Scholaria mobile app.

## Components

### PDFViewer
A native PDF viewer component built with `react-native-pdf` that provides excellent performance and native functionality.

**Props:**
- `uri: string` - The URL of the PDF to display
- `onClose: () => void` - Callback when the viewer is closed
- `paperId: string` - Unique identifier for the paper
- `userData: any` - User data for saving reading progress
- `paperTitle?: string` - Title of the paper (optional)
- `initialPage?: number` - Starting page number (default: 1)
- `onPageChange?: (page: number) => void` - Callback when page changes
- `annotation?: boolean` - Enable annotation rendering (default: false)

**Usage:**
```tsx
<PDFViewer
  uri="https://example.com/paper.pdf"
  onClose={() => setShowPDF(false)}
  paperId="paper123"
  userData={userData}
  paperTitle="Research Paper Title"
  initialPage={1}
  onPageChange={(page) => console.log('Page changed to:', page)}
/>
```

## Features

**Core Functionality:**
- Native PDF rendering with excellent performance
- Page navigation with swipe gestures
- Zoom in/out controls
- Reading progress tracking
- Error handling and retry functionality
- Loading states with activity indicators

**Navigation:**
- Swipe left/right to navigate pages
- Previous/Next page buttons
- Page counter display
- Jump to specific page functionality

**Zoom Controls:**
- Zoom in/out buttons
- Scale percentage display
- Smooth zoom transitions

**Reading Progress:**
- Automatic saving of current page when closing
- Integration with backend API
- User-specific progress tracking

## Backend Integration

The component automatically:
- Saves reading progress when the viewer is closed
- Tracks current page for each user/paper combination
- Handles API errors gracefully

## File Structure

```
components/
├── PDFViewer.tsx              # Main PDF viewer component
└── README.md                  # This documentation
```

## Dependencies

- `react-native-pdf` - Native PDF rendering library
- `react-native-blob-util` - Required for PDF file handling
- `@/lib/fetch` - For API calls to the backend
- `react-native-vector-icons` - For UI icons

## Notes

- The component uses native PDF rendering for optimal performance
- Reading progress is automatically saved when the viewer is closed
- The component handles various error states and loading states
- Zoom controls provide smooth scaling from 50% to 300%
- Page navigation supports both gesture and button controls 