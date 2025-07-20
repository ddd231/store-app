import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useLanguage } from '../../../contexts/LanguageContext';
import { profileStyles } from '../styles/ProfileStyles';
import ProfileHeader from '../components/ProfileHeader';
import ProfileTabs from '../components/ProfileTabs';
import ProfileInfoTab from '../components/ProfileInfoTab';
import ProfileGallery from '../components/ProfileGallery';
import ProfileFooter from '../components/ProfileFooter';
import ProfileModals from '../components/ProfileModals';
import ProfilePortfolio from '../components/ProfilePortfolio';
import { useProfileData } from '../hooks/useProfileData';
import { useProfileActions } from '../hooks/useProfileActions';
import { useProfileMenu } from '../hooks/useProfileMenu';
import { BottomBannerAd } from '../../../shared';

export default function ProfileScreen({ navigation, route }) {
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState('portfolio');
  
  const viewingUserId = route?.params?.userId;
  const viewingUserName = route?.params?.userName;

  const {
    myWorks,
    myGalleries,
    loading,
    user,
    userProfile,
    currentUser,
    isOwnProfile,
    profileStats,
    checkCurrentUser,
    loadUserAndWorksForUser
  } = useProfileData(viewingUserId);

  const {
    qrModalVisible,
    setQrModalVisible,
    uploadModalVisible,
    setUploadModalVisible,
    handleQRCode,
    handleAddFriend,
    handleHideUser
  } = useProfileActions(currentUser, viewingUserId, viewingUserName, navigation);

  const {
    userMenuVisible,
    setUserMenuVisible,
    handleUserMenuPress
  } = useProfileMenu(handleHideUser);

  useEffect(function() {
    checkCurrentUser();
  }, [viewingUserId]);
  
  useEffect(function() {
    if (viewingUserId) {
      const newIsOwnProfile = currentUser ? (viewingUserId === currentUser.id) : false;
      loadUserAndWorksForUser(newIsOwnProfile);
    } else if (currentUser !== null) {
      loadUserAndWorksForUser(true);
    }
  }, [viewingUserId, currentUser]);

  useEffect(function() {
    const unsubscribe = navigation.addListener('focus', function() {
      checkCurrentUser();
      if (currentUser !== null) {
        const currentIsOwnProfile = viewingUserId ? (viewingUserId === currentUser.id) : true;
        loadUserAndWorksForUser(currentIsOwnProfile);
      }
    });
    return unsubscribe;
  }, [navigation, currentUser, viewingUserId]);

  const tabButtons = [
    { id: 'portfolio', name: 'PORTFOLIO' },
    { id: 'info', name: 'INFO' },
    { id: 'gallery', name: 'GALLERY' },
  ];

  const menuItems = [
    { id: 'friends', title: t('friendsList'), icon: 'people-outline' },
    { id: 'saved', title: t('bookmarks'), icon: 'bookmark-outline' },
    { id: 'settings', title: t('settings'), icon: 'settings-outline' },
  ];

  function renderHeader() {
    return (
      <View>
        <ProfileHeader
          navigation={navigation}
          isOwnProfile={isOwnProfile}
          userProfile={userProfile}
          viewingUserName={viewingUserName}
          profileStats={profileStats}
          onQRCode={handleQRCode}
          onAddFriend={handleAddFriend}
          onUserMenuPress={function() { setUserMenuVisible(true); }}
          onUploadWork={function() { setUploadModalVisible(true); }}
        />
        
        <ProfileTabs
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          tabButtons={tabButtons}
        />

        {selectedTab === 'info' && (
          <ProfileInfoTab userProfile={userProfile} />
        )}

        {selectedTab === 'gallery' && (
          <ProfileGallery
            myGalleries={myGalleries}
            navigation={navigation}
            isOwnProfile={isOwnProfile}
          />
        )}

        {loading && (
          <View style={profileStyles.loadingContainer}>
            <Text style={profileStyles.loadingText}>로딩 중...</Text>
          </View>
        )}
      </View>
    );
  }

  function renderFooter() {
    return (
      <ProfileFooter
        navigation={navigation}
        isOwnProfile={isOwnProfile}
        menuItems={menuItems}
      />
    );
  }

  function renderWorkItem({ item }) {
    return <ProfilePortfolio item={item} navigation={navigation} />;
  }

  const portfolioData = useMemo(function() {
    return selectedTab === 'portfolio' ? myWorks : [];
  }, [selectedTab, myWorks]);

  return (
    <View style={profileStyles.container}>
      <FlatList
        data={portfolioData}
        renderItem={renderWorkItem}
        keyExtractor={function(item, index) { return item?.id?.toString() || index.toString(); }}
        numColumns={3}
        columnWrapperStyle={profileStyles.portfolioRow}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={profileStyles.flatListContent}
        removeClippedSubviews={false}
      />
      
      <ProfileModals
        qrModalVisible={qrModalVisible}
        setQrModalVisible={setQrModalVisible}
        uploadModalVisible={uploadModalVisible}
        setUploadModalVisible={setUploadModalVisible}
        userMenuVisible={userMenuVisible}
        setUserMenuVisible={setUserMenuVisible}
        currentUser={currentUser}
        userProfile={userProfile}
        navigation={navigation}
        onUserMenuPress={handleUserMenuPress}
      />
      
      {/* Bottom Banner Ad */}
      <BottomBannerAd />
    </View>
  );
}