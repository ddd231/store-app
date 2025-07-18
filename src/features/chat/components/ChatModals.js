import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { useLanguage } from '../../../contexts/LanguageContext';

const ChatModals = React.memo(function ChatModals({
  modalVisible,
  renameModalVisible,
  selectedRoom,
  newRoomName,
  setNewRoomName,
  onCloseModal,
  onCloseRenameModal,
  onOpenRenameModal,
  onLeaveRoom,
  onRenameRoom
}) {
  const { t } = useLanguage();

  function handleLeaveRoom() {
    Alert.alert(
      t('leaveChatRoom'),
      t('confirmLeaveChatRoom'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('leave'), 
          style: 'destructive', 
          onPress: function() {
            onLeaveRoom(selectedRoom.id);
            onCloseModal();
          }
        }
      ]
    );
  }

  function handleRenameRoom() {
    if (newRoomName.trim()) {
      onRenameRoom(selectedRoom.id, newRoomName.trim());
      onCloseRenameModal();
    }
  }

  return (
    <>
      {/* 채팅방 옵션 모달 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={onCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={[StyleSheet.absoluteFillObject]} 
            activeOpacity={1} 
            onPress={onCloseModal}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedRoom?.name}</Text>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={function() { onOpenRenameModal(selectedRoom); }}
            >
              <Ionicons name="create-outline" size={24} color="#000000" />
              <Text style={styles.modalOptionText}>{t('rename')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleLeaveRoom}>
              <Ionicons name="exit-outline" size={24} color={theme.colors.error} />
              <Text style={[styles.modalOptionText, { color: theme.colors.error }]}>
                {t('leaveChatRoom')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalCancel} onPress={onCloseModal}>
              <Text style={styles.modalCancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 채팅방 이름 변경 모달 */}
      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={onCloseRenameModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={[StyleSheet.absoluteFillObject]} 
            activeOpacity={1} 
            onPress={onCloseRenameModal}
          />
          <View style={styles.renameModalContent}>
            <Text style={styles.modalTitle}>{t('renameChatRoom')}</Text>
            
            <TextInput
              style={styles.renameInput}
              value={newRoomName}
              onChangeText={setNewRoomName}
              placeholder={t('enterNewName')}
              placeholderTextColor={theme.colors.text.placeholder}
              autoFocus={true}
            />
            
            <View style={styles.renameButtons}>
              <TouchableOpacity style={styles.renameCancel} onPress={onCloseRenameModal}>
                <Text style={styles.renameCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.renameConfirm} onPress={handleRenameRoom}>
                <Text style={styles.renameConfirmText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    ...theme.shadows.large,
  },
  modalTitle: {
    ...theme.typography.body,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: '#000000',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  modalOptionText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.md,
    color: '#000000',
  },
  modalCancel: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  modalCancelText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  renameModalContent: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    ...theme.shadows.large,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body,
    marginBottom: theme.spacing.lg,
  },
  renameButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  renameCancel: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  renameCancelText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  renameConfirm: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    marginLeft: theme.spacing.sm,
  },
  renameConfirmText: {
    ...theme.typography.body,
    color: 'white',
    fontWeight: '600',
  },
});

export default ChatModals;