import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { profileHeaderStyles } from '../styles/ProfileHeaderStyles';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function ProfileHeader({ 
  navigation, 
  isOwnProfile, 
  userProfile, 
  viewingUserName,
  profileStats,
  onQRCode,
  onAddFriend,
  onUserMenuPress,
  onUploadWork
}) {
  const { t } = useLanguage();

  return (
    <View>
      <View style={profileHeaderStyles.header}>
        <View style={profileHeaderStyles.leftSection}>
          {!isOwnProfile ? (
            <TouchableOpacity onPress={function() { navigation.goBack(); }} style={profileHeaderStyles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <Text style={profileHeaderStyles.title}>{t('myProfile')}</Text>
          )}
        </View>
        
        <View style={profileHeaderStyles.rightSection}>
          {isOwnProfile ? (
            <TouchableOpacity onPress={function() { navigation.navigate('ProfileEdit'); }}>
              <Ionicons name="create-outline" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={profileHeaderStyles.profileActions}>
              <TouchableOpacity style={profileHeaderStyles.addFriendButton} onPress={onAddFriend}>
                <Ionicons name="person-add-outline" size={20} color="white" />
                <Text style={profileHeaderStyles.addFriendText}>{t('addFriend')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={profileHeaderStyles.menuButton} 
                onPress={onUserMenuPress}
              >
                <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={profileHeaderStyles.profileSection}>
        <Text style={profileHeaderStyles.userName}>
          {userProfile?.username || viewingUserName || t('defaultUsername')}
        </Text>
        <Text style={profileHeaderStyles.userBio}>{userProfile?.short_intro || (isOwnProfile ? t('shortIntroPlaceholder') : '')}</Text>
        
        <View style={profileHeaderStyles.statsContainer}>
          {profileStats.map(function(stat) {
            return (
              <View key={stat.label} style={profileHeaderStyles.statItem}>
                <Text style={profileHeaderStyles.statValue}>{stat.value}</Text>
                <Text style={profileHeaderStyles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        {isOwnProfile && (
          <TouchableOpacity 
            style={profileHeaderStyles.qrButton} 
            onPress={onQRCode}
          >
            <Text style={profileHeaderStyles.qrButtonText}>{t('qrCode')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isOwnProfile && (
        <TouchableOpacity 
          style={profileHeaderStyles.settingItem}
          onPress={onUploadWork}
        >
          <View style={profileHeaderStyles.settingLeft}>
            <Ionicons name="cloud-upload-outline" size={24} color="#000000" />
            <Text style={profileHeaderStyles.settingText}>{t('uploadWork')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}