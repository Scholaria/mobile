const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname);

// Performance optimizations
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.sourceExts = ['js', 'json', 'ts', 'tsx', 'jsx', 'cjs'];

// Platform-specific resolver to avoid native-only modules on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add platform-specific module resolution
config.resolver.platformExtensions = ['web.js', 'web.ts', 'web.tsx', 'js', 'ts', 'tsx'];

// Enable Hermes for better performance
config.transformer.enableHermes = true;

// Optimize bundle size
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Enable tree shaking
config.transformer.unstable_allowRequireContext = true;

module.exports = withNativeWind(config, { input: './global.css' });