import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { profileFooterStyles } from '../styles/ProfileFooterStyles';

export default function ProfileTabs({ selectedTab, setSelectedTab, tabButtons }) {
  return (
    <View style={profileFooterStyles.tabsContainer}>
      {tabButtons.map(function(tab) {
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              profileFooterStyles.tabButton,
              selectedTab === tab.id && profileFooterStyles.tabButtonActive
            ]}
            onPress={function() { setSelectedTab(tab.id); }}
          >
            <Text style={[
              profileFooterStyles.tabText,
              selectedTab === tab.id && profileFooterStyles.tabTextActive
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}