import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { profileFooterStyles } from '../styles/ProfileFooterStyles';
import QRCodeModal from '../../../components/QRCodeModal';

export default function ProfileModals({
  qrModalVisible,
  setQrModalVisible,
  uploadModalVisible, 
  setUploadModalVisible,
  userMenuVisible,
  setUserMenuVisible,
  currentUser,
  userProfile,
  navigation,
  onUserMenuPress
}) {
  return (
    <>
      <QRCodeModal
        visible={qrModalVisible}
        onClose={function() { setQrModalVisible(false); }}
        userId={currentUser?.id || ''}
        userName={userProfile?.username || '사용자 이름'}
      />
      
      <Modal
        visible={uploadModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={function() { setUploadModalVisible(false); }}
      >
        <TouchableOpacity 
          style={profileFooterStyles.modalOverlay}
          activeOpacity={1}
          onPress={function() { setUploadModalVisible(false); }}
        >
          <View style={profileFooterStyles.modalContent}>
            <TouchableOpacity 
              style={profileFooterStyles.modalButton}
              onPress={function() {
                setUploadModalVisible(false);
                navigation.navigate('WorkUpload', { type: 'novel' });
              }}
            >
              <Text style={profileFooterStyles.modalButtonText}>소설업로드</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={profileFooterStyles.modalButton}
              onPress={function() {
                setUploadModalVisible(false);
                navigation.navigate('WorkUpload', { type: 'painting' });
              }}
            >
              <Text style={profileFooterStyles.modalButtonText}>그림업로드</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[profileFooterStyles.modalButton, profileFooterStyles.cancelButton]}
              onPress={function() { setUploadModalVisible(false); }}
            >
              <Text style={profileFooterStyles.modalButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={userMenuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={function() { setUserMenuVisible(false); }}
      >
        <View style={profileFooterStyles.menuOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject} 
            activeOpacity={1} 
            onPress={function() { setUserMenuVisible(false); }}
          />
          <View style={profileFooterStyles.userMenuContainer}>
            <TouchableOpacity
              style={profileFooterStyles.userMenuItem}
              onPress={function() { onUserMenuPress('hide'); }}
            >
              <Ionicons name="eye-off-outline" size={20} color={theme.colors.text.primary} />
              <Text style={profileFooterStyles.userMenuText}>사용자 숨김</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={profileFooterStyles.userMenuItem}
              onPress={function() { onUserMenuPress('report'); }}
            >
              <Ionicons name="flag-outline" size={20} color={theme.colors.text.primary} />
              <Text style={profileFooterStyles.userMenuText}>신고</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[profileFooterStyles.userMenuItem, profileFooterStyles.lastMenuItem]}
              onPress={function() { onUserMenuPress('block'); }}
            >
              <Ionicons name="ban-outline" size={20} color={theme.colors.error} />
              <Text style={[profileFooterStyles.userMenuText, { color: theme.colors.error }]}>차단</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}