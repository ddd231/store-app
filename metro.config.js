const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// React Native SVG 호환성 문제 해결
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
};

module.exports = config;