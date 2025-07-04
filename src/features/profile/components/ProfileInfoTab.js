import React from 'react';
import { View, Text } from 'react-native';
import { profileFooterStyles } from '../styles/ProfileFooterStyles';

export default function ProfileInfoTab({ userProfile }) {
  return (
    <View style={profileFooterStyles.infoContainer}>
      {userProfile?.info && (
        <Text style={profileFooterStyles.infoText}>{userProfile.info}</Text>
      )}
    </View>
  );
}