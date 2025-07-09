import * as React from "react";
import { useState, useEffect } from 'react';
import { View, StatusBar, SafeAreaView } from 'react-native';
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

const PDFViewer: React.FC<PDFViewerProps> = ({ uri, initialPage = 1, paperId, paperTitle, annotation = false, userData, onClose }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleClose = async () => {
    if (userData?.clerk_id) {
      try {
        const res = await fetchAPI(`/user/${userData.clerk_id}/reading-progress`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            paperId, 
            currentPage 
          }),
        });
      } catch (err) {
      }
    }
    onClose();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
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
    </SafeAreaView>
  );
};

export default PDFViewer;