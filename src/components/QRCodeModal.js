import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

export default function QRCodeModal({ visible, onClose, userId, userName }) {
  const profileUrl = `https://arld.app/profile/${userId}`;
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1}>
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.title}>QR 코드</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* QR 코드 영역 */}
            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                {userId ? (
                  <QRCode
                    value={profileUrl}
                    size={200}
                    color={theme.colors.text.primary}
                    backgroundColor={theme.colors.surface}
                  />
                ) : (
                  <Ionicons name="qr-code" size={200} color={theme.colors.text.secondary} />
                )}
              </View>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.profileUrl}>{profileUrl}</Text>
            </View>

            {/* 설명 */}
            <Text style={styles.description}>
              다른 사용자가 이 QR 코드를 스캔하면{'\n'}
              내 프로필을 바로 볼 수 있습니다
            </Text>

            {/* 버튼 */}
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color="white" />
              <Text style={styles.shareButtonText}>공유하기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    ...theme.typography.heading,
    fontWeight: '600',
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  userName: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  profileUrl: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});