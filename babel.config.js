module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated/plugin은 마지막에 와야 함
      'react-native-reanimated/plugin'
    ],
    env: {
      production: {
        plugins: [
          // 프로덕션에서 Hermes 최적화
          'react-native-reanimated/plugin'
        ]
      }
    }
  };
};