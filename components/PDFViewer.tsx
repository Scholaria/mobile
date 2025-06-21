import * as React from "react";
import { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { fetchAPI } from '@/lib/fetch';
import AnnotatablePDFViewer from '@/components/AnnotatablePDFViewer';

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

const PDFViewer = ({ uri, onClose, initialPage = 1, onPageChange, paperId, userData, paperTitle, annotation = false }: PDFViewerProps) => { 
  console.log('DEBUG: PDFViewer component rendered');
  console.log('DEBUG: Props received:', { uri, initialPage, paperId, paperTitle, annotation });
  console.log('DEBUG: userData:', userData);
  console.log('DEBUG: Annotation mode enabled:', annotation);
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  console.log('DEBUG: Initial currentPage set to:', currentPage);

  const handlePageChange = (page: number) => {
    console.log('DEBUG: handlePageChange called with page:', page);
    setCurrentPage(page);
    onPageChange?.(page);
    console.log('DEBUG: Page changed to:', page);
  };

  const handleClose = () => {
    console.log('DEBUG: handleClose called');
    console.log('DEBUG: Current page when closing:', currentPage);
    console.log('DEBUG: userData?.clerk_id:', userData?.clerk_id);
    
    if (userData?.clerk_id) {
      console.log('DEBUG: Saving reading progress for user:', userData.clerk_id);
      console.log('DEBUG: Saving data:', { currentPage, paperId });
      
      fetchAPI(`/user/${userData.clerk_id}/reading-progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          currentPage: currentPage,
          paperId: paperId
        })
      })
      .then(res => {
        console.log('DEBUG: Reading progress saved successfully:', res);
      })
      .catch(err => {
        console.log('DEBUG: Error saving reading progress:', err);
      });
    } else {
      console.log('DEBUG: No userData.clerk_id found, skipping progress save');
    }
    
    console.log('DEBUG: Calling onClose');
    onClose();
  };

  console.log('DEBUG: Rendering PDFViewer component');
  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content"/>      
      <AnnotatablePDFViewer
        annotation={annotation}
        uri={uri}
        onClose={handleClose}
        paperId={paperId}
        userData={userData}
        paperTitle={paperTitle}
        initialPage={initialPage}
        onPageChange={handlePageChange}
      />
    </View>
  );
};

export default PDFViewer;