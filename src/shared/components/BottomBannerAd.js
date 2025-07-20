import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// AdMob 모듈을 조건부로 import
let BannerAd, BannerAdSize, TestIds;
try {
  const AdMob = require('react-native-google-mobile-ads');
  BannerAd = AdMob.BannerAd;
  BannerAdSize = AdMob.BannerAdSize;
  TestIds = AdMob.TestIds;
} catch (error) {
  console.log('AdMob not available in Expo Go');
}

// 하단 배너 광고 단위 ID
const bottomBannerAdUnitId = Platform.select({
  ios: 'ca-app-pub-3406933300576517/6812391098',
  android: 'ca-app-pub-3406933300576517/6812391098',
});

export default function BottomBannerAd({ style }) {
  // AdMob가 없으면 아무것도 렌더링하지 않음
  if (!BannerAd) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={__DEV__ ? TestIds.BANNER : bottomBannerAdUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={function() {
          console.log('Bottom banner ad loaded successfully');
        }}
        onAdFailedToLoad={function(error) {
          console.log('Bottom banner ad failed to load:', error);
        }}
        onAdOpened={function() {
          console.log('Bottom banner ad opened');
        }}
        onAdClosed={function() {
          console.log('Bottom banner ad closed');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});