import React, { useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share, Platform } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useLanguage } from '../contexts/LanguageContext';

export default function QRCodeModal({ visible, onClose, userId, userName }) {
  const { t } = useLanguage();
  const profileUrl = `https://arld.app/profile/${userId}`;
  const viewShotRef = useRef();
  
  async function handleShare() {
    try {
      const message = `${userName}${t('qrShareMessage')}\n${profileUrl}`;
      
      if (Platform.OS === 'web') {
        // 웹에서는 navigator.share API 사용
        if (navigator.share) {
          const svg = document.querySelector('#qr-code-svg');
          if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            await new Promise(function(resolve) {
              img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(async function(blob) {
                  const file = new File([blob], `${userName}_ARLD_QR.png`, { type: 'image/png' });
                  
                  try {
                    await navigator.share({
                      title: `${userName}님의 ARLD 프로필`,
                      text: message,
                      files: [file],
                      url: profileUrl
                    });
                  } catch (shareError) {
                    // 파일 공유가 지원되지 않으면 텍스트만 공유
                    await navigator.share({
                      title: `${userName}님의 ARLD 프로필`,
                      text: message,
                      url: profileUrl
                    });
                  }
                  resolve();
                });
              };
              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            });
          }
        } else {
          // navigator.share가 없으면 링크만 복사
          await navigator.clipboard.writeText(message);
          alert('프로필 링크가 클립보드에 복사되었습니다!');
        }
      } else {
        // 모바일에서는 이미지 캡처 후 텍스트와 함께 공유
        const uri = await viewShotRef.current.capture();
        
        // Share.share를 사용하여 이미지 URI와 텍스트 함께 공유
        if (Platform.OS === 'ios') {
          await Share.share({
            url: uri,
            message: message,
          });
        } else {
          // Android는 url과 message를 동시에 지원하지 않을 수 있으므로
          // Sharing API 사용
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `${userName}님의 ARLD 프로필`,
            UTI: 'image/png',
          });
          
          // 이미지 공유 후 텍스트도 공유하려면
          setTimeout(async function() {
            await Share.share({
              message: message,
              title: `${userName}님의 프로필`,
            });
          }, 500);
        }
      }
    } catch (error) {
      console.error('공유 중 오류:', error);
      // 오류 발생 시 기본 텍스트 공유
      try {
        await Share.share({
          message: `${userName}님의 ARLD 프로필을 확인해보세요!\n${profileUrl}`,
          title: `${userName}님의 프로필`,
        });
      } catch (fallbackError) {
        console.error('텍스트 공유도 실패:', fallbackError);
      }
    }
  };
  
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
              <Text style={styles.title}>{t('qrCode')}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* QR 코드 영역 */}
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
              <View style={styles.qrContainer}>
                <View style={styles.qrPlaceholder}>
                  {userId ? (
                    <QRCode
                      value={profileUrl}
                      size={200}
                      color={theme.colors.text.primary}
                      backgroundColor={theme.colors.surface}
                      getRef={function(c) {
                        if (c && Platform.OS === 'web') {
                          const svg = c._qrcode;
                          if (svg) svg.setAttribute('id', 'qr-code-svg');
                        }
                      }}
                    />
                  ) : (
                    <Ionicons name="qr-code" size={200} color={theme.colors.text.secondary} />
                  )}
                </View>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.profileUrl}>{profileUrl}</Text>
              </View>
            </ViewShot>

            {/* 설명 */}
            <Text style={styles.description}>
              {t('qrCodeDescription')}
            </Text>

            {/* 버튼 */}
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="white" />
              <Text style={styles.shareButtonText}>{t('share')}</Text>
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
    color: '#000000',
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
    color: '#000000',
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

