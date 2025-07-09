import { InteractionManager } from 'react-native';

// Performance monitoring utility
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private isDevelopment = __DEV__;

  startTimer(key: string): void {
    if (this.isDevelopment) {
      this.metrics.set(key, Date.now());
    }
  }

  endTimer(key: string): number | null {
    if (!this.isDevelopment) return null;
    
    const startTime = this.metrics.get(key);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`⏱️ ${key}: ${duration}ms`);
      this.metrics.delete(key);
      return duration;
    }
    return null;
  }

  measureAsync<T>(key: string, asyncFn: () => Promise<T>): Promise<T> {
    if (!this.isDevelopment) return asyncFn();
    
    this.startTimer(key);
    return asyncFn().finally(() => {
      this.endTimer(key);
    });
  }

  deferInteraction(callback: () => void): void {
    InteractionManager.runAfterInteractions(() => {
      callback();
    });
  }

  logMemoryUsage(): void {
    if (this.isDevelopment) {
      // This is a placeholder - in a real app you'd use a library like react-native-performance
      console.log('📊 Memory usage monitoring available with react-native-performance');
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook for measuring component render times
export const usePerformanceMeasure = (componentName: string) => {
  const startRender = () => {
    if (__DEV__) {
      performanceMonitor.startTimer(`${componentName}-render`);
    }
  };

  const endRender = () => {
    if (__DEV__) {
      performanceMonitor.endTimer(`${componentName}-render`);
    }
  };

  return { startRender, endRender };
}; 