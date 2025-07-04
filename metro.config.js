const { getDefaultConfig } = require('expo/metro-config');

let config = getDefaultConfig(__dirname);

// React Native SVG 호환성 문제 해결 및 모듈 해상도 안정화
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
  // Hermes 호환성을 위한 추가 설정
  platforms: ['ios', 'android', 'web'],
  disableHierarchicalLookup: false,
};

// 번들 크기 최적화 및 Hermes 호환성 개선
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
  // Hermes 호환성을 위한 추가 설정
  hermesCommand: 'hermes',
  enableHermes: true,
};

// 프로덕션 모드에서 소스맵 비활성화 (번들 크기 감소)
if (process.env.NODE_ENV === 'production') {
  config.serializer = {
    ...config.serializer,
    createModuleIdFactory: () => (path) => {
      // 모듈 ID를 짧게 만들어 번들 크기 감소
      return require('crypto').createHash('md5').update(path).digest('hex').substr(0, 8);
    },
  };
}

// Reanimated Metro 설정 래핑
try {
  const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
  config = wrapWithReanimatedMetroConfig(config);
} catch (e) {
  // Reanimated가 설치되지 않은 경우 무시
  console.log('Reanimated metro config not found');
}

module.exports = config;