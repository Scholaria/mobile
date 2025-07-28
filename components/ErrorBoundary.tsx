import React from 'react';
import { View, Text } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#1F2937' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#ffffff' }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, textAlign: 'center', color: '#9CA3AF', marginBottom: 10 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={{ fontSize: 12, textAlign: 'center', color: '#6B7280' }}>
            Please restart the app
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 