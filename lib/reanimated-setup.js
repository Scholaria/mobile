// Reanimated setup and configuration
import 'react-native-reanimated';

// Suppress strict mode warnings in development
if (__DEV__) {
  // Disable strict mode warnings for Reanimated
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('[Reanimated] Reading from `value` during component render')) {
      return; // Suppress this specific warning
    }
    originalConsoleWarn.apply(console, args);
  };
} 