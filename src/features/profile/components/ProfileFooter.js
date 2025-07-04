import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { profileFooterStyles } from '../styles/ProfileFooterStyles';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function ProfileFooter({ navigation, isOwnProfile, menuItems }) {
  const { t } = useLanguage();

  return (
    <View>
      {isOwnProfile && (
        <>
          <View style={profileFooterStyles.menuSection}>
            {menuItems.map(function(item) {
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={profileFooterStyles.menuItem}
                  onPress={function() {
                    if (item.id === 'settings') {
                      navigation.navigate('Settings');
                    } else if (item.id === 'saved') {
                      navigation.navigate('Bookmarks');
                    } else if (item.id === 'friends') {
                      navigation.navigate('FriendsList');
                    }
                  }}
                >
                  <View style={profileFooterStyles.menuLeft}>
                    <Ionicons name={item.icon} size={24} color={theme.colors.text.primary} />
                    <Text style={profileFooterStyles.menuText}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={profileFooterStyles.logoutButton}>
            <Text style={profileFooterStyles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}